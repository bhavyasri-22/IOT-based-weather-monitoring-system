import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const onScroll = () => setVisible(window.scrollY > 360); window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); return () => window.removeEventListener('scroll', onScroll); }, []);
  if (!visible) return null;
  return <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="fixed bottom-5 right-5 z-50 rounded-full p-3 text-white shadow-lg" style={{ background: '#1565c0' }}><ArrowUp size={18} /></button>;
}
