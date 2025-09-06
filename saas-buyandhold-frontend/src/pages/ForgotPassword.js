import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import emailService from '../services/emailService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Chama o backend para gerar o token
      const response = await axios.post('/auth/forgot-password', { email });
      
      if (response.data && response.data.emailData) {
        // Usar EmailService para enviar o email via EmailJS
        const emailResult = await emailService.sendPasswordResetEmail(
          response.data.emailData.email,
          response.data.emailData.resetLink
        );
        
        if (emailResult.success) {
          setMessage('Email de redefinição enviado com sucesso! Verifique sua caixa de entrada.');
          setEmailSent(true);
        } else {
          setError(emailResult.message || 'Erro ao enviar email de redefinição');
        }
      } else {
        setMessage('Se o email existir em nossa base, você receberá instruções para redefinir sua senha.');
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Erro:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao solicitar redefinição de senha';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Limpar mensagens quando o usuário começar a digitar
    if (error) setError('');
    if (message) setMessage('');
  };

  if (emailSent) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Email Enviado!</h1>
            <p className="text-gray-600 mt-2">Verifique sua caixa de entrada</p>
          </div>

          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {message}
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
              <h3 className="font-medium mb-2">Próximos passos:</h3>
              <ul className="text-sm space-y-1">
                <li>• Verifique sua caixa de entrada (e spam)</li>
                <li>• Clique no link do email recebido</li>
                <li>• O link é válido por 1 hora</li>
                <li>• Crie uma nova senha segura</li>
              </ul>
            </div>

            <div className="text-center space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                  setMessage('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Enviar para outro email
              </button>
              
              <div>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-700"
                >
                  Voltar para o login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.414-6.414a6 6 0 015.743-7.743z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Esqueceu a senha?</h1>
          <p className="text-gray-600 mt-2">Não se preocupe, vamos ajudar você a recuperá-la</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email da sua conta
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Digite o email que você usou para criar sua conta
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enviando...
              </div>
            ) : (
              'Enviar link de redefinição'
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <div>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Voltar para o login
            </Link>
          </div>
          
          <div className="text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Cadastre-se grátis
            </Link>
          </div>
        </div>

        {/* Informações de segurança */}
        <div className="mt-8 bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">🔒 Segurança</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• O link de redefinição expira em 1 hora</li>
            <li>• Só funciona uma vez</li>
            <li>• Sua senha atual permanece válida até você criar uma nova</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;