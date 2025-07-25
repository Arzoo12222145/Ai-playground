import { create } from 'zustand';
import axios from 'axios';

export const usePlaygroundStore = create((set, get) => ({
  sessionId: null,
  chat: [],
  code: '',
  css: '',
  loading: false,
  error: '',

  setSessionId: (id) => set({ sessionId: id }),
  setChat: (chat) => set({ chat }),
  setCode: (code) => set({ code }),
  setCss: (css) => set({ css }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Auto-save to backend
  autoSave: async () => {
    const { sessionId, chat, code, css } = get();
    const token = localStorage.getItem('token');
    if (!token) return;
    // Only save if there is at least one user message or code/css
    const hasContent = (Array.isArray(chat) && chat.some(m => m.role === 'user' && m.content && m.content.trim())) || (code && code.trim()) || (css && css.trim());
    if (!hasContent) return;
    try {
      if (sessionId) {
        await axios.put(`http://localhost:5000/api/session/${sessionId}`,
          { chatHistory: chat, code, css },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const res = await axios.post('http://localhost:5000/api/session',
          { chatHistory: chat, code, css },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        set({ sessionId: res.data._id });
      }
    } catch (err) {
      // Optionally handle error
    }
  },

  // Load a session by ID
  loadSession: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ loading: true, error: '' });
    try {
      const res = await axios.get(`http://localhost:5000/api/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({
        sessionId: res.data._id,
        chat: res.data.chatHistory || [],
        code: res.data.code || '',
        css: res.data.css || '',
        loading: false,
      });
    } catch (err) {
      set({ error: 'Failed to load session', loading: false });
    }
  },

  // Load all sessions for the user
  loadAllSessions: async () => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    try {
      const res = await axios.get('http://localhost:5000/api/session', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch {
      return [];
    }
  },

  // Reset state for new session
  newSession: () => set({ sessionId: null, chat: [], code: '', css: '' }),

  deleteSession: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.delete(`http://localhost:5000/api/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // If the deleted session is the current one, reset state
      if (get().sessionId === id) {
        set({ sessionId: null, chat: [], code: '', css: '' });
      }
    } catch (err) {
      // Optionally handle error
    }
  },
})); 