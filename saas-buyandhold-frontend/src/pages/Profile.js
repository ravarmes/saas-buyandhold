import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, permissions } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpar mensagens quando o usuário começar a digitar
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setSuccess('Perfil atualizado com sucesso!');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setError('');

    try {
      await axios.delete('/api/auth/deactivate-account');
      
      // Fazer logout após desativar a conta
      logout();
      
      // Redirecionar para página inicial com mensagem
      navigate('/', { 
        state: { 
          message: 'Conta desativada com sucesso. Entre em contato com o suporte se precisar reativar.' 
        } 
      });
    } catch (error) {
      console.error('Erro ao desativar conta:', error);
      setError(error.response?.data?.error || 'Erro ao desativar conta');
      setDeleteLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas informações pessoais e configurações da conta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Informações Pessoais</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-md font-medium ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 font-medium"
                >
                  Sair da Conta
                </button>
              </div>
            </form>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Informações da Conta</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">ID da Conta</p>
                  <p className="text-sm text-gray-600">{user?.id}</p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Data de Cadastro</p>
                  <p className="text-sm text-gray-600">
                    {user?.createdAt ? formatDate(user.createdAt) : 'Não disponível'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Último Login</p>
                  <p className="text-sm text-gray-600">
                    {user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'Primeiro acesso'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="font-medium text-gray-900">Status da Conta</p>
                  <p className="text-sm text-gray-600">
                    {user?.subscriptionStatus === 'active' ? 'Ativa' : 'Inativa'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user?.subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user?.subscriptionStatus === 'active' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Plano Atual</h3>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold mb-4 ${
                permissions.isPremium
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {permissions.isPremium ? '⭐ Premium' : '🆓 Gratuito'}
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Carteiras ilimitadas:</span>
                  <span>{permissions.multiplePortfolios ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Salvamento automático:</span>
                  <span>{permissions.save ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Histórico completo:</span>
                  <span>{permissions.history ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Analytics avançados:</span>
                  <span>{permissions.analytics ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sem anúncios:</span>
                  <span>{permissions.isPremium ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>

            {!permissions.isPremium && (
              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all">
                  Fazer Upgrade para Premium
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  7 dias grátis • Cancele a qualquer momento
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Estatísticas</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Carteiras criadas:</span>
                <span className="font-medium">{user?.portfolios?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Simulações realizadas:</span>
                <span className="font-medium">{user?.investmentSimulationsCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Ajuda & Suporte</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/help-center')}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                📚 Central de Ajuda
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💬 Entrar em Contato
              </button>
              <button 
                onClick={() => navigate('/report-bug')}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🐛 Reportar Bug
              </button>
              <button 
                onClick={() => navigate('/suggest-feature')}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💡 Sugerir Funcionalidade
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4">Zona de Perigo</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-100 rounded-md text-sm transition-colors"
              >
                🗑️ Excluir Conta
              </button>
              <p className="text-xs text-red-600">
                Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar Exclusão de Conta
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-4">
                Tem certeza que deseja excluir sua conta? Esta ação irá:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Desativar sua conta permanentemente</li>
                <li>• Impedir futuros logins</li>
                <li>• Manter seus dados para fins de histórico</li>
                <li>• Requerer contato com suporte para reativação</li>
              </ul>
              <p className="text-sm text-red-600 mt-4 font-medium">
                Esta ação não pode ser desfeita por você mesmo.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setError('');
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Excluindo...' : 'Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
