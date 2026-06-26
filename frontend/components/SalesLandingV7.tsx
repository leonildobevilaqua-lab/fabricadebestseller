import React, { useEffect, useState } from 'react';

// Calcula o índice da headline no contexto DA PÁGINA PAI (não do iframe)
// para evitar problemas de isolamento de localStorage e cache do iframe.
function getHeadlineIndex(): number {
  const TOTAL = 5;
  const KEY = 'fbs-headline-index';
  try {
    const saved = localStorage.getItem(KEY);
    const parsed = parseInt(saved ?? '', 10);
    const next = isNaN(parsed) ? 0 : (parsed + 1) % TOTAL;
    localStorage.setItem(KEY, String(next));
    return next;
  } catch {
    return Math.floor(Math.random() * TOTAL);
  }
}

/**
 * SalesLandingV7 - A nova Landing Page Profissional Oficial.
 * Carrega o bundle HTML original mantendo 100% da fidelidade visual.
 * A rotação de headlines é calculada aqui e passada via ?hl= na URL do iframe.
 */
export const SalesLandingV7: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  // Estado inicializado uma única vez por montagem do componente
  const [headlineIndex] = useState<number>(getHeadlineIndex);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'open_login') {
        if (onLoginClick) onLoginClick();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginClick]);

  // O índice é embutido na URL — o iframe lê via URLSearchParams, sem depender de localStorage interno
  const iframeSrc = `/landing.html?v=1.1.0&hl=${headlineIndex}`;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0, background: '#000' }}>
      <iframe
        id="v7-iframe"
        key={iframeSrc}
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Fábrica de Best Seller - Landing Page"
        loading="eager"
      />

      <button
        onClick={onLoginClick}
        style={{
          position: 'fixed',
          top: '15px',
          left: '15px',
          zIndex: 9999,
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '6px 12px',
          borderRadius: '15px',
          cursor: 'pointer',
          fontSize: '11px',
          backdropFilter: 'blur(10px)',
          fontWeight: 'bold'
        }}
      >
        Área de Membros
      </button>
    </div>
  );
};
