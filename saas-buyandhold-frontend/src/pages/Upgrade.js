import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreditCardForm from '../components/CreditCardForm';

const Upgrade = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTestEnvironment, setIsTestEnvironment] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Verificar se usuário já é premium
  useEffect(() => {
    if (user?.planType === 'premium') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Verificar ambiente (teste ou produção)
  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const response = await axios.get('/payments/mercadopago-config');
        setIsTestEnvironment(response.data.isTestEnvironment);
        console.log('Ambiente detectado:', response.data.isTestEnvironment ? 'TESTE' : 'PRODUÇÃO');
      } catch (error) {
        console.error('Erro ao verificar ambiente:', error);
        // Fallback: verificar variável de ambiente do frontend
        const appEnv = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV;
        setIsTestEnvironment(appEnv !== 'production');
      }
    };

    checkEnvironment();
  }, []);

  // Buscar assinatura atual se existir
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/payments/subscription', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubscription(response.data.subscription);
      } catch (error) {
        // Usuário não tem assinatura ativa
        console.log('Nenhuma assinatura ativa encontrada');
      }
    };

    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const handleCreatePayment = async () => {
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      let endpoint = '/payment/create-pix';

      const response = await axios.post(
        endpoint,
        { 
          amount: 15.00,
          description: 'Upgrade para Premium - Buy and Hold SaaS'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.payment) {
        setPaymentData({
          ...response.data.subscription,
          paymentData: {
            pixKey: 'Código PIX gerado automaticamente',
            qrCode: response.data.payment.pixCopyPaste,
            qrCodeBase64: response.data.payment.qrCodeBase64,
            instructions: 'Escaneie o QR Code ou copie o código PIX para realizar o pagamento'
          },
          mercadoPagoPayment: response.data.payment
        });
        setShowPaymentModal(true);
      } else {
        setPaymentData(response.data.subscription);
        setShowPaymentModal(true);
      }
      
      setSuccess('Pagamento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      console.error('Resposta do erro:', error.response?.data);
      setError(error.response?.data?.error || 'Erro ao criar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!paymentData || isConfirming) return;

    setIsConfirming(true);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        '/payments/simulate-success',
        { 
          paymentId: paymentData.mercadoPagoPayment?.id || paymentData.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Pagamento simulado como aprovado! Bem-vindo ao plano Premium!');
        setShowPaymentModal(false);
        
        // Atualizar dados do usuário
        const refreshSuccess = await refreshUser();
        
        if (refreshSuccess) {
          // Redirecionar para dashboard após 2 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Se falhou ao atualizar, sugerir logout/login
          setSuccess('Pagamento simulado! Por favor, faça logout e login novamente para ver as mudanças.');
        }
      }
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      setError(error.response?.data?.error || 'Erro ao simular pagamento');
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  };

  const handleSimulateGenericPayment = async () => {
    if (!paymentData || isConfirming) return;

    setIsConfirming(true);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Usar ID genérico para simulação de sucesso
      const paymentId = 'test_generic_success';
      
      const response = await axios.post(
        '/payments/simulate-payment',
        { paymentId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Pagamento simulado como aprovado! Bem-vindo ao plano Premium!');
        setShowPaymentModal(false);
        
        // Atualizar dados do usuário
        const refreshSuccess = await refreshUser();
        
        if (refreshSuccess) {
          // Redirecionar para dashboard após 2 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Se falhou ao atualizar, sugerir logout/login
          setSuccess('Pagamento simulado! Por favor, faça logout e login novamente para ver as mudanças.');
        }
      }
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      setError(error.response?.data?.error || 'Erro ao simular pagamento');
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  };

  const handleCreditCardSuccess = async (paymentResponse) => {
    try {
      setSuccess('Pagamento por cartão de crédito processado com sucesso! Bem-vindo ao plano Premium!');
      setShowPaymentModal(false);
      
      // Atualizar dados do usuário
      const refreshSuccess = await refreshUser();
      
      if (refreshSuccess) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao processar sucesso do pagamento:', error);
      setError('Erro ao atualizar dados do usuário');
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentData || isConfirming) return;

    setIsConfirming(true);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      let endpoint = '/payments/verify-pix';
      let requestData = { 
        paymentId: paymentData.mercadoPagoPayment?.id || paymentData.id 
      };

      const response = await axios.post(
        endpoint,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      let isPaymentApproved = false;
      
      if (paymentData.mercadoPagoPayment) {
        isPaymentApproved = response.data.payment?.isApproved;
      } else {
        isPaymentApproved = response.data.paymentVerified;
      }

      if (isPaymentApproved) {
        setSuccess('Pagamento PIX confirmado! Bem-vindo ao plano Premium!');
        setShowPaymentModal(false);
        
        // Atualizar dados do usuário
        const refreshSuccess = await refreshUser();
        
        if (refreshSuccess) {
          // Redirecionar para dashboard após 2 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Se falhou ao atualizar, sugerir logout/login
          setSuccess('Pagamento confirmado! Por favor, faça logout e login novamente para ver as mudanças.');
        }
      } else {
        setError('Pagamento ainda não confirmado. Tente novamente em alguns minutos.');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      
      // Tratamento específico para diferentes tipos de erro
      if (error.response?.status === 404) {
        const errorData = error.response.data;
        setError(
          <div className="space-y-2">
            <p className="font-semibold">{errorData.error}</p>
            <p className="text-sm">{errorData.message}</p>
            {errorData.suggestion && (
              <p className="text-sm text-blue-600 italic">{errorData.suggestion}</p>
            )}
          </div>
        );
      } else {
        setError(error.response?.data?.error || 'Erro ao verificar pagamento');
      }
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData || isConfirming) return;

    setIsConfirming(true);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/payments/confirm',
        {
          subscriptionId: paymentData.id,
          paymentId: paymentData.paymentId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Pagamento confirmado! Bem-vindo ao plano Premium!');
      setShowPaymentModal(false);
      
      // Atualizar dados do usuário
      const refreshSuccess = await refreshUser();
      
      if (refreshSuccess) {
        // Redirecionar para dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        // Se falhou ao atualizar, sugerir logout/login
        setSuccess('Pagamento confirmado! Por favor, faça logout e login novamente para ver as mudanças.');
      }
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      setError(error.response?.data?.error || 'Erro ao confirmar pagamento');
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Código PIX copiado para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar código PIX');
      setTimeout(() => setError(''), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade para Premium
          </h1>
          <p className="text-lg text-gray-600">
            Desbloqueie todas as funcionalidades e maximize seus investimentos
          </p>
        </div>

        {/* Plano Premium */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plano Premium</h2>
            <div className="text-4xl font-bold text-blue-600 mb-2">R$ 15,00</div>
            <p className="text-gray-600">Pagamento único via PIX</p>
          </div>

          {/* Benefícios */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Portfólios ilimitados</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Análises avançadas</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Relatórios detalhados</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Suporte prioritário</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Exportação de dados</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Atualizações em tempo real</span>
              </div>
            </div>
          </div>

          {/* Seleção de Método de Pagamento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Escolha o método de pagamento:</h3>
            
            {/* PIX Mercado Pago */}
            <div 
              className={`border rounded-lg p-4 mb-3 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'pix' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPaymentMethod('pix')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pix"
                  checked={selectedPaymentMethod === 'pix'}
                  onChange={() => setSelectedPaymentMethod('pix')}
                  className="mr-3"
                />
                <svg className="w-6 h-6 text-blue-600 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-800">PIX (Mercado Pago)</h4>
                  <p className="text-sm text-gray-600">Pagamento instantâneo e seguro via PIX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Upgrade */}
          <div className="space-y-3">
            <button
              onClick={handleCreatePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                'Pagar com PIX (Mercado Pago)'
              )}
            </button>
          </div>

          {/* Mensagens de Erro e Sucesso */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Pagamento */}
      {showPaymentModal && paymentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pagamento via PIX
              </h3>
              <p className="text-gray-600">Valor: R$ {paymentData.amount || '15,00'}</p>
            </div>

            {/* Modal para PIX Mercado Pago */}
            {paymentData.paymentData && (
              <div className="space-y-4">
                {/* QR Code Base64 se disponível */}
                {paymentData.paymentData.qrCodeBase64 && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-2">QR Code PIX:</p>
                    <img 
                      src={paymentData.paymentData.qrCodeBase64} 
                      alt="QR Code PIX" 
                      className="mx-auto max-w-full h-auto border border-gray-200 rounded"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                )}

                {/* Código PIX para copiar */}
                {paymentData.paymentData.qrCode && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Código PIX (Copia e Cola):</p>
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-mono break-all pr-2 leading-relaxed">{paymentData.paymentData.qrCode}</span>
                        <button
                          onClick={() => copyToClipboard(paymentData.paymentData.qrCode)}
                          className="text-blue-600 hover:text-blue-700 text-sm ml-2 flex-shrink-0 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Cole este código no seu app bancário na opção "PIX Copia e Cola"</p>
                  </div>
                )}

                {/* Código PIX alternativo se disponível */}
                {paymentData.paymentData.pixKey && paymentData.paymentData.pixKey !== 'Código PIX gerado automaticamente' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Chave PIX:</p>
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-mono break-all pr-2 leading-relaxed">{paymentData.paymentData.pixKey}</span>
                        <button
                          onClick={() => copyToClipboard(paymentData.paymentData.pixKey)}
                          className="text-blue-600 hover:text-blue-700 text-sm ml-2 flex-shrink-0 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Cole este código no seu app bancário na opção "PIX Copia e Cola"</p>
                  </div>
                )}
                
                {/* Informações adicionais da Hotmart */}
                {paymentData.pixId && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm space-y-1">
                      <p><strong>PIX ID:</strong> {paymentData.pixId}</p>
                      <p><strong>Valor:</strong> R$ 15,00</p>
                      <p><strong>Status:</strong> Aguardando pagamento</p>
                      <p><strong>Expira em:</strong> 30 minutos</p>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 text-center">
                  {paymentData.paymentData.instructions}
                </p>
              </div>
            )}

            {selectedPaymentMethod === 'credit_card' && paymentData.paymentData && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  {paymentData.paymentData.instructions}
                </p>
                <a
                  href={paymentData.paymentData.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ir para Pagamento
                </a>
              </div>
            )}

            {/* Botões de Simulação (apenas em ambiente de desenvolvimento) */}
            {(process.env.REACT_APP_ENVIRONMENT !== 'production' && process.env.REACT_APP_PROFILE !== 'production') && paymentData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Ambiente de Desenvolvimento</span>
                </div>
                <p className="text-xs text-green-700 mb-3">
                  Simule diferentes cenários de pagamento para testes:
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={loading || isConfirming}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {(loading || isConfirming) ? 'Simulando...' : '✅ Simular Pagamento Aprovado'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerifyPayment}
                disabled={loading || isConfirming}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {(loading || isConfirming) ? 'Verificando...' : 'Verificar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Upgrade;