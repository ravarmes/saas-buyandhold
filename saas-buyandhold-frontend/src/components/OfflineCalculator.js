import React, { useState } from 'react';
import { deterministicOptimizer } from '../services/DeterministicOptimizer';

const OfflineCalculator = ({ portfolio, onShowUpgrade }) => {
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [suggestions, setSuggestions] = useState([]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateSuggestions = async () => {
    if (!portfolio?.assets || portfolio.assets.length === 0) {
      alert('Adicione ativos à sua carteira antes de calcular sugestões');
      return;
    }

    if (investmentAmount <= 0) {
      alert('Informe um valor válido para investimento');
      return;
    }

    try {
      // Preparar dados dos ativos
      const currentAssets = portfolio.assets.map(asset => ({
        ...asset,
        quantity: parseInt(asset.quantity) || 0,
        price: parseFloat(asset.price) || 0,
        targetAllocation: parseFloat(asset.targetAllocation) || 0
      }));

      // Preparar configurações do portfólio
      const settings = {
        stocksPercentage: parseFloat(portfolio.stocksPercentage) || 70,
        reitsPercentage: parseFloat(portfolio.reitsPercentage) || 30,
        assetAllocations: {}
      };

      // Mapear alocações dos ativos
      portfolio.assets.forEach(asset => {
        if (asset.targetAllocation > 0) {
          settings.assetAllocations[asset.ticker] = parseFloat(asset.targetAllocation);
        }
      });

      // Usar o DeterministicOptimizer
      const suggestions = await deterministicOptimizer.optimize(
        currentAssets,
        settings,
        investmentAmount
      );

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Erro ao calcular sugestões:', error);
      alert('Erro ao calcular sugestões de investimento');
    }
  };



  const totalSuggested = suggestions.reduce((sum, s) => sum + s.value, 0);
  const remainingValue = investmentAmount - totalSuggested;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Calculadora de Investimentos</h2>
        <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
          🆓 Modo Demo
        </div>
      </div>

      {/* Investment Amount */}
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
        className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors mb-6"
      >
        Gerar Sugestões
      </button>

      {/* Portfolio Info */}
      {portfolio && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">📊 Resumo da Carteira</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Valor Total:</span>
              <span className="font-medium ml-1">{formatCurrency(portfolio.totalValue || 0)}</span>
            </div>
            <div>
              <span className="text-blue-700">Ativos:</span>
              <span className="font-medium ml-1">{portfolio.assets?.length || 0}</span>
            </div>
            <div>
              <span className="text-blue-700">Meta Ações:</span>
              <span className="font-medium ml-1">{portfolio.stocksPercentage}%</span>
            </div>
            <div>
              <span className="text-blue-700">Meta FIIs:</span>
              <span className="font-medium ml-1">{portfolio.reitsPercentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4">Sugestões de Investimento</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativo</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Motivo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suggestions.map((suggestion, index) => (
                  <tr key={index}>
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
                      {suggestion.reason || suggestion.reasoning || 'Otimização automática'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">Total sugerido:</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSuggested)}</p>
                <p className={`text-sm ${remainingValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {remainingValue >= 0 
                    ? `Restante: ${formatCurrency(remainingValue)}` 
                    : `Excesso: ${formatCurrency(Math.abs(remainingValue))}`}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Faça login para executar investimentos
                </p>
                <button 
                  onClick={onShowUpgrade}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Criar Conta Grátis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {suggestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Configure sua carteira e clique em "Gerar Sugestões" para ver recomendações</p>
        </div>
      )}
    </div>
  );
};

export default OfflineCalculator;
