import React, { useEffect } from 'react';

/**
 * SalesLandingV7 - A nova Landing Page Profissional Oficial.
 * Carrega o bundle HTML original mantendo 100% da fidelidade visual.
 */
export const SalesLandingV7: React.FC<{ onLoginClick?: () => void }> = React.memo(({ onLoginClick }) => {
  
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
        id="v7-iframe"
        key="static-v7-iframe"
        src="/landing.html?v=1.0.8" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Fábrica de Best Seller - Landing Page"
        loading="eager"
      />
      
      {/* Botão de Login Flutuante Opcional - Reposicionado para não atrapalhar o checkout */}
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
});
