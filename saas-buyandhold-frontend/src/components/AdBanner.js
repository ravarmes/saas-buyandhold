import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdBanner.css';

const AdBanner = ({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  style = {},
  className = '',
  adTest = false // Para testes em desenvolvimento
}) => {
  const { permissions } = useAuth();

  useEffect(() => {
    // Só carrega anúncios se o usuário não for premium
    if (!permissions?.isPremium && slot) {
      try {
        // Aguarda um pouco para garantir que o DOM está pronto
        const timer = setTimeout(() => {
          // Verifica se o AdSense está disponível
          if (window.adsbygoogle && window.adsbygoogle.loaded) {
            window.adsbygoogle.push({});
          } else if (window.adsbygoogle) {
            // Se ainda não carregou, tenta novamente
            window.adsbygoogle.push({});
          }
        }, 100);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
      }
    }
  }, [permissions?.isPremium, slot]);

  // Não renderiza anúncios para usuários premium ou sem slot
  if (permissions?.isPremium || !slot) {
    return null;
  }

  const defaultStyle = {
    display: 'block',
    ...style
  };

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={defaultStyle}
        data-ad-client="ca-pub-8703883002838699"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
        data-adtest={adTest ? 'on' : 'off'}
      ></ins>
    </div>
  );
};

// Componentes pré-configurados para diferentes tipos de anúncios
export const AdBannerHeader = ({ className = '' }) => (
  <AdBanner
    slot="8703883002838699-1" // Header banner slot
    format="auto"
    responsive={true}
    style={{ width: '100%', height: '90px', minHeight: '90px' }}
    className={`ad-header ${className}`}
  />
);

export const AdBannerSidebar = ({ className = '' }) => (
  <AdBanner
    slot="8703883002838699-2" // Sidebar banner slot
    format="auto"
    responsive={true}
    style={{ width: '300px', height: '250px', maxWidth: '300px' }}
    className={`ad-sidebar ${className}`}
  />
);

export const AdBannerSquare = ({ className = '' }) => (
  <AdBanner
    slot="8703883002838699-3" // Square banner slot
    format="auto"
    responsive={true}
    style={{ width: '300px', height: '250px', maxWidth: '300px' }}
    className={`ad-square ${className}`}
  />
);

export const AdBannerInFeed = ({ className = '' }) => (
  <AdBanner
    slot="8703883002838699-4" // In-feed banner slot
    format="auto"
    responsive={true}
    style={{ width: '100%', minHeight: '100px' }}
    className={`ad-infeed ${className}`}
  />
);

export const AdBannerContent = ({ className = '' }) => (
  <AdBanner
    slot="8703883002838699-5" // Content banner slot
    format="auto"
    responsive={true}
    style={{ width: '300px', height: '250px', maxWidth: '300px' }}
    className={`ad-content ${className}`}
  />
);

export const AdBannerFooter = ({ className = '' }) => (
  <AdBanner
    slot="8703883002838699-6" // Footer banner slot
    format="auto"
    responsive={true}
    style={{ width: '100%', height: '90px', minHeight: '90px' }}
    className={`ad-footer ${className}`}
  />
);

export default AdBanner;