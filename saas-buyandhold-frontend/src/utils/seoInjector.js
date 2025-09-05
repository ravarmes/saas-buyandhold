import { seo, services } from '../config/environment';

/**
 * Injeta dinamicamente as configurações de SEO no documento
 * baseado no ambiente atual (desenvolvimento/produção)
 */
export const injectSEOConfig = () => {
  // Atualizar meta tags Open Graph
  updateMetaTag('property', 'og:url', seo.url);
  updateMetaTag('property', 'og:title', seo.title);
  updateMetaTag('property', 'og:description', seo.description);
  
  // Atualizar meta tags Twitter
  updateMetaTag('property', 'twitter:url', seo.url);
  updateMetaTag('property', 'twitter:title', seo.title);
  updateMetaTag('property', 'twitter:description', seo.description);
  
  // Atualizar título da página
  document.title = seo.title;
  
  // Atualizar meta description
  updateMetaTag('name', 'description', seo.description);
  
  // Injetar Google AdSense se configurado
  if (services.googleAdsense.client && services.googleAdsense.enabled) {
    injectGoogleAdSense();
  }
};

/**
 * Atualiza ou cria uma meta tag
 */
const updateMetaTag = (attribute, value, content) => {
  let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
  
  if (metaTag) {
    metaTag.setAttribute('content', content);
  } else {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, value);
    metaTag.setAttribute('content', content);
    document.head.appendChild(metaTag);
  }
};

/**
 * Injeta o script do Google AdSense
 */
const injectGoogleAdSense = () => {
  // Verificar se o script já existe
  const existingScript = document.querySelector('script[src*="googlesyndication.com"]');
  if (existingScript) return;
  
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${services.googleAdsense.client}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
};