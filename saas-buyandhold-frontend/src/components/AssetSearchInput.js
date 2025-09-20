import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssetSearchInput = ({ onAssetSelected, initialTicker = '' }) => {
  const [ticker, setTicker] = useState(initialTicker);
  const [loading, setLoading] = useState(false);
  // Removidas variáveis não utilizadas: suggestions, showSuggestions, setShowSuggestions
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    if (ticker.length >= 3) {
      const timer = setTimeout(() => {
        searchAsset(ticker);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSelectedAsset(null);
    }
  }, [ticker]);

  const searchAsset = async (searchTicker) => {
    if (!searchTicker || searchTicker.length < 3) return;

    setLoading(true);
    try {
      const response = await axios.get(`/asset-data/search/${searchTicker.toUpperCase()}`);
      
      if (response.data.success) {
        const assetData = response.data.data;
        setSelectedAsset(assetData);
        
        if (onAssetSelected) {
          onAssetSelected(assetData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar ativo:', error);
      setSelectedAsset(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTickerChange = (e) => {
    const value = e.target.value.toUpperCase();
    setTicker(value);
    
    if (value.length < 3) {
      setSelectedAsset(null);
      if (onAssetSelected) {
        onAssetSelected(null);
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ticker do Ativo
        </label>
        <div className="relative">
          <input
            type="text"
            value={ticker}
            onChange={handleTickerChange}
            placeholder="Ex: PETR4, HGLG11"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            maxLength={10}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          )}
        </div>
        
        {ticker.length > 0 && ticker.length < 3 && (
          <p className="text-xs text-gray-500 mt-1">
            Digite pelo menos 3 caracteres para buscar
          </p>
        )}
      </div>

      {/* Asset Information Card */}
      {selectedAsset && (
        <div className={`border rounded-lg p-4 ${
          selectedAsset.price > 0 
            ? 'border-green-200 bg-green-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-900">{selectedAsset.ticker}</h3>
              <p className="text-sm text-gray-600">{selectedAsset.name}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                selectedAsset.type === 'stock'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {selectedAsset.type === 'stock' ? 'Ação' : 'FII'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Preço:</span>
              <span className="ml-1 font-medium">
                {selectedAsset.price > 0 
                  ? formatCurrency(selectedAsset.price)
                  : 'Não encontrado'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fonte:</span>
              <span className="ml-1 font-medium text-blue-600">
                {selectedAsset.source}
              </span>
            </div>
          </div>

          {selectedAsset.sector && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Setor:</span>
              <span className="ml-1">{selectedAsset.sector}</span>
            </div>
          )}

          {selectedAsset.note && (
            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
              📝 {selectedAsset.note}
            </div>
          )}

          {selectedAsset.price === 0 && (
            <div className="mt-2 text-xs text-yellow-700">
              ⚠️ Preço não encontrado automaticamente. Você precisará inserir manualmente.
            </div>
          )}
        </div>
      )}

      {/* Popular Assets Suggestions */}
      {!selectedAsset && ticker.length === 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            💡 Ativos Populares:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { ticker: 'PETR4', name: 'Petrobras' },
              { ticker: 'VALE3', name: 'Vale' },
              { ticker: 'ITUB4', name: 'Itaú' },
              { ticker: 'HGLG11', name: 'CSHG Logística' },
              { ticker: 'KNRI11', name: 'Kinea Renda' },
              { ticker: 'MXRF11', name: 'Maxi Renda' }
            ].map((asset) => (
              <button
                key={asset.ticker}
                onClick={() => setTicker(asset.ticker)}
                className="text-left p-2 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-blue-600">{asset.ticker}</div>
                <div className="text-gray-600">{asset.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetSearchInput;
