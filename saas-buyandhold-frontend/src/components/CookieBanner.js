import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Sempre true, não pode ser desabilitado
    analytics: false,
    advertising: false,
    functional: false
  });

  useEffect(() => {
    // Verificar se o usuário já fez uma escolha sobre cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    } else {
      // Carregar preferências salvas
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(prev => ({ ...prev, ...savedPreferences }));
      } catch (error) {
        console.error('Erro ao carregar preferências de cookies:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      advertising: true,
      functional: true
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    
    // Recarregar a página para aplicar as configurações de cookies
    window.location.reload();
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false
    };
    
    setPreferences(onlyNecessary);
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    setShowPreferences(false);
    
    // Recarregar a página se cookies de publicidade foram aceitos
    if (preferences.advertising) {
      window.location.reload();
    }
  };

  const handlePreferenceChange = (type) => {
    if (type === 'necessary') return; // Não pode ser alterado
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner principal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🍪 Utilizamos Cookies
              </h3>
              <p className="text-gray-600 text-sm">
                Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar anúncios. 
                Ao continuar navegando, você concorda com nossa{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">
                  Política de Privacidade
                </Link>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Configurar
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Rejeitar
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Aceitar Todos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de preferências */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Preferências de Cookies
                </h2>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Cookies Necessários */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">Cookies Necessários</h3>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Sempre Ativo
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Estes cookies são essenciais para o funcionamento do site e não podem ser desabilitados. 
                    Incluem autenticação, segurança e funcionalidades básicas.
                  </p>
                </div>

                {/* Cookies de Análise */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">Cookies de Análise</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => handlePreferenceChange('analytics')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Nos ajudam a entender como os visitantes interagem com o site, coletando informações de forma anônima.
                  </p>
                </div>

                {/* Cookies de Publicidade */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">Cookies de Publicidade</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.advertising}
                        onChange={() => handlePreferenceChange('advertising')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Utilizados para exibir anúncios relevantes baseados em seus interesses. Gerenciados pelo Google AdSense.
                  </p>
                </div>

                {/* Cookies Funcionais */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">Cookies Funcionais</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={() => handlePreferenceChange('functional')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Permitem funcionalidades aprimoradas e personalização, como lembrar suas preferências.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;