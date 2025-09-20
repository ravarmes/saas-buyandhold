import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    // Verificar se o token está presente na URL
    if (!token) {
      setTokenValid(false);
      setError('Token de redefinição não encontrado na URL');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpar erro quando o usuário começar a digitar
    if (error) setError('');
  };

  const validatePassword = () => {
    if (formData.newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await axios.post('/auth/reset-password', {
        token: token,
        newPassword: formData.newPassword
      });
      
      setSuccess(true);
    } catch (error) {
      console.error('Erro:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao redefinir senha';
      setError(errorMessage);
      if (errorMessage && errorMessage.includes('inválido ou expirado')) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Se o token é inválido
  if (!tokenValid) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Link Inválido</h1>
            <p className="text-gray-600 mt-2">Este link de redefinição não é válido ou expirou</p>
          </div>

          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error || 'O link de redefinição de senha é inválido ou expirou. Solicite um novo link.'}
          </div>

          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="w-full block text-center py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Solicitar novo link
            </Link>
            
            <Link
              to="/login"
              className="w-full block text-center py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Se a senha foi redefinida com sucesso
  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Senha Redefinida!</h1>
            <p className="text-gray-600 mt-2">Sua senha foi alterada com sucesso</p>
          </div>

          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Fazer login agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de redefinição de senha
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.414-6.414a6 6 0 015.743-7.743z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Senha</h1>
          <p className="text-gray-600 mt-2">Crie uma senha segura para sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite sua nova senha"
              required
              minLength={6}
            />
            <p className="text-sm text-gray-500 mt-1">
              Mínimo de 6 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nova senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite novamente sua nova senha"
              required
              minLength={6}
            />
          </div>

          {/* Indicador de força da senha */}
          {formData.newPassword && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Força da senha:</div>
              <div className="flex space-x-1">
                <div className={`h-2 w-1/4 rounded ${
                  formData.newPassword.length >= 6 ? 'bg-red-500' : 'bg-gray-200'
                }`}></div>
                <div className={`h-2 w-1/4 rounded ${
                  formData.newPassword.length >= 8 ? 'bg-yellow-500' : 'bg-gray-200'
                }`}></div>
                <div className={`h-2 w-1/4 rounded ${
                  formData.newPassword.length >= 10 && /[A-Z]/.test(formData.newPassword) ? 'bg-blue-500' : 'bg-gray-200'
                }`}></div>
                <div className={`h-2 w-1/4 rounded ${
                  formData.newPassword.length >= 12 && /[A-Z]/.test(formData.newPassword) && /[0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              </div>
              <div className="text-xs text-gray-500">
                Use pelo menos 8 caracteres com letras maiúsculas e números para uma senha mais segura
              </div>
            </div>
          )}

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
                Redefinindo...
              </div>
            ) : (
              'Redefinir senha'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-gray-600 hover:text-gray-700">
            ← Voltar para o login
          </Link>
        </div>

        {/* Dicas de segurança */}
        <div className="mt-8 bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Dicas para uma senha segura</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use pelo menos 8 caracteres</li>
            <li>• Combine letras maiúsculas e minúsculas</li>
            <li>• Inclua números e símbolos</li>
            <li>• Evite informações pessoais óbvias</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;