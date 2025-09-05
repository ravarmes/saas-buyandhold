import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import AssetSearchInput from '../components/AssetSearchInput';


const Settings = () => {
  const { permissions } = useAuth();
  const { currentPortfolio, updatePortfolio, addAsset, updateAsset, removeAsset } = usePortfolio();
  
  const [portfolioSettings, setPortfolioSettings] = useState({
    name: '',
    stocksPercentage: 70,
    reitsPercentage: 30
  });
  
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    ticker: '',
    name: '',
    type: 'stock',
    quantity: 0,
    price: 0,
    targetAllocation: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAssetData, setSelectedAssetData] = useState(null);
  const [localAssetAllocations, setLocalAssetAllocations] = useState({});

  // Atualizar configurações quando carteira mudar
  useEffect(() => {
    if (currentPortfolio) {
      setPortfolioSettings({
        name: currentPortfolio.name,
        stocksPercentage: parseFloat(currentPortfolio.stocksPercentage) || 70,
        reitsPercentage: parseFloat(currentPortfolio.reitsPercentage) || 30
      });
    }
  }, [currentPortfolio]);

  const handleAssetSelected = (assetData) => {
    if (assetData) {
      setNewAsset(prev => ({
        ...prev,
        ticker: assetData.ticker,
        name: assetData.name,
        type: assetData.type,
        price: assetData.price > 0 ? assetData.price : prev.price
      }));
      setSelectedAssetData(assetData);
    } else {
      setSelectedAssetData(null);
    }
  };

  const handlePortfolioUpdate = async () => {
    if (!currentPortfolio) return;

    // Validar percentuais da distribuição geral
    if (Math.abs((portfolioSettings.stocksPercentage + portfolioSettings.reitsPercentage) - 100) > 0.01) {
      setError('A soma dos percentuais de ações e FIIs deve ser 100%');
      return;
    }

    // Validar se os percentuais individuais de ações somam 100%
    if (stockAssets.length > 0 && Math.abs(stocksAllocationTotal - 100) > 0.01) {
      setError(`Os percentuais individuais de Ações devem somar 100%. Atual: ${stocksAllocationTotal.toFixed(1)}%`);
      return;
    }

    // Validar se os percentuais individuais de FIIs somam 100%
    if (reitAssets.length > 0 && Math.abs(reitsAllocationTotal - 100) > 0.01) {
      setError(`Os percentuais individuais de FIIs devem somar 100%. Atual: ${reitsAllocationTotal.toFixed(1)}%`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Salvar configurações da carteira
      await updatePortfolio(currentPortfolio.id, portfolioSettings);
      
      // Salvar alocações dos ativos que foram modificadas localmente
      const updatePromises = Object.entries(localAssetAllocations).map(([assetId, targetAllocation]) => 
        updateAsset(assetId, { targetAllocation })
      );
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
      
      // Limpar estado local após salvar
      setLocalAssetAllocations({});
      setSuccess('Configurações salvas com sucesso!');
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao atualizar carteira');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.ticker || !newAsset.name || newAsset.quantity <= 0 || newAsset.price <= 0) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar se a adição do novo ativo não ultrapassará 100%
    const assetsOfSameType = newAsset.type === 'stock' ? stockAssets : reitAssets;
    const currentTotal = assetsOfSameType.reduce((sum, asset) => sum + (parseFloat(asset.targetAllocation) || 0), 0);
    const newTotal = currentTotal + (parseFloat(newAsset.targetAllocation) || 0);
    
    if (newTotal > 100) {
      const assetTypeName = newAsset.type === 'stock' ? 'Ações' : 'FIIs';
      setError(`A alocação total de ${assetTypeName} não pode ultrapassar 100%. Atual: ${currentTotal.toFixed(1)}%, Tentando adicionar: ${(parseFloat(newAsset.targetAllocation) || 0).toFixed(1)}%`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addAsset(newAsset);
      setShowAddAssetModal(false);
      setNewAsset({
        ticker: '',
        name: '',
        type: 'stock',
        quantity: 0,
        price: 0,
        targetAllocation: 0
      });
      setSelectedAssetData(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao adicionar ativo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssetAllocation = (assetId, targetAllocation, assetType) => {
    const assetsOfSameType = assetType === 'stock' ? stockAssets : reitAssets;
    const otherAssets = assetsOfSameType.filter(asset => asset.id !== assetId);
    
    // Atualizar estado local
    setLocalAssetAllocations(prev => ({
      ...prev,
      [assetId]: targetAllocation
    }));
    
    // Auto-ajuste para caso de apenas 2 ativos do mesmo tipo
    if (assetsOfSameType.length === 2) {
      const otherAsset = otherAssets[0];
      const remainingPercentage = 100 - targetAllocation;
      
      // Auto-ajustar o outro ativo no estado local
      setLocalAssetAllocations(prev => ({
        ...prev,
        [assetId]: targetAllocation,
        [otherAsset.id]: remainingPercentage
      }));
      
      setError('');
      setSuccess(`Percentuais ajustados automaticamente para somar 100%`);
      return;
    }
    
    // Para mais de 2 ativos, apenas atualizar estado local
    // A validação será feita apenas no botão 'Salvar Configurações'
    setError('');
    setSuccess('');
  };

  const handleRemoveAsset = async (assetId) => {
    if (window.confirm('Tem certeza que deseja remover este ativo?')) {
      try {
        await removeAsset(assetId);
      } catch (error) {
        setError(error.response?.data?.error || 'Erro ao remover ativo');
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stockAssets = currentPortfolio?.assets?.filter(asset => asset.type === 'stock') || [];
  const reitAssets = currentPortfolio?.assets?.filter(asset => asset.type === 'reit') || [];

  const calculateAllocationTotals = (assets) => {
    return assets.reduce((sum, asset) => {
      const localValue = localAssetAllocations[asset.id];
      const allocation = localValue !== undefined ? localValue : (parseFloat(asset.targetAllocation) || 0);
      return sum + allocation;
    }, 0);
  };

  const stocksAllocationTotal = calculateAllocationTotals(stockAssets);
  const reitsAllocationTotal = calculateAllocationTotals(reitAssets);

  if (!currentPortfolio) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">⚙️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Configurações da Carteira
        </h1>
        <p className="text-gray-600 mb-8">
          Você precisa ter uma carteira para acessar as configurações.
        </p>
        {!permissions.save && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-6 max-w-md mx-auto">
            <p className="text-sm">
              Usuários gratuitos podem criar uma carteira temporária para testar a funcionalidade.
            </p>
          </div>
        )}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Ir para Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Configure sua carteira: {currentPortfolio.name}
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
          {success}
        </div>
      )}

      {/* Portfolio Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Configurações da Carteira</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Portfolio Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Carteira
            </label>
            <input
              type="text"
              value={portfolioSettings.name}
              onChange={(e) => {
                setPortfolioSettings({...portfolioSettings, name: e.target.value});
                setError('');
                setSuccess('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome da carteira"
            />
          </div>

          {/* Distribution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distribuição Ações vs FIIs
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <span className="w-16 text-sm">Ações:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={portfolioSettings.stocksPercentage}
                  onChange={(e) => {
                    const stocks = parseFloat(e.target.value) || 0;
                    setPortfolioSettings({
                      ...portfolioSettings,
                      stocksPercentage: stocks,
                      reitsPercentage: 100 - stocks
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                />
                <span className="text-sm">%</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="w-16 text-sm">FIIs:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={portfolioSettings.reitsPercentage}
                  onChange={(e) => {
                    const reits = parseFloat(e.target.value) || 0;
                    setPortfolioSettings({
                      ...portfolioSettings,
                      reitsPercentage: reits,
                      stocksPercentage: 100 - reits
                    });
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePortfolioUpdate}
            disabled={loading}
            className={`px-6 py-2 rounded-md font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      {/* Assets Management */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Stocks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center">
              <span className="text-blue-500 mr-2">📈</span>
              Ações ({portfolioSettings.stocksPercentage}%)
            </h3>
            <div className={`text-sm font-medium ${
              Math.abs(stocksAllocationTotal - 100) < 0.01 ? 'text-green-500' : 
              stocksAllocationTotal > 100 ? 'text-red-500' : 'text-orange-500'
            }`}>
              Total: {stocksAllocationTotal.toFixed(1)}% 
              {Math.abs(stocksAllocationTotal - 100) < 0.01 ? '✓' : 
               stocksAllocationTotal > 100 ? '⚠️' : '⚠️'}
            </div>
          </div>
          
          {stockAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma ação na carteira</p>
              <button
                onClick={() => {
                  setNewAsset({...newAsset, type: 'stock'});
                  setShowAddAssetModal(true);
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Adicionar primeira ação
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stockAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{asset.ticker}</h4>
                      <p className="text-sm text-gray-600">{asset.name}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Quantidade:</span>
                      <span className="ml-1 font-medium">{asset.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço:</span>
                      <span className="ml-1 font-medium">{formatCurrency(asset.price)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor:</span>
                      <span className="ml-1 font-medium">
                        {formatCurrency(asset.quantity * asset.price)}
                      </span>
                    </div>
                    <div>
                      <label className="text-gray-600">Target %:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={localAssetAllocations[asset.id] !== undefined ? localAssetAllocations[asset.id] : (asset.targetAllocation || 0)}
                        onChange={(e) => handleUpdateAssetAllocation(asset.id, parseFloat(e.target.value) || 0, 'stock')}
                        className="ml-1 w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REITs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center">
              <span className="text-green-500 mr-2">🏢</span>
              FIIs ({portfolioSettings.reitsPercentage}%)
            </h3>
            <div className={`text-sm font-medium ${
              Math.abs(reitsAllocationTotal - 100) < 0.01 ? 'text-green-500' : 
              reitsAllocationTotal > 100 ? 'text-red-500' : 'text-orange-500'
            }`}>
              Total: {reitsAllocationTotal.toFixed(1)}% 
              {Math.abs(reitsAllocationTotal - 100) < 0.01 ? '✓' : 
               reitsAllocationTotal > 100 ? '⚠️' : '⚠️'}
            </div>
          </div>
          
          {reitAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum FII na carteira</p>
              <button
                onClick={() => {
                  setNewAsset({...newAsset, type: 'reit'});
                  setShowAddAssetModal(true);
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Adicionar primeiro FII
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reitAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{asset.ticker}</h4>
                      <p className="text-sm text-gray-600">{asset.name}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Quantidade:</span>
                      <span className="ml-1 font-medium">{asset.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço:</span>
                      <span className="ml-1 font-medium">{formatCurrency(asset.price)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor:</span>
                      <span className="ml-1 font-medium">
                        {formatCurrency(asset.quantity * asset.price)}
                      </span>
                    </div>
                    <div>
                      <label className="text-gray-600">Target %:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={localAssetAllocations[asset.id] !== undefined ? localAssetAllocations[asset.id] : (asset.targetAllocation || 0)}
                        onChange={(e) => handleUpdateAssetAllocation(asset.id, parseFloat(e.target.value) || 0, 'reit')}
                        className="ml-1 w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => setShowAddAssetModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Adicionar Ativo
        </button>
      </div>

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Adicionar Ativo</h3>
            
            <div className="space-y-4">
              {/* Asset Search Component */}
              <AssetSearchInput 
                onAssetSelected={handleAssetSelected}
                initialTicker={newAsset.ticker}
              />

              {/* Manual override fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome {selectedAssetData && <span className="text-green-600">✓ Auto</span>}
                  </label>
                  <input
                    type="text"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                    placeholder="Ex: Petrobras, CSHG Logística"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo {selectedAssetData && <span className="text-green-600">✓ Auto</span>}
                  </label>
                  <select
                    value={newAsset.type}
                    onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="stock">Ação</option>
                    <option value="reit">FII</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newAsset.quantity}
                    onChange={(e) => setNewAsset({...newAsset, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) {selectedAssetData && selectedAssetData.price > 0 && <span className="text-green-600">✓ Auto</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAsset.price}
                    onChange={(e) => setNewAsset({...newAsset, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Allocation (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newAsset.targetAllocation}
                  onChange={(e) => setNewAsset({...newAsset, targetAllocation: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="% desejado dentro do tipo (ações ou FIIs)"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAssetModal(false);
                  setNewAsset({
                    ticker: '',
                    name: '',
                    type: 'stock',
                    quantity: 0,
                    price: 0,
                    targetAllocation: 0
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAsset}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
