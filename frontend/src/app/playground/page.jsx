'use client';
import { useEffect, useRef, useState } from 'react';
import { usePlaygroundStore } from '../usePlaygroundStore';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PropertyEditor from './PropertyEditor';

const tabStyles = {
  display: 'flex',
  gap: 0,
  borderBottom: '2px solid #e0e7ef',
  marginBottom: 8,
};
const tabBtnStyles = isActive => ({
  flex: 1,
  padding: '0.7em 0',
  background: isActive ? '#f6f8fa' : '#fff',
  border: 'none',
  borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
  color: isActive ? '#3b82f6' : '#888',
  fontWeight: 600,
  fontSize: '1em',
  cursor: 'pointer',
  outline: 'none',
  transition: 'all 0.2s',
});

function ChatBubble({ role, content }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
      marginBottom: 8,
    }}>
      <div style={{
        background: role === 'user' ? 'linear-gradient(90deg,#6ee7b7,#3b82f6)' : '#fff',
        color: role === 'user' ? '#fff' : '#222',
        borderRadius: 16,
        padding: '0.7em 1.1em',
        maxWidth: '80%',
        boxShadow: '0 2px 8px rgba(60,120,200,0.07)',
        fontSize: '1em',
        border: role === 'user' ? 'none' : '1.5px solid #e0e7ef',
        wordBreak: 'break-word',
        animation: 'fadeIn 0.3s',
      }}>
        {content}
      </div>
    </div>
  );
}

function getSessionName(session) {
  const firstPrompt = session.chatHistory?.find(m => m.role === 'user')?.content || 'Untitled';
  const short = firstPrompt.length > 30 ? firstPrompt.slice(0, 30) + '...' : firstPrompt;
  const date = session.createdAt ? new Date(session.createdAt).toLocaleString() : '';
  return `${short} (${date})`;
}

export default function PlaygroundPage() {
  const {
    sessionId, chat, code, css, loading, error, tab,
    setChat, setCode, setCss, setLoading, setError, setSessionId,
    autoSave, loadSession, loadAllSessions, newSession, deleteSession
  } = usePlaygroundStore();
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [tabState, setTab] = useState('preview');
  const [sessions, setSessions] = useState([]);
  const chatEndRef = useRef(null);
  const router = useRouter();
  // Iframe ref for preview
  const iframeRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  const tabListRef = useRef(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorRect, setEditorRect] = useState(null);
  const [editorProps, setEditorProps] = useState({});
  const [overrideMode, setOverrideMode] = useState(false);
  const [overridePrompt, setOverridePrompt] = useState('');
  const [selectedElementInfo, setSelectedElementInfo] = useState(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // On mount, load all sessions and last session
  useEffect(() => {
    (async () => {
      const all = await loadAllSessions();
      setSessions(all);
      if (all.length > 0) {
        await loadSession(all[all.length - 1]._id);
      } else {
        newSession();
      }
    })();
  }, []);

  // Auto-save after chat/code/css change
  useEffect(() => { autoSave(); }, [chat, code, css]);

  // When sessionId changes, update session list (for new chat)
  useEffect(() => {
    (async () => {
      const all = await loadAllSessions();
      setSessions(all);
    })();
  }, [sessionId]);

  // Update iframe content when code/css changes
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>${css || ''}</style></head><body style='margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f6f8fa;'>${code || ''}</body></html>`);
    doc.close();
  }, [code, css]);

  // Keyboard navigation for sessions
  useEffect(() => {
    function handleKeyDown(e) {
      if (!sidebarOpen) return;
      if (document.activeElement && sidebarRef.current && sidebarRef.current.contains(document.activeElement)) {
        const idx = sessions.findIndex(s => s._id === sessionId);
        if (e.key === 'ArrowDown' && idx < sessions.length - 1) {
          loadSession(sessions[idx + 1]._id);
        } else if (e.key === 'ArrowUp' && idx > 0) {
          loadSession(sessions[idx - 1]._id);
        } else if (e.key === 'Delete') {
          deleteSession(sessionId);
        }
      }
      // Tab navigation for code tabs
      if (tabListRef.current && tabListRef.current.contains(document.activeElement)) {
        if (e.key === 'ArrowRight') {
          if (tabState === 'preview') setTab('jsx');
          else if (tabState === 'jsx') setTab('css');
        } else if (e.key === 'ArrowLeft') {
          if (tabState === 'css') setTab('jsx');
          else if (tabState === 'jsx') setTab('preview');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessions, sessionId, tabState, sidebarOpen]);

  // Responsive sidebar toggle
  useEffect(() => {
    function handleResize() {
      setSidebarOpen(window.innerWidth > 700);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setChat([...chat, { role: 'user', content: prompt }]);
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.post(`${apiUrl}/api/ai/generate`, { prompt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiResponse(res.data);
      setChat(prev => [...prev, { role: 'ai', content: res.data.message || 'AI responded.' }]);
      setCode(res.data.jsx);
      setCss(res.data.css);
      setPrompt('');
      setTab('preview');
    } catch (err) {
      setError(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (type) => {
    if (!aiResponse) return;
    const text = type === 'jsx' ? aiResponse.jsx : aiResponse.css;
    navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
    if (!aiResponse) return;
    const zip = require('jszip')();
    zip.file('Component.jsx', aiResponse.jsx);
    zip.file('styles.css', aiResponse.css);
    zip.generateAsync({ type: 'blob' }).then(content => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'component.zip';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  // Click handler for iframe preview (extended for chat-driven override)
  const handleIframeClick = (e) => {
    if (!iframeRef.current) return;
    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;
    // For demo: select the first child element in body
    const el = iframeDoc.body.firstElementChild;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setEditorRect({ top: rect.top + window.scrollY, right: rect.right + window.scrollX });
    setEditorProps({
      text: el.textContent,
      color: el.style.color || '#3b82f6',
      bg: el.style.background || '#fff',
      fontSize: parseInt(el.style.fontSize) || 16,
      radius: parseInt(el.style.borderRadius) || 8,
    });
    setSelectedElementInfo({ tag: el.tagName, text: el.textContent });
    setEditorOpen(true);
  };

  // Chat-driven override handler
  const handleOverride = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // Send the current JSX, CSS, and override prompt to the backend
      const res = await axios.post(`${apiUrl}/api/ai/generate`, {
        prompt: `For the following JSX and CSS, only modify the first <${selectedElementInfo?.tag?.toLowerCase()}> element as per this instruction: ${overridePrompt}. Return ONLY the updated JSX and CSS as a JSON object with 'jsx' and 'css'. Do not change any other part of the code.`,
        jsx: code,
        css: css,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCode(res.data.jsx);
      setCss(res.data.css);
      setOverrideMode(false);
      setEditorOpen(false);
      setOverridePrompt('');
    } catch (err) {
      setError(err.response?.data?.message || 'AI override failed');
    } finally {
      setLoading(false);
    }
  };

  // Apply property changes to JSX/CSS (demo: only for first child element)
  const handleEditorChange = ({ text, color, bg, fontSize, radius }) => {
    // For demo: assume the main element is a <button> or <div>
    let newJsx = code;
    let newCss = css;
    // Update inline style in JSX
    newJsx = newJsx.replace(/style=\{\{([^}]*)\}\}/, `style={{ background: '${bg}', color: '${color}', fontSize: '${fontSize}px', borderRadius: '${radius}px' }}`);
    // Update text content
    newJsx = newJsx.replace(/>([^<]*)</, `>${text}<`);
    // Optionally update CSS (if present)
    newCss = newCss.replace(/background:[^;]+;/, `background: ${bg};`);
    newCss = newCss.replace(/color:[^;]+;/, `color: ${color};`);
    newCss = newCss.replace(/font-size:[^;]+;/, `font-size: ${fontSize}px;`);
    newCss = newCss.replace(/border-radius:[^;]+;/, `border-radius: ${radius}px;`);
    setCode(newJsx);
    setCss(newCss);
    setEditorOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <aside ref={sidebarRef} role="navigation" aria-label="Session list" style={{ width: 270, background: '#fff', borderRight: '1.5px solid #e0e7ef', padding: 0, display: 'flex', flexDirection: 'column', boxShadow: '2px 0 12px rgba(60,120,200,0.04)', zIndex: 2 }}>
          <div style={{ padding: '24px 18px 12px 18px', borderBottom: '1.5px solid #e0e7ef', background: 'linear-gradient(90deg,#6ee7b7,#3b82f6)', color: '#fff', fontWeight: 800, fontSize: '1.2em', letterSpacing: 1 }}>
            <span role="img" aria-label="sparkles">✨</span> Sessions
            <button aria-label="Close sidebar" style={{ float: 'right', background: 'none', color: '#fff', border: 'none', fontSize: '1.3em', cursor: 'pointer' }} onClick={() => setSidebarOpen(false)} tabIndex={0}>×</button>
          </div>
          <button style={{ margin: 18, marginBottom: 0, width: 'calc(100% - 36px)' }} onClick={async () => { newSession(); setAiResponse(null); }} aria-label="Start new chat">+ New Chat</button>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 18px 0' }}>
            {sessions.length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No sessions yet.</div>}
            {sessions.map(s => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 0 0' }}>
                <div
                  onClick={async () => { await loadSession(s._id); setAiResponse(null); }}
                  style={{
                    flex: 1,
                    padding: '14px 8px 14px 18px',
                    cursor: 'pointer',
                    background: s._id === sessionId ? 'linear-gradient(90deg,#6ee7b7,#3b82f6)' : 'transparent',
                    color: s._id === sessionId ? '#fff' : '#222',
                    fontWeight: s._id === sessionId ? 700 : 500,
                    borderRadius: 12,
                    margin: '6px 6px 6px 10px',
                    transition: 'background 0.2s, color 0.2s',
                    boxShadow: s._id === sessionId ? '0 2px 8px rgba(60,120,200,0.08)' : 'none',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                  title={getSessionName(s)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Load session: ${getSessionName(s)}`}
                >
                  {getSessionName(s)}
                </div>
                <button
                  title="Delete session"
                  aria-label="Delete session"
                  style={{ background: 'none', color: '#e11d48', border: 'none', fontSize: '1.2em', marginRight: 8, cursor: 'pointer', padding: 0 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await deleteSession(s._id);
                    const all = await loadAllSessions();
                    setSessions(all);
                    if (s._id === sessionId) {
                      if (all.length > 0) {
                        await loadSession(all[all.length - 1]._id);
                      } else {
                        newSession();
                      }
                    }
                  }}
                  tabIndex={0}
                >🗑️</button>
              </div>
            ))}
          </div>
          <button style={{ margin: 18, marginTop: 0, width: 'calc(100% - 36px)', background: '#e11d48', color: '#fff' }} onClick={handleLogout} aria-label="Logout">Logout</button>
        </aside>
      )}
      {!sidebarOpen && (
        <button aria-label="Open sidebar" style={{ position: 'fixed', left: 8, top: 8, zIndex: 10, background: 'linear-gradient(90deg,#6ee7b7,#3b82f6)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1.5em', padding: '0.2em 0.6em', boxShadow: '0 2px 8px rgba(60,120,200,0.08)' }} onClick={() => setSidebarOpen(true)} tabIndex={0}>☰</button>
      )}
      {/* Main playground area */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 0' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, letterSpacing: 1, fontSize: '2.2em', marginBottom: 0 }}>AI Micro-Frontend Playground</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', width: '100%', maxWidth: 1100 }}>
          {/* Chat Panel */}
          <div style={{ flex: '1 1 340px', minWidth: 320, maxWidth: 400, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(60,120,200,0.07)', padding: 24, display: 'flex', flexDirection: 'column', height: 500 }} role="region" aria-label="Chat panel">
            <h3 style={{ margin: 0, marginBottom: 12, fontWeight: 600, color: '#3b82f6' }}>Chat with AI</h3>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, paddingRight: 4 }}>
              {(!Array.isArray(chat) || chat.length === 0) && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>Start a conversation to generate a component!</div>}
              {Array.isArray(chat) && chat.map((msg, i) => <ChatBubble key={i} role={msg.role} content={msg.content} />)}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }} aria-label="Send prompt to AI">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ask AI to generate a component..."
                style={{ flex: 1, fontSize: '1em' }}
                disabled={loading}
                autoFocus
                aria-label="Prompt input"
              />
              <button type="submit" disabled={loading || !prompt.trim()} style={{ minWidth: 90 }} aria-label="Send prompt">{loading ? 'Sending...' : 'Send'}</button>
            </form>
            <div aria-live="polite" style={{ minHeight: 24 }}>
              {error && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</div>}
            </div>
          </div>
          {/* Component Preview & Export */}
          <div style={{ flex: '2 1 480px', minWidth: 340, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(60,120,200,0.07)', padding: 24, display: 'flex', flexDirection: 'column', height: 500 }} role="region" aria-label="Component preview and export">
            <h3 style={{ margin: 0, marginBottom: 12, fontWeight: 600, color: '#10b981' }}>Component Preview & Export</h3>
            <div ref={tabListRef} role="tablist" aria-label="Code tabs" style={tabStyles}>
              <button type="button" style={tabBtnStyles(tabState === 'preview')} onClick={() => setTab('preview')} role="tab" aria-selected={tabState === 'preview'} tabIndex={0}>Preview</button>
              <button type="button" style={tabBtnStyles(tabState === 'jsx')} onClick={() => setTab('jsx')} role="tab" aria-selected={tabState === 'jsx'} tabIndex={0}>JSX</button>
              <button type="button" style={tabBtnStyles(tabState === 'css')} onClick={() => setTab('css')} role="tab" aria-selected={tabState === 'css'} tabIndex={0}>CSS</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: tabState === 'preview' ? '#f6f8fa' : '#fff', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: 120, position: 'relative' }}>
              {code ? (
                tabState === 'preview' ? (
                  <div style={{ position: 'relative', width: '100%', height: 220 }}>
                    <iframe
                      ref={iframeRef}
                      title="Component Preview"
                      style={{ width: '100%', height: 220, border: '1.5px solid #e0e7ef', borderRadius: 12, background: '#f6f8fa' }}
                      aria-label="Component preview sandbox"
                      onClick={handleIframeClick}
                    />
                    {editorOpen && !overrideMode && (
                      <PropertyEditor
                        rect={editorRect}
                        properties={editorProps}
                        onChange={handleEditorChange}
                        onClose={() => setEditorOpen(false)}
                      >
                        <button style={{ marginTop: 8, width: '100%' }} onClick={() => setOverrideMode(true)}>Chat-driven override</button>
                      </PropertyEditor>
                    )}
                    {editorOpen && overrideMode && (
                      <div style={{ position: 'fixed', left: editorRect ? editorRect.right + 12 : 100, top: editorRect ? editorRect.top : 100, zIndex: 1001, background: '#fff', border: '1.5px solid #e0e7ef', borderRadius: 12, boxShadow: '0 4px 24px rgba(60,120,200,0.13)', padding: 18, minWidth: 260, maxWidth: 340 }}>
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>Chat-driven Override</div>
                        <input type="text" value={overridePrompt} onChange={e => setOverridePrompt(e.target.value)} placeholder="Describe the change..." style={{ width: '100%', marginBottom: 10 }} />
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={handleOverride} disabled={loading || !overridePrompt.trim()} style={{ flex: 1 }}>{loading ? 'Sending...' : 'Apply'}</button>
                          <button onClick={() => setOverrideMode(false)} style={{ flex: 1, background: '#e11d48' }}>Cancel</button>
                        </div>
                        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
                      </div>
                    )}
                  </div>
                ) : tabState === 'jsx' ? (
                  <SyntaxHighlighter language="jsx" style={vscDarkPlus} customStyle={{ borderRadius: 8, fontSize: '0.98em', background: '#23272e', padding: 12 }} aria-label="JSX code">
                    {code}
                  </SyntaxHighlighter>
                ) : (
                  <SyntaxHighlighter language="css" style={vscDarkPlus} customStyle={{ borderRadius: 8, fontSize: '0.98em', background: '#23272e', padding: 12 }} aria-label="CSS code">
                    {css}
                  </SyntaxHighlighter>
                )
              ) : (
                <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>Ask the AI to generate a component to see the preview and code.</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => handleCopy('jsx')} disabled={!code} aria-label="Copy JSX">Copy JSX</button>
              <button onClick={() => handleCopy('css')} disabled={!css} aria-label="Copy CSS">Copy CSS</button>
              <button onClick={handleDownload} disabled={!code} aria-label="Download ZIP">Download ZIP</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}