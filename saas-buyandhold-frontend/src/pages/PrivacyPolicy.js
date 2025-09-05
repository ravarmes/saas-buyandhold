import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Política de Privacidade
        </h1>
        
        <p className="text-gray-600 mb-6">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Informações que Coletamos
            </h2>
            <p className="text-gray-700 mb-3">
              Coletamos informações que você nos fornece diretamente, como:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Nome, e-mail e outras informações de cadastro</li>
              <li>Dados de carteiras de investimento que você criar</li>
              <li>Informações de uso da plataforma</li>
              <li>Dados de pagamento (processados por terceiros seguros)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Como Usamos suas Informações
            </h2>
            <p className="text-gray-700 mb-3">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar transações e gerenciar sua conta</li>
              <li>Enviar comunicações importantes sobre o serviço</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Compartilhamento de Informações
            </h2>
            <p className="text-gray-700 mb-3">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Com seu consentimento explícito</li>
              <li>Para cumprir obrigações legais</li>
              <li>Com provedores de serviços que nos ajudam a operar a plataforma</li>
              <li>Para proteger nossos direitos e segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Cookies e Tecnologias Similares
            </h2>
            <p className="text-gray-700 mb-3">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Manter você logado na plataforma</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o uso da plataforma</li>
              <li>Exibir anúncios relevantes (Google AdSense)</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Você pode controlar o uso de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Publicidade
            </h2>
            <p className="text-gray-700 mb-3">
              Utilizamos o Google AdSense para exibir anúncios em nossa plataforma. O Google pode usar cookies para exibir anúncios baseados em suas visitas a este e outros sites. Você pode optar por não receber anúncios personalizados visitando as configurações de anúncios do Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Segurança dos Dados
            </h2>
            <p className="text-gray-700">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Seus Direitos (LGPD)
            </h2>
            <p className="text-gray-700 mb-3">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a exclusão de dados desnecessários</li>
              <li>Solicitar a portabilidade dos dados</li>
              <li>Revogar o consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Retenção de Dados
            </h2>
            <p className="text-gray-700">
              Mantemos suas informações pelo tempo necessário para fornecer nossos serviços e cumprir obrigações legais. Dados de carteiras são mantidos enquanto sua conta estiver ativa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Alterações nesta Política
            </h2>
            <p className="text-gray-700">
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou através de aviso em nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Contato
            </h2>
            <p className="text-gray-700">
              Para questões sobre esta política ou seus dados pessoais, entre em contato conosco:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>E-mail:</strong> brinabrug@gmail.com<br/>
                <strong>Responsável:</strong> Vargas Code<br/>
                <strong>Plataforma:</strong> Buy & Hold
              </p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;