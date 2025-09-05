import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
    if (!permissions?.isPremium) {
      try {
        // Verifica se o AdSense está disponível
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
      } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
      }
    }
  }, [permissions?.isPremium]);

  // Não renderiza anúncios para usuários premium
  if (permissions?.isPremium) {
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
    slot="1234567890" // Substitua pelo slot real do AdSense
    format="horizontal"
    style={{ width: '100%', height: '90px' }}
    className={`ad-header ${className}`}
  />
);

export const AdBannerSidebar = ({ className = '' }) => (
  <AdBanner
    slot="2345678901" // Substitua pelo slot real do AdSense
    format="vertical"
    style={{ maxWidth: '300px', width: '100%', height: '250px' }}
    className={`ad-sidebar ${className}`}
  />
);

export const AdBannerSquare = ({ className = '' }) => (
  <AdBanner
    slot="3456789012" // Substitua pelo slot real do AdSense
    format="rectangle"
    style={{ maxWidth: '300px', width: '100%', height: '250px' }}
    className={`ad-square ${className}`}
  />
);

export const AdBannerInFeed = ({ className = '' }) => (
  <AdBanner
    slot="4567890123" // Substitua pelo slot real do AdSense
    format="fluid"
    style={{ width: '100%', minHeight: '100px' }}
    className={`ad-infeed ${className}`}
  />
);

export const AdBannerContent = ({ className = '' }) => (
  <AdBanner
    slot="6789012345" // Substitua pelo slot real do AdSense
    format="rectangle"
    style={{ maxWidth: '300px', width: '100%', height: '250px' }}
    className={`ad-content ${className}`}
  />
);

export const AdBannerFooter = ({ className = '' }) => (
  <AdBanner
    slot="5678901234" // Substitua pelo slot real do AdSense
    format="horizontal"
    style={{ width: '100%', height: '90px' }}
    className={`ad-footer ${className}`}
  />
);

export default AdBanner;