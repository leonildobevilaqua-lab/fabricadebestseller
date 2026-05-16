import React, { useEffect } from 'react';

/**
 * SalesLandingV7 - A nova Landing Page Profissional Oficial.
 * Carrega o bundle HTML original mantendo 100% da fidelidade visual.
 */
export const SalesLandingV7: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  
  useEffect(() => {
    // Escuta mensagens vindas de dentro do iframe (para o botão de Login)
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'open_login') {
        if (onLoginClick) onLoginClick();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginClick]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0, background: '#000' }}>
      <iframe 
        src="/landing.html" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Fábrica de Best Seller - Landing Page"
      />
      
      {/* Botão de Login Flutuante Opcional (Caso o bundle não tenha um fácil de clicar) */}
      <button 
        onClick={onLoginClick}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(255,255,255,0.1)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '14px',
          backdropFilter: 'blur(5px)'
        }}
      >
        Área de Membros
      </button>
    </div>
  );
};
