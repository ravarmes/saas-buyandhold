import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaCopy, FaQrcode, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';

const UpgradeToPremium = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const PREMIUM_PRICE = 15.00;

  // Limpar interval ao desmontar componente
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Função para criar pagamento PIX
  const createPixPayment = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/payment/create-pix', {
        amount: PREMIUM_PRICE,
        description: 'Upgrade para Premium - Buy and Hold SaaS'
      });

      if (response.data.success) {
        setPaymentData(response.data.payment);
        setPaymentStatus('pending');
        
        // Iniciar verificação de status
        startStatusCheck(response.data.payment.mercadoPagoId);
        
        toast.success('PIX gerado com sucesso! Escaneie o QR Code ou copie o código.');
      } else {
        throw new Error(response.data.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      toast.error(error.response?.data?.error || 'Erro ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar status do pagamento
  const checkPaymentStatus = async (paymentId) => {
    try {
      const response = await api.get(`/payment/status/${paymentId}`);
      
      if (response.data.success) {
        const { status } = response.data.payment;
        setPaymentStatus(status);
        
        if (status === 'approved') {
          // Pagamento aprovado
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
          
          // Atualizar dados do usuário
          await refreshUser();
          
          toast.success('Pagamento aprovado! Bem-vindo ao Premium! 🎉');
          
          // Fechar modal após 2 segundos
          setTimeout(() => {
            onClose();
          }, 2000);
          
        } else if (status === 'rejected' || status === 'cancelled') {
          // Pagamento rejeitado ou cancelado
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
          toast.error('Pagamento não foi aprovado. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    }
  };

  // Iniciar verificação periódica do status
  const startStatusCheck = (paymentId) => {
    // Verificar imediatamente
    checkPaymentStatus(paymentId);
    
    // Verificar a cada 5 segundos
    const interval = setInterval(() => {
      checkPaymentStatus(paymentId);
    }, 5000);
    
    setStatusCheckInterval(interval);
    
    // Parar verificação após 10 minutos
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setStatusCheckInterval(null);
      }
    }, 10 * 60 * 1000);
  };

  // Função para copiar código PIX
  const copyPixCode = () => {
    if (paymentData?.pixCopyPaste) {
      navigator.clipboard.writeText(paymentData.pixCopyPaste);
      toast.success('Código PIX copiado para a área de transferência!');
    }
  };

  // Função para baixar QR Code
  const downloadQRCode = () => {
    if (paymentData?.qrCodeBase64) {
      const link = document.createElement('a');
      link.href = paymentData.qrCodeBase64;
      link.download = 'qr-code-pix.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR Code baixado!');
    }
  };

  // Renderizar status do pagamento
  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'pending':
        return (
          <div className="flex items-center text-yellow-600">
            <FaSpinner className="animate-spin mr-2" />
            Aguardando pagamento...
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center text-green-600">
            <FaCheck className="mr-2" />
            Pagamento aprovado!
          </div>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <div className="flex items-center text-red-600">
            <FaTimes className="mr-2" />
            Pagamento não aprovado
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Upgrade para Premium
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Benefícios Premium */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Benefícios Premium:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                Carteiras ilimitadas
              </li>
              <li className="flex items-center">
                <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                Análises avançadas
              </li>
              <li className="flex items-center">
                <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                Relatórios detalhados
              </li>
              <li className="flex items-center">
                <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                Suporte prioritário
              </li>
            </ul>
          </div>

          {/* Preço */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-blue-600">
              R$ {PREMIUM_PRICE.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              Pagamento único via PIX
            </div>
          </div>

          {/* Botão para gerar PIX ou dados do pagamento */}
          {!paymentData ? (
            <button
              onClick={createPixPayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Gerando PIX...
                </>
              ) : (
                'Gerar PIX'
              )}
            </button>
          ) : (
            <div className="space-y-4">
              {/* Status do pagamento */}
              <div className="text-center">
                {renderPaymentStatus()}
              </div>

              {/* QR Code */}
              <div className="text-center">
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 py-3 px-4 rounded-lg transition-colors"
                >
                  <FaQrcode className="mr-2" />
                  {showQRCode ? 'Ocultar QR Code' : 'Mostrar QR Code'}
                </button>
                
                {showQRCode && paymentData.qrCodeBase64 && (
                  <div className="mt-4">
                    <img
                      src={paymentData.qrCodeBase64}
                      alt="QR Code PIX"
                      className="mx-auto max-w-full h-auto border rounded-lg"
                      style={{ maxWidth: '200px' }}
                    />
                    <button
                      onClick={downloadQRCode}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Baixar QR Code
                    </button>
                  </div>
                )}
              </div>

              {/* Código PIX para copiar */}
              {paymentData.pixCopyPaste && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código PIX (Copia e Cola):
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={paymentData.pixCopyPaste}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded-l-lg bg-gray-50 text-xs font-mono"
                    />
                    <button
                      onClick={copyPixCode}
                      className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 flex items-center"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              )}

              {/* Instruções */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Como pagar:
                </h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escaneie o QR Code ou cole o código PIX</li>
                  <li>3. Confirme o pagamento</li>
                  <li>4. Aguarde a confirmação automática</li>
                </ol>
              </div>

              {/* Botão para tentar novamente se rejeitado */}
              {(paymentStatus === 'rejected' || paymentStatus === 'cancelled') && (
                <button
                  onClick={() => {
                    setPaymentData(null);
                    setPaymentStatus('pending');
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Tentar Novamente
                </button>
              )}
            </div>
          )}

          {/* Informações de segurança */}
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>🔒 Pagamento seguro via Mercado Pago</p>
            <p>Seus dados estão protegidos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeToPremium;