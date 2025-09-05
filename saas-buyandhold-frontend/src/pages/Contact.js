import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmailService from '../services/emailService';

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
    priority: 'normal'
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
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.subject.trim()) {
      setError('Assunto é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.message.trim()) {
      setError('Mensagem é obrigatória');
      setLoading(false);
      return;
    }

    try {
      const result = await EmailService.sendContactEmail(formData);

      if (result.success) {
        setSuccess(true);
        setFormData({
          ...formData,
          subject: '',
          message: ''
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao enviar mensagem. Tente novamente.');
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
        <h1 className="text-3xl font-bold text-gray-900">💬 Entrar em Contato</h1>
        <p className="text-gray-600 mt-2">
          Estamos aqui para ajudar! Envie sua mensagem e responderemos em breve.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Enviar Mensagem</h2>
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
                ✅ Mensagem enviada com sucesso! Responderemos em breve.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
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
                    Email *
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

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">🟢 Baixa</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="high">🔴 Alta</option>
                  <option value="urgent">🚨 Urgente</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Assunto *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Descreva brevemente o motivo do contato"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Descreva detalhadamente sua dúvida, problema ou sugestão..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-md font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Informações de Contato</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 mt-1">📧</div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a 
                    href="mailto:ajuda.brugnara@gmail.com" 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ajuda.brugnara@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-green-600 mt-1">⏰</div>
                <div>
                  <p className="font-medium text-gray-900">Horário de Atendimento</p>
                  <p className="text-gray-600 text-sm">Segunda a Sexta: 9h às 18h</p>
                  <p className="text-gray-600 text-sm">Sábado: 9h às 12h</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-yellow-600 mt-1">⚡</div>
                <div>
                  <p className="font-medium text-gray-900">Tempo de Resposta</p>
                  <p className="text-gray-600 text-sm">Até 24 horas em dias úteis</p>
                </div>
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
                to="/report-bug"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🐛 Reportar Bug
              </Link>
              
              <Link
                to="/suggest-feature"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💡 Sugerir Funcionalidade
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Dicas para um atendimento mais rápido</h3>
            <ul className="text-blue-700 text-sm space-y-2">
              <li>• Seja específico sobre o problema</li>
              <li>• Inclua capturas de tela se necessário</li>
              <li>• Mencione seu plano atual</li>
              <li>• Descreva os passos que levaram ao problema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;