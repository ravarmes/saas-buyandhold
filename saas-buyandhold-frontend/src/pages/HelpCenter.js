import React from 'react';
import { Link } from 'react-router-dom';

const HelpCenter = () => {
  const faqs = [
    {
      question: "Como criar minha primeira carteira?",
      answer: "Acesse a página de Configurações e clique em 'Nova Carteira'. Defina um nome e os percentuais desejados para ações e FIIs."
    },
    {
      question: "Como funciona a calculadora de investimentos?",
      answer: "A calculadora analisa sua carteira atual e sugere investimentos para rebalanceamento baseado nos seus objetivos de alocação."
    },
    {
      question: "Qual a diferença entre o plano gratuito e premium?",
      answer: "O plano premium oferece carteiras ilimitadas, salvamento automático, histórico completo e analytics avançados."
    },
    {
      question: "Como atualizar os preços dos meus ativos?",
      answer: "Os preços são atualizados automaticamente através de APIs de mercado. Você também pode atualizar manualmente na página de Configurações."
    },
    {
      question: "Posso importar minha carteira de outro sistema?",
      answer: "Atualmente não oferecemos importação automática, mas você pode adicionar seus ativos manualmente na página de Configurações."
    },
    {
      question: "Como cancelar minha assinatura premium?",
      answer: "Entre em contato conosco através da página de contato ou envie um email para ajuda.brugnara@gmail.com."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/profile" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Voltar ao Perfil
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">📚 Central de Ajuda</h1>
        <p className="text-gray-600 mt-2">
          Encontre respostas para as perguntas mais frequentes
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar na central de ajuda..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link 
          to="/contact" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="text-3xl mb-3">💬</div>
          <h3 className="font-semibold text-gray-900 mb-2">Entrar em Contato</h3>
          <p className="text-gray-600 text-sm">Fale diretamente com nossa equipe</p>
        </Link>
        
        <Link 
          to="/report-bug" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="text-3xl mb-3">🐛</div>
          <h3 className="font-semibold text-gray-900 mb-2">Reportar Bug</h3>
          <p className="text-gray-600 text-sm">Encontrou um problema? Nos avise</p>
        </Link>
        
        <Link 
          to="/suggest-feature" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="text-3xl mb-3">💡</div>
          <h3 className="font-semibold text-gray-900 mb-2">Sugerir Funcionalidade</h3>
          <p className="text-gray-600 text-sm">Compartilhe suas ideias conosco</p>
        </Link>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Perguntas Frequentes</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <details key={index} className="group">
              <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">{faq.question}</h3>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="font-semibold text-blue-900 mb-2">Não encontrou o que procurava?</h3>
        <p className="text-blue-700 mb-4">Nossa equipe está pronta para ajudar você!</p>
        <Link 
          to="/contact" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          💬 Entrar em Contato
        </Link>
      </div>
    </div>
  );
};

export default HelpCenter;