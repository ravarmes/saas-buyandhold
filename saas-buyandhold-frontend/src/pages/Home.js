import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdBannerHeader, AdBannerSidebar, AdBannerContent } from '../components/AdBanner';
import logoVargasCode from '../assets/logo-vargascode-transparente.png';
import logoAiHold from '../assets/logo-aihold-transparente.png';

const Home = () => {
  const { user, permissions } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Otimize sua
          <span className="text-blue-600"> Carteira de Investimentos</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Receba sugestões inteligentes para rebalancear sua carteira de ações e FIIs 
          seguindo a estratégia Buy & Hold com base nos seus objetivos de alocação.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ir para Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Começar Grátis
              </Link>
              <Link
                to="/calculator"
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Testar Calculadora
              </Link>
            </>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          ✨ Sem cartão de crédito • 🚀 Setup em 2 minutos
        </p>
      </div>

      {/* Ad Banner - Header (only for free users) */}
      {!permissions.isPremium && (
        <div className="flex justify-center py-4">
          <AdBannerHeader />
        </div>
      )}

      {/* Features Section */}
      <div className="py-20 bg-gray-50 -mx-4 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher nossa plataforma?
          </h2>
          
          <div className={`grid gap-8 ${!permissions.isPremium ? 'md:grid-cols-4' : 'md:grid-cols-1'}`}>
            {/* Ad Banner - Sidebar (only for free users) */}
            {!permissions.isPremium && (
              <div className="md:col-span-1 flex justify-center">
                <AdBannerSidebar />
              </div>
            )}
            
            <div className={`grid md:grid-cols-3 gap-8 ${!permissions.isPremium ? 'md:col-span-3' : 'md:col-span-1'}`}>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sugestões Inteligentes</h3>
              <p className="text-gray-600">
                Algoritmo avançado analisa sua carteira atual e sugere os melhores investimentos 
                para manter sua alocação ideal.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-600">
                Seus dados são protegidos com criptografia avançada. Não armazenamos 
                informações financeiras sensíveis.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Rápido e Fácil</h3>
              <p className="text-gray-600">
                Interface intuitiva permite calcular sugestões de investimento em segundos. 
                Sem complicações ou jargões técnicos.
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Escolha seu plano
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Gratuito</h3>
              <p className="text-gray-600 mt-2">Para começar a investir</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-gray-600">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Calculadora de investimentos
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Uma carteira temporária
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Com anúncios
              </li>
              <li className="flex items-center text-gray-400">
                <svg className="w-5 h-5 text-gray-300 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Salvamento de carteiras
              </li>
              <li className="flex items-center text-gray-400">
                <svg className="w-5 h-5 text-gray-300 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Múltiplas carteiras
              </li>
            </ul>
            
            <Link
              to={user ? "/dashboard" : "/register"}
              className="block w-full text-center border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {user ? "Usar Grátis" : "Começar Grátis"}
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-blue-600 text-white rounded-lg p-8 relative">
            <div className="absolute top-0 right-6 transform -translate-y-1/2">
              <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold">Premium</h3>
              <p className="text-blue-100 mt-2">Para investidores sérios</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">R$ 15,00</span>
                 <span className="text-blue-100">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Tudo do plano gratuito
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Carteiras ilimitadas
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Salvamento automático
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Histórico completo
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Zero anúncios
              </li>
            </ul>
            
            <Link
              to="/upgrade"
              className="block w-full text-center bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Assinar Premium
            </Link>
          </div>
        </div>
      </div>

      {/* Desenvolvido por Section */}
      <div className="text-center py-16 bg-gray-100 -mx-4 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          Desenvolvido por
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12">
          {/* VargasCode */}
          <div className="flex flex-col items-center">
            <img 
              src={logoVargasCode} 
              alt="VargasCode" 
              className="h-16 w-auto mb-3"
            />
            <p className="text-gray-600 text-sm max-w-xs">
               A Vargas Code é uma empresa especializada em desenvolvimento de soluções tecnológicas inovadoras
             </p>
          </div>
          
          {/* Buy & Hold */}
          <div className="flex flex-col items-center">
            <img 
              src={logoAiHold} 
              alt="Buy & Hold" 
              className="h-16 w-auto mb-3"
            />
            <p className="text-gray-600 text-sm max-w-xs">
              Plataforma inteligente para otimização de carteiras de investimento
            </p>
          </div>
        </div>
      </div>

      {/* Ad Banner - Content (only for free users) */}
      {!permissions.isPremium && (
        <div className="flex justify-center py-8">
          <AdBannerContent />
        </div>
      )}

      {/* CTA Section */}
      <div className="text-center py-20 bg-blue-600 text-white -mx-4 px-4">
        <h2 className="text-3xl font-bold mb-4">
          Pronto para otimizar seus investimentos?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de investidores que já estão usando nossa plataforma 
          para tomar decisões mais inteligentes.
        </p>
        
        <Link
          to={user ? "/dashboard" : "/register"}
          className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
        >
          {user ? "Ir para Dashboard" : "Começar Agora - É Grátis"}
        </Link>
      </div>
    </div>
  );
};

export default Home;
