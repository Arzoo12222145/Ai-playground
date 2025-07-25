import { useState, useEffect } from 'react';

export default function PropertyEditor({ rect, properties, onChange, onClose }) {
  const [text, setText] = useState(properties.text || '');
  const [color, setColor] = useState(properties.color || '#3b82f6');
  const [bg, setBg] = useState(properties.bg || '#fff');
  const [fontSize, setFontSize] = useState(properties.fontSize || 16);
  const [radius, setRadius] = useState(properties.radius || 8);

  useEffect(() => {
    setText(properties.text || '');
    setColor(properties.color || '#3b82f6');
    setBg(properties.bg || '#fff');
    setFontSize(properties.fontSize || 16);
    setRadius(properties.radius || 8);
  }, [properties]);

  return (
    <div style={{
      position: 'fixed',
      left: rect ? rect.right + 12 : 100,
      top: rect ? rect.top : 100,
      zIndex: 1000,
      background: '#fff',
      border: '1.5px solid #e0e7ef',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(60,120,200,0.13)',
      padding: 18,
      minWidth: 220,
      maxWidth: 320,
      fontSize: '1em',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Edit Properties</div>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Text:
        <input type="text" value={text} onChange={e => setText(e.target.value)} style={{ width: '100%' }} />
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Text Color:
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 40, height: 28, marginLeft: 8 }} />
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Background:
        <input type="color" value={bg} onChange={e => setBg(e.target.value)} style={{ width: 40, height: 28, marginLeft: 8 }} />
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Font Size:
        <input type="range" min={10} max={48} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
        <span style={{ marginLeft: 8 }}>{fontSize}px</span>
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Border Radius:
        <input type="range" min={0} max={32} value={radius} onChange={e => setRadius(Number(e.target.value))} />
        <span style={{ marginLeft: 8 }}>{radius}px</span>
      </label>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button onClick={() => onChange({ text, color, bg, fontSize, radius })} style={{ flex: 1 }}>Apply</button>
        <button onClick={onClose} style={{ flex: 1, background: '#e11d48' }}>Close</button>
      </div>
    </div>
  );
} 