import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const UpgradeSuccess = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const transactionId = searchParams.get('transaction');
        const buyerEmail = searchParams.get('buyer_email');
        
        if (transactionId) {
          // Verificar o status da transação no Mercado Pago
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `/payments/mercadopago/status/${transactionId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.data.success && response.data.transaction?.status === 'APPROVED') {
            setSuccess(true);
            // Atualizar dados do usuário
            await refreshUser();
            
            // Redirecionar para dashboard após 3 segundos
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          } else {
            setError('Pagamento ainda não foi confirmado. Aguarde alguns minutos.');
          }
        } else {
          setError('ID da transação não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        setError('Erro ao verificar o pagamento. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, refreshUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processando pagamento...</h2>
          <p className="text-gray-600">Aguarde enquanto verificamos seu pagamento.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro no Pagamento</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate('/upgrade')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Voltar para Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pagamento Confirmado!</h2>
        <p className="text-gray-600 mb-6">
          Parabéns! Seu upgrade para o plano Premium foi processado com sucesso.
          Você será redirecionado para o dashboard em alguns segundos.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeSuccess;