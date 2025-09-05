import React, { useState } from 'react';
import AssetSearchInput from './AssetSearchInput';

const TempPortfolioManager = ({ portfolio, onUpdatePortfolio, onAddAsset, onRemoveAsset, onUpdateAsset }) => {
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    ticker: '',
    name: '',
    type: 'stock',
    quantity: 0,
    price: 0,
    targetAllocation: 0
  });
  const [selectedAssetData, setSelectedAssetData] = useState(null);

  const handleAddAsset = () => {
    if (!newAsset.ticker || !newAsset.name || newAsset.quantity <= 0 || newAsset.price <= 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar se a adição do novo ativo não ultrapassará 100%
    const currentAssets = portfolio?.assets || [];
    const assetsOfSameType = currentAssets.filter(asset => asset.type === newAsset.type);
    const currentTotal = assetsOfSameType.reduce((sum, asset) => sum + (parseFloat(asset.targetAllocation) || 0), 0);
    const newTotal = currentTotal + (parseFloat(newAsset.targetAllocation) || 0);
    
    if (newTotal > 100) {
      const assetTypeName = newAsset.type === 'stock' ? 'Ações' : 'FIIs';
      alert(`A alocação total de ${assetTypeName} não pode ultrapassar 100%. Atual: ${currentTotal.toFixed(1)}%, Tentando adicionar: ${(parseFloat(newAsset.targetAllocation) || 0).toFixed(1)}%`);
      return;
    }

    onAddAsset({
      ...newAsset,
      ticker: newAsset.ticker.toUpperCase()
    });

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
  };

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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stockAssets = portfolio?.assets?.filter(asset => asset.type === 'stock') || [];
  const reitAssets = portfolio?.assets?.filter(asset => asset.type === 'reit') || [];

  const calculateAllocationTotals = (assets) => {
    return assets.reduce((sum, asset) => sum + (parseFloat(asset.targetAllocation) || 0), 0);
  };

  const stocksAllocationTotal = calculateAllocationTotals(stockAssets);
  const reitsAllocationTotal = calculateAllocationTotals(reitAssets);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Sua Carteira de Teste</h2>
        <div className="text-sm text-gray-600">
          Valor Total: {formatCurrency(portfolio?.totalValue || 0)}
        </div>
      </div>

      {/* Portfolio Settings */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-3">Distribuição Desejada</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ações (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={portfolio?.stocksPercentage || 70}
              onChange={(e) => {
                const stocks = parseFloat(e.target.value) || 0;
                onUpdatePortfolio({
                  stocksPercentage: stocks,
                  reitsPercentage: 100 - stocks
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FIIs (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={portfolio?.reitsPercentage || 30}
              onChange={(e) => {
                const reits = parseFloat(e.target.value) || 0;
                onUpdatePortfolio({
                  reitsPercentage: reits,
                  stocksPercentage: 100 - reits
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Assets Lists */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Stocks */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium flex items-center">
              <span className="text-blue-500 mr-2">📈</span>
              Ações ({portfolio?.stocksPercentage || 70}%)
            </h3>
            <div className={`text-sm ${stocksAllocationTotal > 100 ? 'text-red-500' : 'text-green-500'}`}>
              {stocksAllocationTotal.toFixed(1)}%
            </div>
          </div>
          
          {stockAssets.length === 0 ? (
            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm">Nenhuma ação adicionada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{asset.ticker}</h4>
                      <p className="text-xs text-gray-600">{asset.name}</p>
                    </div>
                    <button
                      onClick={() => onRemoveAsset(asset.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Qtd:</span> {asset.quantity}
                    </div>
                    <div>
                      <span className="text-gray-600">Preço:</span> {formatCurrency(asset.price)}
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-600 mr-1">Target %:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={asset.targetAllocation || 0}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          const otherStockAssets = stockAssets.filter(a => a.id !== asset.id);
                          const otherStocksTotal = otherStockAssets.reduce((sum, a) => sum + (parseFloat(a.targetAllocation) || 0), 0);
                          
                          if (otherStocksTotal + newValue > 100) {
                            alert(`A alocação total de Ações não pode ultrapassar 100%. Outras ações: ${otherStocksTotal.toFixed(1)}%`);
                            return;
                          }
                          
                          onUpdateAsset(asset.id, { targetAllocation: newValue });
                        }}
                        className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REITs */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium flex items-center">
              <span className="text-green-500 mr-2">🏢</span>
              FIIs ({portfolio?.reitsPercentage || 30}%)
            </h3>
            <div className={`text-sm ${reitsAllocationTotal > 100 ? 'text-red-500' : 'text-green-500'}`}>
              {reitsAllocationTotal.toFixed(1)}%
            </div>
          </div>
          
          {reitAssets.length === 0 ? (
            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm">Nenhum FII adicionado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reitAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{asset.ticker}</h4>
                      <p className="text-xs text-gray-600">{asset.name}</p>
                    </div>
                    <button
                      onClick={() => onRemoveAsset(asset.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Qtd:</span> {asset.quantity}
                    </div>
                    <div>
                      <span className="text-gray-600">Preço:</span> {formatCurrency(asset.price)}
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-600 mr-1">Target %:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={asset.targetAllocation || 0}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          const otherReitAssets = reitAssets.filter(a => a.id !== asset.id);
                          const otherReitsTotal = otherReitAssets.reduce((sum, a) => sum + (parseFloat(a.targetAllocation) || 0), 0);
                          
                          if (otherReitsTotal + newValue > 100) {
                            alert(`A alocação total de FIIs não pode ultrapassar 100%. Outros FIIs: ${otherReitsTotal.toFixed(1)}%`);
                            return;
                          }
                          
                          onUpdateAsset(asset.id, { targetAllocation: newValue });
                        }}
                        className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-xs"
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
      <div className="text-center">
        <button
          onClick={() => setShowAddAssetModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                    Preço (R$) {selectedAssetData?.price > 0 && <span className="text-green-600">✓ Auto</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAsset.price}
                    onChange={(e) => setNewAsset({...newAsset, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={selectedAssetData?.price > 0 ? `Sugerido: R$ ${selectedAssetData.price.toFixed(2)}` : '0.00'}
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
                  placeholder="% desejado dentro do tipo"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAssetModal(false);
                  setSelectedAssetData(null);
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TempPortfolioManager;
