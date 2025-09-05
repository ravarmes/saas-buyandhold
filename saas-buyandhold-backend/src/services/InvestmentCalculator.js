/**
 * Serviço de Cálculo de Investimentos
 * Lógica principal para sugestões de rebalanceamento de carteira
 */

class InvestmentCalculator {
  
  /**
   * Calcula o valor total da carteira
   */
  calculateTotalValue(assets) {
    return assets.reduce((total, asset) => total + (asset.price * asset.quantity), 0);
  }

  /**
   * Calcula a distribuição entre ações e FIIs
   */
  calculateDistribution(assets) {
    const totalValue = this.calculateTotalValue(assets);
    if (totalValue === 0) return { stocks: 0, reits: 0 };
    
    const stocksValue = assets
      .filter(asset => asset.type === 'stock')
      .reduce((sum, asset) => sum + (asset.price * asset.quantity), 0);
      
    const reitsValue = assets
      .filter(asset => asset.type === 'reit')
      .reduce((sum, asset) => sum + (asset.price * asset.quantity), 0);
      
    return {
      stocks: (stocksValue / totalValue) * 100,
      reits: (reitsValue / totalValue) * 100
    };
  }

  /**
   * Calcula a porcentagem de cada ativo na carteira
   */
  calculateAssetPercentages(assets) {
    const totalValue = this.calculateTotalValue(assets);
    if (totalValue === 0) return assets.map(asset => ({...asset, percentage: 0}));
    
    return assets.map(asset => ({
      ...asset,
      percentage: ((asset.price * asset.quantity) / totalValue) * 100
    }));
  }

  /**
   * Gera sugestão de compra com base nas configurações e valor disponível
   */
  generatePurchaseSuggestion(currentAssets, portfolioSettings, availableValue) {
    if (!portfolioSettings || !availableValue || availableValue <= 0) {
      return {
        suggestions: [],
        summary: {
          totalAllocated: 0,
          remainingValue: availableValue,
          stocksAllocation: 0,
          reitsAllocation: 0
        }
      };
    }
    
    const { stocksPercentage, reitsPercentage, assetAllocations } = portfolioSettings;
    
    // Calcular distribuição atual
    const currentDistribution = this.calculateDistribution(currentAssets);
    
    // Calcular déficit em cada categoria
    const stocksDeficit = stocksPercentage - currentDistribution.stocks;
    const reitsDeficit = reitsPercentage - currentDistribution.reits;
    
    // Distribuir o valor disponível baseado nos déficits
    let stocksAllocation = 0;
    let reitsAllocation = 0;
    
    if (stocksDeficit > 0 && reitsDeficit > 0) {
      // Ambos estão abaixo do ideal, distribuir proporcionalmente ao déficit
      const totalDeficit = stocksDeficit + reitsDeficit;
      stocksAllocation = (stocksDeficit / totalDeficit) * availableValue;
      reitsAllocation = (reitsDeficit / totalDeficit) * availableValue;
    } else if (stocksDeficit > 0) {
      // Apenas ações estão abaixo do ideal
      stocksAllocation = availableValue;
    } else if (reitsDeficit > 0) {
      // Apenas FIIs estão abaixo do ideal
      reitsAllocation = availableValue;
    } else {
      // Ambos estão no percentual ideal ou acima, distribuir proporcionalmente
      stocksAllocation = (stocksPercentage / 100) * availableValue;
      reitsAllocation = (reitsPercentage / 100) * availableValue;
    }
    
    // Gerar sugestões para ações
    const stockSuggestions = this.generateSuggestionsByType(
      currentAssets.filter(a => a.type === 'stock'),
      assetAllocations,
      stocksAllocation,
      'stock',
      stocksPercentage
    );
    
    // Gerar sugestões para FIIs
    const reitSuggestions = this.generateSuggestionsByType(
      currentAssets.filter(a => a.type === 'reit'),
      assetAllocations,
      reitsAllocation,
      'reit',
      reitsPercentage
    );
    
    // Combinar sugestões
    const allSuggestions = [...stockSuggestions, ...reitSuggestions];
    
    // Calcular resumo
    const totalAllocated = allSuggestions.reduce((sum, s) => sum + s.value, 0);
    const remainingValue = availableValue - totalAllocated;
    
    // Ordenar por déficit (maior déficit primeiro)
    allSuggestions.sort((a, b) => (b.deficitPercentage || 0) - (a.deficitPercentage || 0));
    
    return {
      suggestions: allSuggestions,
      summary: {
        totalAllocated,
        remainingValue,
        stocksAllocation,
        reitsAllocation,
        totalInvestment: availableValue
      }
    };
  }

  /**
   * Função auxiliar para gerar sugestões por tipo de ativo
   */
  generateSuggestionsByType(currentAssets, idealAllocations, availableValue, type, typePercentage) {
    const suggestions = [];
    let remainingValue = availableValue;
    
    if (remainingValue <= 0 || currentAssets.length === 0) {
      return suggestions;
    }
    
    // Calcular valor total atual para esse tipo de ativo
    const currentTotalValue = currentAssets.reduce((sum, asset) => sum + (asset.price * asset.quantity), 0);
    
    // Para cada ativo desse tipo, calcular déficit baseado na alocação target
    const assetsWithDeficit = currentAssets.map(asset => {
      const ticker = asset.ticker;
      const currentValue = asset.price * asset.quantity;
      const targetAllocation = idealAllocations[ticker] || 0;
      
      // Calcular valor ideal baseado no target allocation dentro do tipo
      const currentTypeValue = currentTotalValue + availableValue;
      const idealValueInType = (targetAllocation / 100) * currentTypeValue;
      const deficit = Math.max(0, idealValueInType - currentValue);
      
      return {
        ...asset,
        deficit,
        deficitPercentage: currentValue > 0 ? (deficit / currentValue) * 100 : (targetAllocation > 0 ? 100 : 0),
        idealValue: idealValueInType,
        targetAllocation
      };
    });
    
    // Filtrar apenas ativos com target allocation > 0
    const assetsWithTargets = assetsWithDeficit.filter(asset => asset.targetAllocation > 0);
    
    if (assetsWithTargets.length === 0) {
      // Se nenhum ativo tem target allocation, distribuir igualmente
      const assetsToUse = assetsWithDeficit.length > 0 ? assetsWithDeficit : currentAssets;
      const valuePerAsset = availableValue / assetsToUse.length;
      
      assetsToUse.forEach(asset => {
        const maxUnits = Math.floor(valuePerAsset / asset.price);
        if (maxUnits > 0) {
          const investmentValue = maxUnits * asset.price;
          suggestions.push({
            ticker: asset.ticker,
            name: asset.name,
            price: asset.price,
            quantityToBuy: maxUnits,
            value: investmentValue,
            type: asset.type,
            deficitPercentage: 0,
            reasoning: `Distribuição igual (sem target definido)`
          });
          remainingValue -= investmentValue;
        }
      });
      
      return suggestions;
    }
    
    // Ordenar por maior déficit
    const sortedAssets = [...assetsWithTargets].sort((a, b) => b.deficit - a.deficit);
    
    // Alocar o valor disponível começando pelos ativos com maior déficit
    for (const asset of sortedAssets) {
      if (remainingValue <= 0) break;
      
      // Calcular quanto podemos investir neste ativo baseado no déficit
      const maxInvestmentForDeficit = Math.min(asset.deficit, remainingValue);
      const maxUnits = Math.floor(maxInvestmentForDeficit / asset.price);
      
      if (maxUnits > 0) {
        const investmentValue = maxUnits * asset.price;
        
        suggestions.push({
          ticker: asset.ticker,
          name: asset.name,
          price: asset.price,
          quantityToBuy: maxUnits,
          value: investmentValue,
          type: asset.type,
          deficitPercentage: asset.deficitPercentage,
          reasoning: `Target: ${asset.targetAllocation}% - Déficit: R$ ${asset.deficit.toFixed(2)}`
        });
        
        remainingValue -= investmentValue;
      }
    }
    
    return suggestions;
  }

  /**
   * Valida se a sugestão de investimento está dentro dos limites
   */
  validateInvestmentSuggestion(suggestions, availableValue, tolerance = 0.01) {
    const totalValue = suggestions.reduce((sum, s) => sum + s.value, 0);
    const isValid = totalValue <= availableValue * (1 + tolerance);
    
    return {
      isValid,
      totalValue,
      availableValue,
      excess: Math.max(0, totalValue - availableValue),
      remaining: Math.max(0, availableValue - totalValue)
    };
  }
}

module.exports = InvestmentCalculator;