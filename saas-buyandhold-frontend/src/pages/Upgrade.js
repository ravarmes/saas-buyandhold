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
      } catch (error) {
        console.error('Erro ao verificar ambiente:', error);
        setIsTestEnvironment(false);
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
    console.log('Botão clicado - iniciando criação de pagamento');
    console.log('Método de pagamento selecionado:', selectedPaymentMethod);
    console.log('Usuário:', user);
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      console.log('Token encontrado:', token ? 'Sim' : 'Não');
      
      let endpoint, requestData;
      
      // Definir endpoint baseado no método de pagamento
      if (selectedPaymentMethod === 'hotmart') {
        endpoint = '/payments/create-hotmart-link';
        requestData = {
          amount: 15.00,
          productName: 'Plano Premium - Buy and Hold'
        };
      } else if (selectedPaymentMethod === 'pix') {
        endpoint = '/payments/create-mercadopago';
        requestData = {
          paymentMethod: selectedPaymentMethod,
          amount: 15.00
        };
      } else {
        endpoint = '/payments/create';
        requestData = {
          paymentMethod: selectedPaymentMethod,
          amount: 15.00
        };
      }
      
      const response = await axios.post(
        endpoint,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Resposta da API:', response.data);
      
      // Estrutura de dados diferente para cada método
      if (selectedPaymentMethod === 'hotmart') {
        // Para Hotmart, redirecionar diretamente para o checkout
        const paymentUrl = response.data.paymentUrl || response.data.checkoutUrl || response.data.url || response.data?.data?.payment_url;
        if (paymentUrl) {
          const newWindow = window.open(paymentUrl, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Fallback se popup for bloqueado
            window.location.href = paymentUrl;
          }
          setSuccess('Redirecionando para o checkout da Hotmart...');
        } else {
          console.error('PaymentUrl não encontrada na resposta:', response.data);
          setError('Erro: Link de pagamento não foi gerado');
        }
      } else if (selectedPaymentMethod === 'pix' && response.data.payment) {
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
      
      if (selectedPaymentMethod !== 'hotmart') {
        setSuccess('Pagamento criado com sucesso!');
      }
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
      
      // Usar o ID do pagamento correto
      const paymentId = paymentData.mercadoPagoPayment 
        ? paymentData.mercadoPagoPayment.id
        : paymentData.paymentId;
      
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
      
      // Usar a nova API do Mercado Pago se for pagamento PIX com Mercado Pago
      const endpoint = paymentData.mercadoPagoPayment 
        ? '/payments/verify-mercadopago'
                : '/payments/verify-pix';
      
      const requestData = paymentData.mercadoPagoPayment 
        ? {
            subscriptionId: paymentData.id,
            paymentId: paymentData.mercadoPagoPayment.id
          }
        : {
            subscriptionId: paymentData.id,
            paymentId: paymentData.paymentId
          };
      
      const response = await axios.post(
        endpoint,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Verificar se o pagamento foi aprovado
      const isPaymentApproved = paymentData.mercadoPagoPayment 
        ? response.data.payment?.isApproved
        : response.data.paymentVerified;

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
      setSuccess('Código copiado para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar código');
      setTimeout(() => setError(''), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade para Premium
          </h1>
          <p className="text-lg text-gray-600">
            Desbloqueie todas as funcionalidades e salve suas carteiras
          </p>
        </div>

        {/* Plano Premium */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plano Premium</h2>
            <div className="text-4xl font-bold text-blue-600 mb-4">
              R$ 15,00
              <span className="text-lg font-normal text-gray-500">/mês</span>
            </div>
          </div>

          {/* Benefícios */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">Funcionalidades Premium:</h3>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Salvar carteiras ilimitadas</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Executar investimentos</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Histórico de investimentos</span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">Suporte Premium:</h3>
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
                <span className="text-gray-700">Relatórios avançados</span>
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
            
            {/* PIX */}
            <div 
              className={`border rounded-lg p-4 mb-3 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'pix' 
                  ? 'border-green-500 bg-green-50' 
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
                <svg className="w-6 h-6 text-green-600 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-800">PIX (Mercado Pago)</h4>
                  <p className="text-sm text-gray-600">Pagamento instantâneo e seguro</p>
                </div>
              </div>
            </div>
            
            {/* Hotmart */}
            <div 
              className={`border rounded-lg p-4 mb-3 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'hotmart' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPaymentMethod('hotmart')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="hotmart"
                  checked={selectedPaymentMethod === 'hotmart'}
                  onChange={() => setSelectedPaymentMethod('hotmart')}
                  className="mr-3"
                />
                <svg className="w-6 h-6 text-blue-600 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h9V9zm0 7v-3h-9v3h9z"/>
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-800">Hotmart</h4>
                  <p className="text-sm text-gray-600">PIX, Cartão de Crédito, Boleto e mais</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Upgrade */}
          <button
              onClick={handleCreatePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processando...' : 
                selectedPaymentMethod === 'hotmart' ? 'Pagar com Hotmart' :
                selectedPaymentMethod === 'pix' ? 'Pagar com PIX' :
                'Fazer Upgrade Premium'
              }
            </button>
        </div>

        {/* Mensagens */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
                {selectedPaymentMethod === 'pix' ? 'Pagamento via PIX' : 'Pagamento via Cartão'}
              </h3>
              <p className="text-gray-600">Valor: R$ {paymentData.amount}</p>
            </div>

            {selectedPaymentMethod === 'pix' && paymentData.paymentData && (
              <div className="space-y-4">
                {/* QR Code Base64 se disponível */}
                {paymentData.paymentData.qrCodeBase64 && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-2">QR Code PIX:</p>
                    <img 
                      src={`data:image/png;base64,${paymentData.paymentData.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="mx-auto mb-2 border rounded"
                      style={{ maxWidth: '200px' }}
                    />
                    <p className="text-xs text-gray-500">Escaneie com o app do seu banco</p>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Código PIX (Copia e Cola):</p>
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-xs font-mono break-all pr-2">{paymentData.paymentData.qrCode}</span>
                    <button
                      onClick={() => copyToClipboard(paymentData.paymentData.qrCode)}
                      className="text-blue-600 hover:text-blue-700 text-sm ml-2 flex-shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                
                {/* Informações adicionais do Mercado Pago */}
                {paymentData.mercadoPagoPayment && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm space-y-1">
                      <p><strong>ID do Pagamento:</strong> {paymentData.mercadoPagoPayment.id}</p>
                      <p><strong>Valor:</strong> R$ {paymentData.mercadoPagoPayment.amount}</p>
                      <p><strong>Status:</strong> {paymentData.mercadoPagoPayment.status || 'Aguardando pagamento'}</p>
                      {paymentData.mercadoPagoPayment.expirationDate && (
                        <p><strong>Expira em:</strong> {new Date(paymentData.mercadoPagoPayment.expirationDate).toLocaleString('pt-BR')}</p>
                      )}
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

            <div className="space-y-3 mt-6">
              {/* Botão de Simulação (apenas para PIX em ambiente de teste) */}
              {selectedPaymentMethod === 'pix' && isTestEnvironment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-yellow-800">Ambiente de Teste</span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-3">
                    Para facilitar os testes, você pode simular a aprovação do pagamento PIX:
                  </p>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={loading || isConfirming}
                    className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {(loading || isConfirming) ? 'Simulando...' : '🎯 Simular Pagamento Aprovado'}
                  </button>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                {selectedPaymentMethod === 'pix' ? (
                  <button
                    onClick={handleVerifyPayment}
                    disabled={loading || isConfirming}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {(loading || isConfirming) ? 'Verificando...' : 'Verificar Pagamento'}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={loading || isConfirming}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {(loading || isConfirming) ? 'Confirmando...' : 'Confirmar Pagamento'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upgrade;