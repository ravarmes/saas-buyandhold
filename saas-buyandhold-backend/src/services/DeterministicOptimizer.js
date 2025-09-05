/**
 * DeterministicOptimizer - Algoritmo determinístico para otimização de carteiras de investimento
 * Implementa estratégias de alocação baseadas em déficit e target allocation
 */
class DeterministicOptimizer {
  /**
   * Valida os dados de entrada
   */
  validateInputs(assets, settings, investmentAmount) {
    try {
      if (!Array.isArray(assets) || assets.length === 0) {
        console.error('Lista de ativos é obrigatória e não pode estar vazia');
        return false;
      }

      if (!settings || typeof settings !== 'object') {
        console.error('Configurações do portfólio são obrigatórias');
        return false;
      }

      if (!investmentAmount || investmentAmount <= 0) {
        console.error('Valor de investimento deve ser maior que zero');
        return false;
      }

      // Validar se todos os ativos têm os campos necessários
      for (const asset of assets) {
        if (!asset.ticker || !asset.name || !asset.type) {
          console.error(`Ativo inválido: ${JSON.stringify(asset)}`);
          return false;
        }
        if (typeof asset.quantity !== 'number' || asset.quantity < 0 || isNaN(asset.quantity)) {
          console.error(`Quantidade inválida para ${asset.ticker}: ${asset.quantity}`);
          return false;
        }
        if (typeof asset.price !== 'number' || asset.price <= 0 || isNaN(asset.price)) {
          console.error(`Preço inválido para ${asset.ticker}: ${asset.price}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro na validação de inputs:', error);
      return false;
    }
  }

  /**
   * Calcula o valor total da carteira
   */
  calculateTotalValue(assets) {
    return assets.reduce((total, asset) => {
      return total + (asset.quantity * asset.price);
    }, 0);
  }

  /**
   * Calcula o valor total por categoria (stocks/reits)
   */
  calculateCategoryValues(assets) {
    const stocksValue = assets
      .filter(asset => asset.type === 'stock')
      .reduce((total, asset) => total + (asset.quantity * asset.price), 0);
    
    const reitsValue = assets
      .filter(asset => asset.type === 'reit')
      .reduce((total, asset) => total + (asset.quantity * asset.price), 0);
    
    const totalValue = stocksValue + reitsValue;
    
    return {
      stocks: stocksValue,
      reits: reitsValue,
      total: totalValue,
      stocksPercentage: totalValue > 0 ? (stocksValue / totalValue) * 100 : 0,
      reitsPercentage: totalValue > 0 ? (reitsValue / totalValue) * 100 : 0
    };
  }

  /**
   * Calcula quantas unidades podem ser compradas com o valor disponível
   */
  calculateMaxUnits(price, availableValue) {
    if (price <= 0 || availableValue <= 0) return 0;
    return Math.floor(availableValue / price);
  }

  /**
   * Formata uma sugestão de investimento
   */
  formatSuggestion(asset, quantity, reason) {
    // Validar inputs para evitar NaN
    const validQuantity = isNaN(quantity) ? 0 : quantity;
    const validPrice = isNaN(asset.price) ? 0 : asset.price;
    const value = validQuantity * validPrice;
    
    // Log para debug se houver valores inválidos
    if (isNaN(quantity) || isNaN(asset.price)) {
      console.error('formatSuggestion: Invalid values detected', {
        asset: asset.ticker,
        quantity,
        price: asset.price,
        calculatedValue: value
      });
    }
    
    return {
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      price: validPrice,
      quantityToBuy: validQuantity,
      value: isNaN(value) ? 0 : value,
      reason: reason
    };
  }

  /**
   * Estratégia básica: distribuição igual quando não há alocações específicas
   */
  basicStrategy(assets, investmentAmount) {
    const suggestions = [];
    const availablePerAsset = investmentAmount / assets.length;
    
    for (const asset of assets) {
      const maxUnits = this.calculateMaxUnits(asset.price, availablePerAsset);
      if (maxUnits > 0) {
        suggestions.push(
          this.formatSuggestion(
            asset, 
            maxUnits, 
            'Distribuição igual entre ativos'
          )
        );
      }
    }
    
    return suggestions;
  }

  /**
   * Estratégia avançada: baseada em déficit e target allocation
   */
  advancedStrategy(assets, settings, investmentAmount) {
    const suggestions = [];
    const currentValues = this.calculateCategoryValues(assets);
    const futureTotal = currentValues.total + investmentAmount;
    
    // Calcular déficits por categoria
    const targetStocksValue = (settings.stocksPercentage / 100) * futureTotal;
    const targetReitsValue = (settings.reitsPercentage / 100) * futureTotal;
    
    const stocksDeficit = Math.max(0, targetStocksValue - currentValues.stocks);
    const reitsDeficit = Math.max(0, targetReitsValue - currentValues.reits);
    
    // Distribuir investimento baseado nos déficits
    let stocksAllocation = 0;
    let reitsAllocation = 0;
    
    const totalDeficit = stocksDeficit + reitsDeficit;
    
    if (totalDeficit > 0) {
      stocksAllocation = (stocksDeficit / totalDeficit) * investmentAmount;
      reitsAllocation = (reitsDeficit / totalDeficit) * investmentAmount;
    } else {
      // Se não há déficit, distribuir proporcionalmente
      stocksAllocation = (settings.stocksPercentage / 100) * investmentAmount;
      reitsAllocation = (settings.reitsPercentage / 100) * investmentAmount;
    }
    
    // Processar ações
    if (stocksAllocation > 0) {
      const stockAssets = assets.filter(asset => asset.type === 'stock');
      const stockSuggestions = this.allocateToAssets(
        stockAssets, 
        settings.assetAllocations, 
        stocksAllocation,
        'Rebalanceamento de ações'
      );
      suggestions.push(...stockSuggestions);
    }
    
    // Processar REITs
    if (reitsAllocation > 0) {
      const reitAssets = assets.filter(asset => asset.type === 'reit');
      const reitSuggestions = this.allocateToAssets(
        reitAssets, 
        settings.assetAllocations, 
        reitsAllocation,
        'Rebalanceamento de FIIs'
      );
      suggestions.push(...reitSuggestions);
    }
    
    return suggestions;
  }

  /**
   * Aloca valor disponível entre ativos de uma categoria
   */
  allocateToAssets(assets, assetAllocations, availableValue, baseReason) {
    const suggestions = [];
    let remainingValue = availableValue;
    
    // Calcular déficits por ativo
    const assetsWithDeficit = assets.map(asset => {
      const currentValue = asset.quantity * asset.price;
      const targetAllocation = assetAllocations[asset.ticker] || 0;
      
      let deficit = 0;
      if (targetAllocation > 0) {
        const totalCategoryValue = assets.reduce((sum, a) => sum + (a.quantity * a.price), 0) + availableValue;
        const idealValue = (targetAllocation / 100) * totalCategoryValue;
        deficit = Math.max(0, idealValue - currentValue);
      }
      
      return {
        ...asset,
        deficit,
        targetAllocation,
        priority: targetAllocation > 0 ? deficit : 0
      };
    });
    
    // Ordenar por prioridade (maior déficit primeiro)
    assetsWithDeficit.sort((a, b) => b.priority - a.priority);
    
    // Alocar valor começando pelos ativos com maior déficit
    for (const asset of assetsWithDeficit) {
      if (remainingValue <= 0) break;
      
      const maxUnits = this.calculateMaxUnits(asset.price, remainingValue);
      if (maxUnits > 0) {
        const investmentValue = maxUnits * asset.price;
        
        let reason = baseReason;
        if (asset.targetAllocation > 0) {
          reason = `Target: ${asset.targetAllocation}% - Déficit: R$ ${asset.deficit.toFixed(2)}`;
        }
        
        suggestions.push(this.formatSuggestion(asset, maxUnits, reason));
        remainingValue -= investmentValue;
      }
    }
    
    return suggestions;
  }

  /**
   * Função principal de otimização
   */
  optimize(assets, settings, investmentAmount) {
    // Validar entradas
    if (!this.validateInputs(assets, settings, investmentAmount)) {
      console.error('DeterministicOptimizer: Invalid inputs', { assets, settings, investmentAmount });
      return [];
    }
    
    // Validar se investmentAmount é um número válido
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      console.error('DeterministicOptimizer: Invalid investment amount', investmentAmount);
      return [];
    }
    
    // Verificar se há alocações específicas definidas
    const hasSpecificAllocations = settings.assetAllocations && 
      Object.keys(settings.assetAllocations).length > 0 &&
      Object.values(settings.assetAllocations).some(allocation => allocation > 0);
    
    let suggestions;
    
    if (hasSpecificAllocations) {
      // Usar estratégia avançada baseada em déficit
      suggestions = this.advancedStrategy(assets, settings, investmentAmount);
    } else {
      // Usar estratégia básica de distribuição igual
      suggestions = this.basicStrategy(assets, investmentAmount);
    }
    
    // Ordenar sugestões por valor (maior primeiro)
    suggestions.sort((a, b) => b.value - a.value);
    
    return suggestions;
  }
}

module.exports = DeterministicOptimizer;