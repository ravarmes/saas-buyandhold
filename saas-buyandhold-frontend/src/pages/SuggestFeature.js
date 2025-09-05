import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmailService from '../services/emailService';

const SuggestFeature = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    category: 'interface',
    priority: 'medium',
    title: '',
    description: '',
    useCase: '',
    benefits: '',
    targetUsers: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (!formData.title.trim()) {
      setError('Título da funcionalidade é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('Descrição é obrigatória');
      setLoading(false);
      return;
    }
    if (!formData.useCase.trim()) {
      setError('Caso de uso é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const result = await EmailService.sendFeatureSuggestion(formData);

      if (result.success) {
        setSuccess(true);
        setFormData({
          ...formData,
          title: '',
          description: '',
          useCase: '',
          benefits: ''
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao enviar sugestão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/profile" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Voltar ao Perfil
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">💡 Sugerir Funcionalidade</h1>
        <p className="text-gray-600 mt-2">
          Tem uma ideia para melhorar nossa plataforma? Compartilhe conosco!
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Suggestion Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Nova Sugestão</h2>
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
                ✅ Sugestão enviada com sucesso! Obrigado pela contribuição.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Feature Classification */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="interface">🎨 Interface/UX</option>
                    <option value="calculation">🧮 Cálculos</option>
                    <option value="portfolio">📊 Carteiras</option>
                    <option value="analytics">📈 Analytics</option>
                    <option value="integration">🔗 Integrações</option>
                    <option value="mobile">📱 Mobile</option>
                    <option value="automation">🤖 Automação</option>
                    <option value="other">🔧 Outro</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade Sugerida
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">🟢 Baixa - Nice to have</option>
                    <option value="medium">🟡 Média - Melhoria útil</option>
                    <option value="high">🔴 Alta - Muito importante</option>
                    <option value="critical">🚨 Crítica - Essencial</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="targetUsers" className="block text-sm font-medium text-gray-700 mb-1">
                    Usuários Alvo
                  </label>
                  <select
                    id="targetUsers"
                    name="targetUsers"
                    value={formData.targetUsers}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">👥 Todos os usuários</option>
                    <option value="free">🆓 Usuários gratuitos</option>
                    <option value="premium">⭐ Usuários premium</option>
                    <option value="beginners">🌱 Iniciantes</option>
                    <option value="advanced">🎯 Avançados</option>
                  </select>
                </div>
              </div>

              {/* Feature Details */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Funcionalidade *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Gráficos de evolução da carteira"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição Detalhada *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descreva a funcionalidade que você gostaria de ver implementada..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  required
                />
              </div>

              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-1">
                  Caso de Uso *
                </label>
                <textarea
                  id="useCase"
                  name="useCase"
                  value={formData.useCase}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Como e quando você usaria esta funcionalidade? Que problema ela resolveria?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  required
                />
              </div>

              <div>
                <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">
                  Benefícios Esperados
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Quais benefícios esta funcionalidade traria para você e outros usuários?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-md font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? 'Enviando Sugestão...' : '💡 Enviar Sugestão'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guidelines */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">💭 Dicas para uma Boa Sugestão</h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Seja específico sobre o que quer</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Explique o problema que resolve</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Descreva como você usaria</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Mencione benefícios para outros</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Inclua exemplos se possível</span>
              </div>
            </div>
          </div>

          {/* Popular Suggestions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">🔥 Sugestões Populares</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>📊 Gráficos avançados</span>
                <span className="text-blue-600 font-medium">23 votos</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>📱 App mobile</span>
                <span className="text-blue-600 font-medium">18 votos</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>🔔 Notificações</span>
                <span className="text-blue-600 font-medium">15 votos</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>📈 Análise técnica</span>
                <span className="text-blue-600 font-medium">12 votos</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Outras Opções</h3>
            
            <div className="space-y-3">
              <Link
                to="/help-center"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                📚 Central de Ajuda
              </Link>
              
              <Link
                to="/contact"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💬 Entrar em Contato
              </Link>
              
              <Link
                to="/report-bug"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🐛 Reportar Bug
              </Link>
            </div>
          </div>

          {/* Process Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">🔄 Processo de Avaliação</h3>
            <div className="text-blue-700 text-sm space-y-2">
              <p>• <strong>Recebimento:</strong> Confirmação imediata</p>
              <p>• <strong>Análise:</strong> Avaliação técnica</p>
              <p>• <strong>Priorização:</strong> Roadmap do produto</p>
              <p>• <strong>Desenvolvimento:</strong> Conforme demanda</p>
              <p>• <strong>Feedback:</strong> Atualizações por email</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestFeature;