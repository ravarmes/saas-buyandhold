import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl, services } from '../config/environment';

const CreditCardForm = ({ onPaymentSuccess, onError, amount = 15.00 }) => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    securityCode: '',
    cardholderName: '',
    docType: 'CPF',
    docNumber: ''
  });
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mercadoPagoLoaded, setMercadoPagoLoaded] = useState(false);
  const [isTestEnvironment, setIsTestEnvironment] = useState(false);

  // Carregar SDK do Mercado Pago
  useEffect(() => {
    const loadMercadoPagoSDK = async () => {
      if (window.MercadoPago) {
        setMercadoPagoLoaded(true);
        return;
      }

      try {
        // Obter configurações do Mercado Pago do backend
        const configResponse = await axios.get('/payments/mercadopago-config');
        const { publicKey, isTestEnvironment, environment } = configResponse.data;
        
        // Definir se está em ambiente de teste
        setIsTestEnvironment(isTestEnvironment);
        console.log('Ambiente de teste detectado:', isTestEnvironment, 'Environment:', environment);
        
        if (!publicKey) {
          throw new Error('Chave pública do Mercado Pago não configurada');
        }

        const script = document.createElement('script');
        script.src = services.mercadoPago.sdkUrl;
        script.onload = () => {
          try {
            // Verificar se o MercadoPago está disponível
            if (!window.MercadoPago) {
              throw new Error('SDK do Mercado Pago não foi carregado');
            }
            
            console.log(`Inicializando Mercado Pago em ambiente: ${environment} (${isTestEnvironment ? 'TESTE' : 'PRODUÇÃO'})`);
            console.log(`Chave pública: ${publicKey.substring(0, 20)}...`);
            
            window.mp = new window.MercadoPago(publicKey, {
              locale: 'pt-BR',
              advancedFraudPrevention: false
            });
            
            console.log('Mercado Pago inicializado com sucesso');
            setMercadoPagoLoaded(true);
          } catch (error) {
            console.error('Erro ao inicializar Mercado Pago:', error);
            onError('Erro ao inicializar sistema de pagamento: ' + error.message);
          }
        };
        script.onerror = () => {
          onError('Erro ao carregar SDK do Mercado Pago');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Erro ao obter configurações do Mercado Pago:', error);
        onError('Erro ao obter configurações de pagamento: ' + error.message);
      }
    };

    loadMercadoPagoSDK();
  }, [onError]);

  const validateCard = () => {
    const newErrors = {};

    // Validar número do cartão
    const cardNumber = cardData.cardNumber.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }

    // Validar mês de expiração
    const month = parseInt(cardData.expiryMonth);
    if (!month || month < 1 || month > 12) {
      newErrors.expiryMonth = 'Mês inválido';
    }

    // Validar ano de expiração
    const year = parseInt(cardData.expiryYear);
    const currentYear = new Date().getFullYear();
    if (!year || year < currentYear || year > currentYear + 20) {
      newErrors.expiryYear = 'Ano inválido';
    }

    // Validar código de segurança
    if (!cardData.securityCode || cardData.securityCode.length < 3 || cardData.securityCode.length > 4) {
      newErrors.securityCode = 'Código de segurança inválido';
    }

    // Validar nome do portador
    if (!cardData.cardholderName || cardData.cardholderName.trim().length < 2) {
      newErrors.cardholderName = 'Nome do portador é obrigatório';
    }

    // Validar CPF
    const docNumber = cardData.docNumber.replace(/\D/g, '');
    if (!docNumber || docNumber.length !== 11) {
      newErrors.docNumber = 'CPF inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createCardToken = async (cardData) => {
    try {
      // Validar campos obrigatórios
      const requiredFields = ['cardNumber', 'expiration_month', 'expiration_year', 'security_code'];
      for (const field of requiredFields) {
        if (!cardData[field]) {
          throw new Error(`Campo obrigatório ausente: ${field}`);
        }
      }
      
      // Validar cardholder
      if (!cardData.cardholder || !cardData.cardholder.name || !cardData.cardholder.identification?.number) {
        throw new Error('Dados do portador do cartão incompletos');
      }
      
      console.log('Criando token do cartão com dados:', {
        cardNumber: cardData.cardNumber ? cardData.cardNumber.substring(0, 4) + '****' : 'N/A',
        expiration_month: cardData.expiration_month,
        expiration_year: cardData.expiration_year,
        security_code: '***',
        cardholder: {
          name: cardData.cardholder.name,
          identification: {
            type: cardData.cardholder.identification.type,
            number: cardData.cardholder.identification.number ? cardData.cardholder.identification.number.substring(0, 3) + '****' : 'N/A'
          }
        }
      });
      
      if (!window.mp || !window.mp.createCardToken) {
        throw new Error('SDK do Mercado Pago não está disponível');
      }
      
      const tokenData = await window.mp.createCardToken(cardData);
      console.log('Token criado com sucesso:', tokenData?.id ? { id: tokenData.id } : tokenData);
      return tokenData;
    } catch (error) {
      console.error('Erro detalhado ao criar token:', error);
      throw new Error('Erro ao processar dados do cartão: ' + (error.message || 'Verifique os dados informados'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCard()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Criar token do cartão com estrutura correta da API do Mercado Pago
      const cardForm = {
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        expiration_month: cardData.expiryMonth,
        expiration_year: cardData.expiryYear,
        security_code: cardData.securityCode,
        cardholder: {
          name: cardData.cardholderName,
          identification: {
            type: 'CPF',
            number: cardData.docNumber.replace(/\D/g, '')
          }
        }
      };
      
      console.log('Dados do formulário preparados:', {
        ...cardForm,
        cardNumber: cardForm.cardNumber.substring(0, 4) + '****',
        securityCode: '***'
      });
      
      const cardToken = await createCardToken(cardForm);
      
      if (!cardToken || !cardToken.id) {
        throw new Error('Erro ao gerar token do cartão');
      }

      // Enviar pagamento para o backend
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/payments/create-credit-card',
        {
          cardData: {
            token: cardToken.id,
            payment_method_id: cardToken.payment_method_id
          },
          installments: installments,
          amount: amount
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        onPaymentSuccess(response.data);
      } else {
        throw new Error(response.data.error || 'Erro ao processar pagamento');
      }

    } catch (error) {
      console.error('Erro no pagamento:', error);
      let errorMessage = 'Erro ao processar pagamento';
      
      if (error.message && error.message.includes('recursos de la API')) {
        errorMessage = 'Erro de configuração do sistema de pagamento. Tente novamente em alguns minutos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCardData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatCPF = (value) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (!mercadoPagoLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando formulário de pagamento...</p>
          <p className="text-sm text-gray-500 mt-2">Inicializando sistema de pagamento seguro...</p>
        </div>
      </div>
    );
  }

  // Cartões de teste do Mercado Pago
  const testCards = [
    {
      name: "Teste - Aprovado", 
      number: "5031 7557 3453 0604",
      holder: "APRO",
      expiry: "11/25",
      cvv: "123",
      cpf: "12345678909"
    },
    {
      name: "Teste - Reprovado",
      number: "4000 0000 0000 0002",
      holder: "OTHE",
      expiry: "11/25",
      cvv: "123",
      cpf: "12345678909"
    }
  ];

  const fillTestCard = (card) => {
    setCardData({
      cardNumber: card.number,
      expiryMonth: card.expiry.split('/')[0],
      expiryYear: '20' + card.expiry.split('/')[1],
      securityCode: card.cvv,
      cardholderName: card.holder,
      docType: 'CPF',
      docNumber: card.cpf
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cartões de Teste - só aparecem em ambiente de teste */}
      {(isTestEnvironment || process.env.REACT_APP_PROFILE === 'development') && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">🧪 Cartões de Teste do Mercado Pago</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {testCards.map((card, index) => (
              <button
                key={index}
                type="button"
                onClick={() => fillTestCard(card)}
                className="text-left p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
              >
                <div className="text-sm font-medium text-blue-900">{card.name}</div>
                <div className="text-xs text-blue-700">{card.number}</div>
                <div className="text-xs text-blue-600">Titular: {card.holder}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-700">
            💡 Clique em um cartão para preencher automaticamente os dados de teste
          </p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-4">Dados do Cartão de Crédito</h3>
        
        {/* Número do Cartão */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número do Cartão
          </label>
          <input
            type="text"
            value={cardData.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength="19"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cardNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cardNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
          )}
        </div>

        {/* Nome do Portador */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Portador
          </label>
          <input
            type="text"
            value={cardData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value.toUpperCase())}
            placeholder="NOME COMO ESTÁ NO CARTÃO"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cardholderName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cardholderName && (
            <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
          )}
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mês
            </label>
            <select
              value={cardData.expiryMonth}
              onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Mês</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            {errors.expiryMonth && (
              <p className="text-red-500 text-sm mt-1">{errors.expiryMonth}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano
            </label>
            <select
              value={cardData.expiryYear}
              onChange={(e) => handleInputChange('expiryYear', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expiryYear ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Ano</option>
              {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.expiryYear && (
              <p className="text-red-500 text-sm mt-1">{errors.expiryYear}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVV
            </label>
            <input
              type="text"
              value={cardData.securityCode}
              onChange={(e) => handleInputChange('securityCode', e.target.value.replace(/\D/g, ''))}
              placeholder="123"
              maxLength="4"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.securityCode ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.securityCode && (
              <p className="text-red-500 text-sm mt-1">{errors.securityCode}</p>
            )}
          </div>
        </div>

        {/* CPF */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CPF
          </label>
          <input
            type="text"
            value={cardData.docNumber}
            onChange={(e) => handleInputChange('docNumber', formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength="14"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.docNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.docNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.docNumber}</p>
          )}
        </div>

        {/* Parcelas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parcelas
          </label>
          <select
            value={installments}
            onChange={(e) => setInstallments(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1x de R$ {amount.toFixed(2)} (à vista)</option>
            <option value={2}>2x de R$ {(amount / 2).toFixed(2)}</option>
            <option value={3}>3x de R$ {(amount / 3).toFixed(2)}</option>
            <option value={6}>6x de R$ {(amount / 6).toFixed(2)}</option>
            <option value={12}>12x de R$ {(amount / 12).toFixed(2)}</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processando...
          </>
        ) : (
          `Pagar R$ ${amount.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

export default CreditCardForm;