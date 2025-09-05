import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmailService from '../services/emailService';

const ReportBug = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bugType: 'interface',
    severity: 'medium',
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    browser: '',
    device: ''
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
      setError('Título do bug é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('Descrição é obrigatória');
      setLoading(false);
      return;
    }
    if (!formData.stepsToReproduce.trim()) {
      setError('Passos para reproduzir são obrigatórios');
      setLoading(false);
      return;
    }
    if (!formData.expectedBehavior.trim()) {
      setError('Comportamento esperado é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.actualBehavior.trim()) {
      setError('Comportamento atual é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const result = await EmailService.sendBugReport(formData);

      if (result.success) {
        setSuccess(true);
        setFormData({
          ...formData,
          title: '',
          description: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          browser: '',
          device: ''
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao enviar relatório. Tente novamente.');
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
        <h1 className="text-3xl font-bold text-gray-900">🐛 Reportar Bug</h1>
        <p className="text-gray-600 mt-2">
          Encontrou um problema? Ajude-nos a melhorar relatando bugs detalhadamente.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Bug Report Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Relatório de Bug</h2>
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
                ✅ Bug reportado com sucesso! Nossa equipe irá investigar.
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

              {/* Bug Classification */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bugType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo do Bug
                  </label>
                  <select
                    id="bugType"
                    name="bugType"
                    value={formData.bugType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="interface">🎨 Interface/Visual</option>
                    <option value="calculation">⚙️ Cálculos/Funcionalidade</option>
                    <option value="performance">🚀 Performance</option>
                    <option value="data">📊 Dados</option>
                    <option value="security">🔒 Segurança</option>
                    <option value="other">🔧 Outro</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                    Severidade
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">🟢 Baixa - Problema menor</option>
                    <option value="medium">🟡 Média - Afeta funcionalidade</option>
                    <option value="high">🔴 Alta - Impede uso normal</option>
                    <option value="critical">🚨 Crítica - Sistema inutilizável</option>
                  </select>
                </div>
              </div>

              {/* Bug Details */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Bug *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Calculadora não exibe resultados corretos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do Problema *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descreva o problema encontrado de forma clara e detalhada..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  required
                />
              </div>

              <div>
                <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 mb-1">
                  Passos para Reproduzir *
                </label>
                <textarea
                  id="stepsToReproduce"
                  name="stepsToReproduce"
                  value={formData.stepsToReproduce}
                  onChange={handleChange}
                  rows={4}
                  placeholder="1. Acesse a página...\n2. Clique em...\n3. Digite...\n4. Observe o erro..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-1">
                    Comportamento Esperado *
                  </label>
                  <textarea
                    id="expectedBehavior"
                    name="expectedBehavior"
                    value={formData.expectedBehavior}
                    onChange={handleChange}
                    rows={3}
                    placeholder="O que deveria acontecer..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-1">
                    Comportamento Atual *
                  </label>
                  <textarea
                    id="actualBehavior"
                    name="actualBehavior"
                    value={formData.actualBehavior}
                    onChange={handleChange}
                    rows={3}
                    placeholder="O que realmente acontece..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                    required
                  />
                </div>
              </div>

              {/* Environment Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="browser" className="block text-sm font-medium text-gray-700 mb-1">
                    Navegador e Versão
                  </label>
                  <input
                    type="text"
                    id="browser"
                    name="browser"
                    value={formData.browser}
                    onChange={handleChange}
                    placeholder="Ex: Chrome 120.0, Firefox 121.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
                    Dispositivo/Sistema
                  </label>
                  <input
                    type="text"
                    id="device"
                    name="device"
                    value={formData.device}
                    onChange={handleChange}
                    placeholder="Ex: Windows 11, iPhone 15, Android"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-md font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {loading ? 'Enviando Relatório...' : '🐛 Reportar Bug'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guidelines */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">📋 Como Reportar um Bug</h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">1.</span>
                <span>Seja específico no título</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">2.</span>
                <span>Descreva o problema claramente</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">3.</span>
                <span>Liste os passos para reproduzir</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">4.</span>
                <span>Inclua informações do ambiente</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">5.</span>
                <span>Anexe capturas de tela se possível</span>
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
                to="/suggest-feature"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💡 Sugerir Funcionalidade
              </Link>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">🔍 Status do Relatório</h3>
            <div className="text-blue-700 text-sm space-y-2">
              <p>• <strong>Recebido:</strong> Confirmação imediata</p>
              <p>• <strong>Em análise:</strong> 1-2 dias úteis</p>
              <p>• <strong>Correção:</strong> Conforme prioridade</p>
              <p>• <strong>Atualização:</strong> Via email</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBug;