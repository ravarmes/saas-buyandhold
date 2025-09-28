import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const PixPayment = () => {
  const { user } = useAuth();
  const [pixCode, setPixCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, confirmed, expired
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Gerar código PIX
  const generatePixCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/pix-payments/generate', {
        userId: user.id,
        amount: 29.90, // Valor da assinatura premium
        description: 'Assinatura Premium - Buy & Hold'
      });

      setPixCode(response.data.pixCode);
      setQrCodeUrl(response.data.qrCodeUrl);
      setPaymentStatus('pending');
      setSuccess('Código PIX gerado com sucesso! Após o pagamento, aguarde a confirmação do administrador.');
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao gerar código PIX');
    } finally {
      setLoading(false);
    }
  };

  // Copiar código PIX
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setSuccess('Código PIX copiado para a área de transferência!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Pagamento PIX - Premium
        </h1>

        {/* Informações do plano */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Plano Premium
          </h2>
          <div className="space-y-2 text-blue-800">
            <p>✓ Salvamento ilimitado de carteiras</p>
            <p>✓ Múltiplas carteiras</p>
            <p>✓ Histórico de análises</p>
            <p>✓ Analytics avançados</p>
            <p className="text-2xl font-bold mt-4">R$ 29,90/mês</p>
          </div>
        </div>

        {/* Mensagens de erro e sucesso */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Gerar código PIX */}
        {!pixCode && (
          <div className="text-center">
            <button
              onClick={generatePixCode}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {loading ? 'Gerando...' : 'Gerar Código PIX'}
            </button>
          </div>
        )}

        {/* Exibir código PIX */}
        {pixCode && paymentStatus !== 'confirmed' && (
          <div className="space-y-6">
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">QR Code PIX</h3>
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code PIX" 
                  className="mx-auto border rounded-lg"
                />
              </div>
            )}

            {/* Código PIX */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Código PIX</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={pixCode}
                  readOnly
                  className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={copyPixCode}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Copiar
                </button>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Instruções:</h4>
              <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                <li>Abra o app do seu banco</li>
                <li>Escolha a opção PIX</li>
                <li>Escaneie o QR Code ou cole o código PIX</li>
                <li>Confirme o pagamento de R$ 29,90</li>
                <li>Aguarde a confirmação do administrador</li>
              </ol>
            </div>

            {/* Informação sobre confirmação */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Após o Pagamento</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>📧 Você receberá um email de confirmação</strong> assim que o administrador verificar seu pagamento na conta bancária e ativar sua assinatura premium.
                </p>
                <p className="text-blue-700 mt-2 text-sm">
                  Este processo pode levar algumas horas durante o horário comercial.
                </p>
              </div>
            </div>

            {/* Gerar novo código */}
            <div className="text-center pt-4">
              <button
                onClick={generatePixCode}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Gerar novo código PIX
              </button>
            </div>
          </div>
        )}

        {/* Pagamento confirmado */}
        {paymentStatus === 'confirmed' && (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Pagamento Confirmado!
              </h2>
              <p className="text-green-700 mb-6">
                Sua assinatura premium foi ativada com sucesso.
              </p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PixPayment;