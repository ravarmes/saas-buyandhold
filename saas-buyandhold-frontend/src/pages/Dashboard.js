import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { AdBannerHeader, AdBannerSidebar } from '../components/AdBanner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const { portfolios, currentPortfolio, switchPortfolio, createPortfolio, deletePortfolio } = usePortfolio();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);

  const handleCreatePortfolio = async () => {
    if (newPortfolioName.trim()) {
      try {
        await createPortfolio(newPortfolioName.trim());
        setNewPortfolioName('');
        setShowCreateModal(false);
      } catch (error) {
        console.error('Erro ao criar carteira:', error);
      }
    }
  };

  const handleDeletePortfolio = async () => {
    if (portfolioToDelete) {
      try {
        await deletePortfolio(portfolioToDelete.id);
        setShowDeleteModal(false);
        setPortfolioToDelete(null);
      } catch (error) {
        console.error('Erro ao deletar carteira:', error);
      }
    }
  };

  const confirmDeletePortfolio = (portfolio) => {
    setPortfolioToDelete(portfolio);
    setShowDeleteModal(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateDistribution = (assets) => {
    if (!assets || assets.length === 0) {
      return { stocks: 0, reits: 0 };
    }

    const totalValue = assets.reduce((sum, asset) => {
      const currentValue = (parseFloat(asset.price) || 0) * (parseInt(asset.quantity) || 0);
      return sum + currentValue;
    }, 0);
    
    if (totalValue === 0) {
      return { stocks: 0, reits: 0 };
    }

    const stocksValue = assets
      .filter(asset => asset.type === 'stock')
      .reduce((sum, asset) => {
        const currentValue = (parseFloat(asset.price) || 0) * (parseInt(asset.quantity) || 0);
        return sum + currentValue;
      }, 0);
    
    const reitsValue = assets
      .filter(asset => asset.type === 'reit')
      .reduce((sum, asset) => {
        const currentValue = (parseFloat(asset.price) || 0) * (parseInt(asset.quantity) || 0);
        return sum + currentValue;
      }, 0);

    return {
      stocks: (stocksValue / totalValue) * 100,
      reits: (reitsValue / totalValue) * 100
    };
  };

  const calculateAssetPercentages = (assets) => {
    if (!assets || assets.length === 0) return [];
    
    const totalValue = assets.reduce((sum, asset) => {
      const currentValue = (parseFloat(asset.price) || 0) * (parseInt(asset.quantity) || 0);
      return sum + currentValue;
    }, 0);
    
    if (totalValue === 0) return assets.map(asset => ({ ...asset, percentage: 0 }));
    
    return assets
      .map(asset => {
        const currentValue = (parseFloat(asset.price) || 0) * (parseInt(asset.quantity) || 0);
        return {
          ...asset,
          currentValue,
          percentage: (currentValue / totalValue) * 100
        };
      })
      .filter(asset => asset.percentage > 0);
  };

  const calculateAssetTargetPercentage = (asset, targetPercentages, totalPortfolioValue) => {
    if (!asset.targetAllocation || totalPortfolioValue === 0) return 0;
    
    const assetTypePercentage = asset.type === 'stock' ? targetPercentages.stocks : targetPercentages.reits;
    return (parseFloat(asset.targetAllocation) / 100) * (assetTypePercentage / 100) * 100;
  };

  const groupAssetsByType = (assets) => {
    const stocks = assets.filter(asset => asset.type === 'stock').sort((a, b) => b.percentage - a.percentage);
    const reits = assets.filter(asset => asset.type === 'reit').sort((a, b) => b.percentage - a.percentage);
    return { stocks, reits };
  };

  const getTargetPercentages = () => {
    // Usar as configurações da carteira atual se disponível
    if (currentPortfolio?.stocksPercentage !== undefined && currentPortfolio?.reitsPercentage !== undefined) {
      return {
        stocks: currentPortfolio.stocksPercentage,
        reits: currentPortfolio.reitsPercentage
      };
    }
    
    // Fallback para preferências do usuário
    if (user?.preferences) {
      return {
        stocks: user.preferences.stocksPercentage || 70,
        reits: user.preferences.reitsPercentage || 30
      };
    }
    
    // Valores padrão
    return { stocks: 70, reits: 30 };
  };

  const distribution = currentPortfolio ? calculateDistribution(currentPortfolio.assets) : { stocks: 0, reits: 0 };
  const targetPercentages = getTargetPercentages();
  const assetsWithPercentages = currentPortfolio ? calculateAssetPercentages(currentPortfolio.assets) : [];
  const groupedAssets = groupAssetsByType(assetsWithPercentages);
  const totalPortfolioValue = currentPortfolio?.totalValue || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas carteiras e otimize seus investimentos
          </p>
        </div>
        
        {/* Plan Badge */}
        <div className={`mt-4 sm:mt-0 px-4 py-2 rounded-full text-sm font-medium ${
          permissions.isPremium
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {permissions.isPremium ? '⭐ Premium' : '🆓 Gratuito'}
        </div>
      </div>

      {/* Ad Banner - Header (only for free users) */}
      {!permissions.isPremium && (
        <div className="flex justify-center mb-6">
          <AdBannerHeader />
        </div>
      )}

      {/* Portfolio Selector */}
      {portfolios.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Suas Carteiras</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className={`p-4 border-2 rounded-lg transition-all relative ${
                  currentPortfolio?.id === portfolio.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div 
                  onClick={() => switchPortfolio(portfolio)}
                  className="cursor-pointer"
                >
                  <h3 className="font-medium">{portfolio.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(portfolio.totalValue || 0)}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    {portfolio.assets?.length || 0} ativos
                  </div>
                </div>
                
                {/* Botão de remoção - só aparece se não for a carteira temporária e se houver mais de uma carteira */}
                {portfolio.id !== 'temp' && portfolios.length > 1 && permissions.save && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeletePortfolio(portfolio);
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                    title="Remover carteira"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Portfolio Overview */}
      {currentPortfolio && (
        <div className={`grid gap-6 mb-8 ${
          !permissions.isPremium 
            ? 'grid-cols-1 lg:grid-cols-4' 
            : 'grid-cols-1 lg:grid-cols-3'
        }`}>
          {/* Main Content */}
          <div className={!permissions.isPremium ? 'lg:col-span-2' : 'lg:col-span-2'}>
            {/* Portfolio Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{currentPortfolio.name}</h2>
                <Link
                  to="/settings"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Configurar →
                </Link>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentPortfolio.totalValue || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Valor Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {distribution.stocks.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Atual</p>
                  <p className="text-sm text-gray-600">Ações (Meta: {targetPercentages.stocks}%)</p>
                  <div className={`text-xs mt-1 ${
                    Math.abs(distribution.stocks - targetPercentages.stocks) <= 2 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {distribution.stocks > targetPercentages.stocks ? '+' : ''}
                    {(distribution.stocks - targetPercentages.stocks).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {distribution.reits.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Atual</p>
                  <p className="text-sm text-gray-600">FIIs (Meta: {targetPercentages.reits}%)</p>
                  <div className={`text-xs mt-1 ${
                    Math.abs(distribution.reits - targetPercentages.reits) <= 2 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {distribution.reits > targetPercentages.reits ? '+' : ''}
                    {(distribution.reits - targetPercentages.reits).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Distribution Bar */}
              <div className="mb-4">
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500"
                    style={{ width: `${distribution.stocks}%` }}
                  ></div>
                  <div 
                    className="bg-green-500"
                    style={{ width: `${distribution.reits}%` }}
                  ></div>
                  {distribution.stocks + distribution.reits < 100 && (
                    <div 
                      className="bg-gray-200"
                      style={{ width: `${100 - distribution.stocks - distribution.reits}%` }}
                    ></div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>Ações ({distribution.stocks.toFixed(1)}%)</span>
                  <span>FIIs ({distribution.reits.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Assets List */}
              {assetsWithPercentages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Composição da Carteira</h3>
                  
                  {/* Stocks Section */}
                  {groupedAssets.stocks.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-3 flex items-center">
                        <span className="text-blue-500 mr-2">📈</span>
                        Ações ({groupedAssets.stocks.length})
                      </h4>
                      <div className="space-y-3">
                        {groupedAssets.stocks.map((asset, index) => {
                          const targetPercentage = calculateAssetTargetPercentage(asset, targetPercentages, totalPortfolioValue);
                          const difference = asset.percentage - targetPercentage;
                          const isWithinTarget = Math.abs(difference) <= 1;
                          
                          return (
                            <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{asset.ticker}</span>
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    Ação
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{asset.name}</p>
                                {targetPercentage > 0 && (
                                  <div className={`text-xs mt-1 ${
                                    isWithinTarget ? 'text-green-600' : 'text-orange-600'
                                  }`}>
                                    Meta: {targetPercentage.toFixed(1)}% | Diferença: {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatCurrency(asset.currentValue || 0)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {asset.percentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* REITs Section */}
                  {groupedAssets.reits.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-3 flex items-center">
                        <span className="text-green-500 mr-2">🏢</span>
                        FIIs ({groupedAssets.reits.length})
                      </h4>
                      <div className="space-y-3">
                        {groupedAssets.reits.map((asset, index) => {
                          const targetPercentage = calculateAssetTargetPercentage(asset, targetPercentages, totalPortfolioValue);
                          const difference = asset.percentage - targetPercentage;
                          const isWithinTarget = Math.abs(difference) <= 1;
                          
                          return (
                            <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{asset.ticker}</span>
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    FII
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{asset.name}</p>
                                {targetPercentage > 0 && (
                                  <div className={`text-xs mt-1 ${
                                    isWithinTarget ? 'text-green-600' : 'text-orange-600'
                                  }`}>
                                    Meta: {targetPercentage.toFixed(1)}% | Diferença: {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatCurrency(asset.currentValue || 0)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {asset.percentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assets Count */}
              <div className="text-sm text-gray-600">
                {currentPortfolio.assets?.length || 0} ativos na carteira
              </div>
            </div>

          </div>
          
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                  <Link
                    to="/calculator"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    📊 Calculadora
                  </Link>

                  <Link
                    to="/settings"
                    className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    ⚙️ Configurações
                  </Link>

                  {permissions.isPremium && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="block w-full border border-blue-300 text-blue-600 text-center py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    >
                      ➕ Nova Carteira
                    </button>
                  )}
                </div>
              </div>

              {/* Premium Upgrade */}
              {!permissions.isPremium && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-2">🚀 Upgrade para Premium</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Desbloqueie carteiras ilimitadas, salvamento automático e muito mais!
                  </p>
                  <button 
                    onClick={() => navigate('/upgrade')}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Ver Planos
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Ad Banner - Sidebar (only for free users) */}
          {!permissions.isPremium && (
            <div className="lg:col-span-1 flex justify-center">
              <AdBannerSidebar />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!currentPortfolio && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comece criando sua primeira carteira
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Monte sua carteira de investimentos e receba sugestões inteligentes 
            para otimizar seus resultados.
          </p>
          <Link
            to="/settings"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Criar Carteira
          </Link>
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Nova Carteira</h3>
            <input
              type="text"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="Nome da carteira"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePortfolio}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Portfolio Modal */}
      {showDeleteModal && portfolioToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja deletar a carteira <strong>"{portfolioToDelete.name}"</strong>? 
              Esta ação não pode ser desfeita e todos os ativos da carteira serão removidos.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPortfolioToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePortfolio}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
