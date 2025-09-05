import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { AdBannerHeader, AdBannerSidebar, AdBannerContent } from '../components/AdBanner';
import TempPortfolioManager from '../components/TempPortfolioManager';
import OfflineCalculator from '../components/OfflineCalculator';
import SuccessModal from '../components/SuccessModal';
import ConfirmationModal from '../components/ConfirmationModal';
import axios from 'axios';

const Calculator = () => {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const { currentPortfolio, loadCurrentPortfolio } = usePortfolio();
  
  // Estado para carteira temporária (usuários não logados)
  const [tempPortfolio, setTempPortfolio] = useState({
    id: 'demo',
    name: 'Carteira Demo',
    stocksPercentage: 70,
    reitsPercentage: 30,
    totalValue: 0,
    assets: []
  });
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const calculateSuggestions = async () => {
    if (!currentPortfolio) {
      setError('Nenhuma carteira selecionada. Vá para Configurações para criar uma carteira.');
      return;
    }

    if (!currentPortfolio.assets || currentPortfolio.assets.length === 0) {
      setError('Adicione ativos à sua carteira antes de calcular sugestões.');
      return;
    }

    if (investmentAmount <= 0) {
      setError('Informe um valor válido para investimento.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        portfolioId: currentPortfolio.id,
        investmentAmount
      };

      // Se for carteira temporária, enviar dados da carteira
      if (currentPortfolio.id === 'temp') {
        requestData.portfolioData = currentPortfolio;
      }

      const response = await axios.post('/api/investments/calculate', requestData);

      const { suggestions: newSuggestions, summary, validation, currentDistribution, portfolioValue } = response.data;
      
      setSuggestions(newSuggestions);
      setSelectedSuggestions(newSuggestions.map(s => s.ticker));
      setResult({
        summary,
        validation,
        currentDistribution,
        portfolioValue
      });

    } catch (error) {
      console.error('Erro ao calcular sugestões:', error);
      setError(error.response?.data?.error || 'Erro ao calcular sugestões de investimento');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteInvestment = () => {
    if (!permissions.save) {
      setError('Funcionalidade disponível apenas para usuários Premium');
      return;
    }

    if (selectedSuggestions.length === 0) {
      setError('Selecione pelo menos uma sugestão para executar');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeInvestment = async () => {
    setShowConfirmModal(false);

    const selectedSuggestionObjects = suggestions.filter(s => 
      selectedSuggestions.includes(s.ticker)
    );

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/investments/execute', {
        portfolioId: currentPortfolio.id,
        selectedSuggestions: selectedSuggestionObjects
      });

      // Recarregar apenas a carteira atual para atualizar os valores
      await loadCurrentPortfolio(currentPortfolio.id);

      // Limpar sugestões após execução
      setSuggestions([]);
      setSelectedSuggestions([]);
      setResult(null);

      // Preparar dados para o modal de sucesso
      const executedAssets = selectedSuggestionObjects.map(s => 
        `${s.ticker} - ${s.quantityToBuy} cotas por R$ ${s.price.toFixed(2)}`
      );
      
      setSuccessModalData({
        title: 'Investimento Executado com Sucesso!',
        message: 'Seu investimento foi processado e sua carteira foi atualizada.',
        details: executedAssets
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Erro ao executar investimento:', error);
      setError(error.response?.data?.error || 'Erro ao executar investimento');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (ticker) => {
    setSelectedSuggestions(prev => 
      prev.includes(ticker) 
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  // Funções para gerenciar carteira temporária
  const handleUpdateTempPortfolio = (updates) => {
    setTempPortfolio(prev => ({ ...prev, ...updates }));
  };

  const handleAddTempAsset = (assetData) => {
    const newAsset = {
      id: `demo-${Date.now()}`,
      ...assetData,
      ticker: assetData.ticker.toUpperCase()
    };
    
    const updatedAssets = [...tempPortfolio.assets];
    const existingIndex = updatedAssets.findIndex(a => a.ticker === newAsset.ticker);
    
    if (existingIndex >= 0) {
      updatedAssets[existingIndex].quantity += newAsset.quantity;
    } else {
      updatedAssets.push(newAsset);
    }
    
    const totalValue = updatedAssets.reduce((sum, asset) => 
      sum + (asset.price * asset.quantity), 0
    );
    
    setTempPortfolio(prev => ({
      ...prev,
      assets: updatedAssets,
      totalValue
    }));
  };

  const handleRemoveTempAsset = (assetId) => {
    const updatedAssets = tempPortfolio.assets.filter(asset => asset.id !== assetId);
    const totalValue = updatedAssets.reduce((sum, asset) => 
      sum + (asset.price * asset.quantity), 0
    );
    
    setTempPortfolio(prev => ({
      ...prev,
      assets: updatedAssets,
      totalValue
    }));
  };

  const handleUpdateTempAsset = (assetId, data) => {
    const updatedAssets = tempPortfolio.assets.map(asset =>
      asset.id === assetId ? { ...asset, ...data } : asset
    );
    
    const totalValue = updatedAssets.reduce((sum, asset) => 
      sum + (asset.price * asset.quantity), 0
    );
    
    setTempPortfolio(prev => ({
      ...prev,
      assets: updatedAssets,
      totalValue
    }));
  };

  const handleShowUpgrade = () => {
    navigate('/register');
  };

  const calculateSelectedTotal = () => {
    return suggestions
      .filter(s => selectedSuggestions.includes(s.ticker))
      .reduce((sum, s) => sum + s.value, 0);
  };

  const remainingValue = investmentAmount - calculateSelectedTotal();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderizar versão apropriada baseada no status do usuário
  if (!user) {
    // Versão demo para usuários não logados
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Calculadora de Investimentos - Demo
            </h1>
            <p className="text-gray-600 mt-2">
              Teste nossa calculadora antes de criar sua conta
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar Conta
            </Link>
            <Link
              to="/login"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-1">🚀 Modo Demonstração</h3>
          <p className="text-yellow-700 text-sm">
            Esta é uma versão de teste. Seus dados não serão salvos. 
            <Link to="/register" className="font-medium underline ml-1">
              Crie uma conta gratuita
            </Link> para salvar suas carteiras.
          </p>
        </div>

        {/* Ad Banner - Header (only for free users) */}
        {!permissions.isPremium && (
          <div className="flex justify-center mb-6">
            <AdBannerHeader />
          </div>
        )}

        <div className={`grid gap-8 ${!permissions.isPremium ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Ad Banner - Sidebar (only for free users) */}
          {!permissions.isPremium && (
            <div className="lg:col-span-1 flex justify-center">
              <AdBannerSidebar />
            </div>
          )}
          
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${!permissions.isPremium ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
          {/* Portfolio Manager */}
          <TempPortfolioManager
            portfolio={tempPortfolio}
            onUpdatePortfolio={handleUpdateTempPortfolio}
            onAddAsset={handleAddTempAsset}
            onRemoveAsset={handleRemoveTempAsset}
            onUpdateAsset={handleUpdateTempAsset}
          />
          
          {/* Calculator */}
          <OfflineCalculator
            portfolio={tempPortfolio}
            onShowUpgrade={handleShowUpgrade}
          />
          </div>
        </div>
        
        {/* Ad Banner - Content (only for free users) */}
        {!permissions.isPremium && (
          <div className="flex justify-center mt-8">
            <AdBannerContent />
          </div>
        )}
      </div>
    );
  }

  // Versão completa para usuários logados
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Calculadora de Investimentos
          </h1>
          <p className="text-gray-600 mt-2">
            Receba sugestões inteligentes para otimizar sua carteira
          </p>
        </div>
        
        {/* Plan badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          permissions.save
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {permissions.save ? '⭐ Premium' : '🆓 Gratuito'}
        </div>
      </div>

      {/* Ad Banner - Header (only for free users) */}
      {!permissions.isPremium && (
        <div className="flex justify-center mb-6">
          <AdBannerHeader />
        </div>
      )}

      {/* Current Portfolio Info */}
      {currentPortfolio && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900">
            📊 Carteira Atual: {currentPortfolio.name}
          </h3>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Valor Total:</span>
              <span className="font-medium ml-1">
                {formatCurrency(currentPortfolio.totalValue || 0)}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Ativos:</span>
              <span className="font-medium ml-1">
                {currentPortfolio.assets?.length || 0}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Meta Ações:</span>
              <span className="font-medium ml-1">
                {currentPortfolio.stocksPercentage}%
              </span>
            </div>
            <div>
              <span className="text-blue-700">Meta FIIs:</span>
              <span className="font-medium ml-1">
                {currentPortfolio.reitsPercentage}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Investment Amount */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor disponível para investir
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <span className="text-gray-500 text-lg">R$</span>
                </div>
                <input
                  type="number"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quanto você quer investir?"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>
            
            <button
              onClick={calculateSuggestions}
              disabled={loading || !currentPortfolio}
              className={`w-full py-3 rounded-md font-medium transition-colors ${
                loading || !currentPortfolio
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Calculando...
                </div>
              ) : (
                'Gerar Sugestões'
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* No Portfolio Warning */}
          {!currentPortfolio && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Nenhuma carteira encontrada
                  </h3>
                  <div className="mt-2 text-sm">
                    <p>
                      Você precisa criar uma carteira e adicionar ativos antes de calcular sugestões.
                    </p>
                    <Link
                      to="/settings"
                      className="font-medium underline hover:text-yellow-600"
                    >
                      Ir para Configurações →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Sugestões de Investimento
                </h3>
                {result && (
                  <div className="text-sm text-gray-600">
                    Carteira atual: {formatCurrency(result.portfolioValue)}
                  </div>
                )}
              </div>

              {/* Summary */}
              {result && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">Distribuição sugerida:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Ações:</span> {formatCurrency(result.summary.stocksAllocation)}
                    </div>
                    <div>
                      <span className="text-green-600">FIIs:</span> {formatCurrency(result.summary.reitsAllocation)}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.length === suggestions.length}
                          onChange={(e) => {
                            setSelectedSuggestions(
                              e.target.checked ? suggestions.map(s => s.ticker) : []
                            );
                          }}
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ativo
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Preço
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Qtd
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {suggestions.map((suggestion) => (
                      <tr key={suggestion.ticker}>
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedSuggestions.includes(suggestion.ticker)}
                            onChange={() => toggleSuggestion(suggestion.ticker)}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{suggestion.ticker}</p>
                            <p className="text-sm text-gray-600">{suggestion.name}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              suggestion.type === 'stock' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {suggestion.type === 'stock' ? 'Ação' : 'FII'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right text-sm">
                          {formatCurrency(suggestion.price)}
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-medium">
                          {suggestion.quantityToBuy}
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-bold">
                          {formatCurrency(suggestion.value)}
                        </td>
                        <td className="px-3 py-4 text-center text-xs text-gray-600">
                          {suggestion.reasoning || (suggestion.deficitPercentage !== undefined ? `${suggestion.deficitPercentage.toFixed(1)}% déficit` : 'Rebalanceamento')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">Total selecionado:</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateSelectedTotal())}
                    </p>
                    <p className={`text-sm ${remainingValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {remainingValue >= 0 
                        ? `Restante: ${formatCurrency(remainingValue)}` 
                        : `Excesso: ${formatCurrency(Math.abs(remainingValue))}`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {permissions.save ? (
                      <button
                        onClick={handleExecuteInvestment}
                        disabled={loading || remainingValue < 0 || selectedSuggestions.length === 0}
                        className={`px-6 py-3 rounded-md font-medium ${
                          loading || remainingValue < 0 || selectedSuggestions.length === 0
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        Executar Investimento
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Upgrade para Premium para executar investimentos
                        </p>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                          Fazer Upgrade
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          {result && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h4 className="font-medium text-gray-700 mb-3">Resumo da Carteira</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Valor atual:</span>
                  <span className="font-medium">{formatCurrency(result.portfolioValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ações:</span>
                  <span className="text-blue-600">{result.currentDistribution.stocks.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>FIIs:</span>
                  <span className="text-green-600">{result.currentDistribution.reits.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade prompt para usuários gratuitos */}
          {!permissions.save && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6">
              <h4 className="font-bold text-blue-900 mb-2">🚀 Upgrade Premium</h4>
              <p className="text-blue-700 text-sm mb-4">
                Salve suas carteiras, execute investimentos e tenha acesso completo a todas as funcionalidades.
              </p>
              <button 
                onClick={() => navigate('/upgrade')}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Ver Planos
              </button>
            </div>
          )}

          {/* Help */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">💡 Como funciona?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Analisa sua carteira atual</li>
              <li>• Compara com seus objetivos</li>
              <li>• Sugere investimentos para rebalanceamento</li>
              <li>• Prioriza ativos com maior déficit</li>
            </ul>
            
            {/* Disclaimer Legal */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800 leading-relaxed">
                <strong>⚠️ Aviso Legal:</strong> As sugestões apresentadas são meramente informativas e educacionais, 
                não constituindo recomendação de investimento. O usuário é o único responsável por suas decisões 
                de investimento. Investimentos em ações e FIIs envolvem riscos e podem resultar em perdas. 
                Recomendamos consultar um assessor financeiro qualificado antes de tomar qualquer decisão de investimento.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeInvestment}
        title="Confirmar Execução do Investimento"
        message={`Tem certeza que deseja executar o investimento de ${selectedSuggestions.length} ativo(s) selecionado(s)? Esta ação irá atualizar sua carteira permanentemente.`}
        confirmText="Executar Investimento"
        cancelText="Cancelar"
        isLoading={loading}
      />
      
      {/* Modal de Sucesso */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successModalData.title}
        message={successModalData.message}
        details={successModalData.details}
      />
    </div>
  );
};

export default Calculator;
