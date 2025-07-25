'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #6ee7b7 0%, #3b82f6 100%)' }}>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(60,120,200,0.10)', padding: '48px 36px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontWeight: 800, fontSize: '2.3em', marginBottom: 12, letterSpacing: 1, color: '#3b82f6' }}>
          <span role="img" aria-label="rocket">🚀</span> AI Micro-Frontend Playground
        </h1>
        <p style={{ color: '#444', fontSize: '1.1em', marginBottom: 32 }}>
          Instantly generate, preview, and export beautiful React components with the power of AI.<br />
          <span style={{ color: '#10b981', fontWeight: 600 }}>Sign up or log in to get started!</span>
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 12 }}>
          <Link href="/login" style={{ flex: 1, background: 'linear-gradient(90deg,#3b82f6,#6ee7b7)', color: '#fff', borderRadius: 8, padding: '0.8em 0', fontWeight: 700, fontSize: '1.1em', textDecoration: 'none', boxShadow: '0 2px 8px rgba(60,120,200,0.08)', transition: 'background 0.2s' }}>Login</Link>
          <Link href="/signup" style={{ flex: 1, background: 'linear-gradient(90deg,#6ee7b7,#3b82f6)', color: '#fff', borderRadius: 8, padding: '0.8em 0', fontWeight: 700, fontSize: '1.1em', textDecoration: 'none', boxShadow: '0 2px 8px rgba(60,120,200,0.08)', transition: 'background 0.2s' }}>Sign Up</Link>
        </div>
        <div style={{ color: '#aaa', fontSize: '0.98em', marginTop: 18 }}>
          <span role="img" aria-label="sparkles">✨</span> Your AI-powered component journey starts here.
        </div>
      </div>
    </div>
  );
}
