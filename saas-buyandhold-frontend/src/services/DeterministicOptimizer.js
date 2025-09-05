/**
 * Otimizador Determinístico (Algoritmo Guloso)
 * Implementa a estratégia de rebalanceamento por déficit
 * Baseado no DeterministicOptimizer.js da raiz do projeto
 */
export class DeterministicOptimizer {
  constructor(config = {}) {
    this.config = config;
    this.strategyName = 'Deterministic (Greedy Deficit-Based)';
    this.debug = config.debug || false;
  }

  /**
   * Log de debug
   */
  log(message) {
    if (this.debug) {
      console.log(`[${this.strategyName}] ${message}`);
    }
  }

  /**
   * Valida entrada dos dados
   */
  validateInput(currentAssets, settings, availableValue) {
    if (!currentAssets || !Array.isArray(currentAssets)) {
      throw new Error('currentAssets deve ser um array');
    }
    if (!settings || typeof settings !== 'object') {
      throw new Error('settings deve ser um objeto');
    }
    if (!availableValue || availableValue <= 0) {
      throw new Error('availableValue deve ser maior que zero');
    }
  }

  /**
   * Calcula valor total dos ativos
   */
  calculateTotalValue(assets) {
    return assets.reduce((sum, asset) => {
      return sum + (parseFloat(asset.price) * parseInt(asset.quantity));
    }, 0);
  }

  /**
   * Calcula valores por categoria
   */
  calculateCategoryValues(assets) {
    const stocksValue = assets
      .filter(asset => asset.type === 'stock')
      .reduce((sum, asset) => sum + (parseFloat(asset.price) * parseInt(asset.quantity)), 0);
      
    const reitsValue = assets
      .filter(asset => asset.type === 'reit')
      .reduce((sum, asset) => sum + (parseFloat(asset.price) * parseInt(asset.quantity)), 0);
    
    return { stocksValue, reitsValue };
  }

  /**
   * Calcula máximo de unidades que podem ser compradas
   */
  calculateMaxUnits(availableValue, price) {
    return Math.floor(availableValue / price);
  }

  /**
   * Formata sugestão de investimento
   */
  formatSuggestion(asset, units, reason, deficitPercentage = 0) {
    const investmentValue = units * parseFloat(asset.price);
    
    return {
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      price: parseFloat(asset.price),
      quantityToBuy: units,
      value: investmentValue,
      percentage: 0, // Será calculado posteriormente
      reason: reason,
      deficitPercentage: deficitPercentage,
      isCategory: false
    };
  }

  /**
   * Executa otimização determinística baseada em déficit
   */
  async optimize(currentAssets, settings, availableValue) {
    this.validateInput(currentAssets, settings, availableValue);
    
    this.log(`Iniciando otimização determinística com R$ ${availableValue}`);
    
    const { assetAllocations } = settings;
    
    // Verificar se há alocações específicas configuradas
    const hasSpecificAllocations = assetAllocations && 
      Object.keys(assetAllocations).some(ticker => 
        assetAllocations[ticker] > 0 && currentAssets.find(asset => asset.ticker === ticker)
      );
    
    if (!hasSpecificAllocations) {
      return this.generateBasicSuggestion(currentAssets, settings, availableValue);
    }
    
    return this.generateAdvancedSuggestion(currentAssets, settings, availableValue);
  }

  /**
   * Sugestão básica quando não há alocações específicas
   */
  generateBasicSuggestion(currentAssets, settings, availableValue) {
    const { stocksPercentage, reitsPercentage } = settings;
    const totalCurrentValue = this.calculateTotalValue(currentAssets);
    const newTotalValue = totalCurrentValue + availableValue;
    
    // Calcular distribuição atual
    const currentDist = this.calculateCurrentDistribution(currentAssets);
    
    // Valor ideal após investimento
    const idealStocksValue = newTotalValue * (stocksPercentage / 100);
    const idealReitsValue = newTotalValue * (reitsPercentage / 100);
    
    // Valor atual
    const currentStocksValue = totalCurrentValue * (currentDist.stocks / 100);
    const currentReitsValue = totalCurrentValue * (currentDist.reits / 100);
    
    // Déficit
    const stocksDeficit = Math.max(0, idealStocksValue - currentStocksValue);
    const reitsDeficit = Math.max(0, idealReitsValue - currentReitsValue);
    
    const suggestions = [];
    
    // Distribuir investimento proporcionalmente aos déficits
    if (stocksDeficit > 0) {
      const stocksAmount = Math.min(availableValue, stocksDeficit);
      suggestions.push({
        type: 'stock',
        category: 'Ações',
        amount: stocksAmount,
        percentage: (stocksAmount / availableValue) * 100,
        reason: `Para atingir ${stocksPercentage}% em ações`,
        isCategory: true
      });
    }
    
    if (reitsDeficit > 0) {
      const reitsAmount = Math.min(availableValue - (suggestions[0]?.amount || 0), reitsDeficit);
      if (reitsAmount > 0) {
        suggestions.push({
          type: 'reit',
          category: 'FIIs',
          amount: reitsAmount,
          percentage: (reitsAmount / availableValue) * 100,
          reason: `Para atingir ${reitsPercentage}% em FIIs`,
          isCategory: true
        });
      }
    }
    
    this.log(`Geradas ${suggestions.length} sugestões básicas`);
    return suggestions;
  }

  /**
   * Sugestão avançada com alocações específicas
   */
  generateAdvancedSuggestion(currentAssets, settings, availableValue) {
    const { stocksPercentage, reitsPercentage, assetAllocations } = settings;
    const totalCurrentValue = this.calculateTotalValue(currentAssets);
    const totalAfterInvestment = totalCurrentValue + availableValue;
    
    // Valor ideal para ações e FIIs após o investimento
    const idealStocksValue = (stocksPercentage / 100) * totalAfterInvestment;
    const idealReitsValue = (reitsPercentage / 100) * totalAfterInvestment;
    
    // Valor atual em ações e FIIs
    const currentValues = this.calculateCategoryValues(currentAssets);
    
    // Calcular déficit por categoria
    const stocksDeficit = Math.max(0, idealStocksValue - currentValues.stocksValue);
    const reitsDeficit = Math.max(0, idealReitsValue - currentValues.reitsValue);
    
    // Distribuir valor entre categorias
    let stocksAllocation = 0;
    let reitsAllocation = 0;
    
    const totalCategoryDeficit = stocksDeficit + reitsDeficit;
    
    if (totalCategoryDeficit > 0) {
      stocksAllocation = stocksDeficit > 0 ? 
        Math.min(availableValue, (stocksDeficit / totalCategoryDeficit) * availableValue) : 0;
      reitsAllocation = availableValue - stocksAllocation;
    } else {
      // Se já está balanceado por categoria, manter proporções
      stocksAllocation = availableValue * (stocksPercentage / 100);
      reitsAllocation = availableValue * (reitsPercentage / 100);
    }
    
    // Gerar sugestões por tipo
    const stockSuggestions = this.generateSuggestionsByType(
      currentAssets.filter(a => a.type === 'stock'),
      assetAllocations,
      stocksAllocation,
      'stock',
      idealStocksValue
    );
    
    const reitSuggestions = this.generateSuggestionsByType(
      currentAssets.filter(a => a.type === 'reit'),
      assetAllocations,
      reitsAllocation,
      'reit',
      idealReitsValue
    );
    
    const allSuggestions = [...stockSuggestions, ...reitSuggestions];
    
    // Ordenar por prioridade (maior déficit primeiro)
    allSuggestions.sort((a, b) => b.deficitPercentage - a.deficitPercentage);
    
    this.log(`Geradas ${allSuggestions.length} sugestões avançadas`);
    return allSuggestions;
  }

  /**
   * Gera sugestões específicas por tipo de ativo
   */
  generateSuggestionsByType(currentAssets, idealAllocations, availableValue, type, idealTotalValue) {
    const suggestions = [];
    let remainingValue = availableValue;
    
    if (availableValue <= 0 || currentAssets.length === 0) return suggestions;
    
    // Calcular déficit para cada ativo
    const assetsWithDeficit = currentAssets.map(asset => {
      const ticker = asset.ticker;
      const currentValue = parseFloat(asset.price) * parseInt(asset.quantity);
      const idealPercentage = idealAllocations[ticker] || 0;
      
      // Se não há percentual configurado, usar distribuição igualitária
      const effectivePercentage = idealPercentage > 0 ? idealPercentage : (100 / currentAssets.length);
      const idealValue = (effectivePercentage / 100) * idealTotalValue;
      const deficit = Math.max(0, idealValue - currentValue);
      
      return {
        ...asset,
        deficit,
        idealValue,
        effectivePercentage,
        deficitPercentage: currentValue > 0 ? (deficit / currentValue) * 100 : 100
      };
    });
    
    // Ordenar por déficit (greedy)
    const assetsToInvest = assetsWithDeficit
      .filter(asset => asset.effectivePercentage > 0)
      .sort((a, b) => b.deficit - a.deficit);
    
    // Investir nos ativos com maior déficit primeiro
    for (const asset of assetsToInvest) {
      if (remainingValue <= 0) break;
      
      let targetInvestment;
      
      if (asset.deficit > 0) {
        targetInvestment = Math.min(asset.deficit, remainingValue);
      } else {
        // Dividir restante entre ativos sem déficit
        const assetsRemaining = assetsToInvest.filter(a => a.deficit === 0).length;
        targetInvestment = assetsRemaining > 0 ? remainingValue / assetsRemaining : 0;
      }
      
      if (targetInvestment <= 0) continue;
      
      const maxUnits = this.calculateMaxUnits(targetInvestment, parseFloat(asset.price));
      if (maxUnits <= 0) continue;
      
      const investmentValue = maxUnits * parseFloat(asset.price);
      
      if (investmentValue > 0) {
        const suggestion = this.formatSuggestion(
          asset,
          maxUnits,
          asset.deficit > 0 
            ? `Déficit de R$ ${asset.deficit.toFixed(2)} na alocação ideal`
            : `Diversificação dentro de ${type === 'stock' ? 'ações' : 'FIIs'}`,
          asset.deficitPercentage
        );
        
        // Adicionar propriedades específicas do algoritmo determinístico
        suggestion.currentValue = parseFloat(asset.price) * parseInt(asset.quantity);
        suggestion.idealValue = asset.idealValue;
        suggestion.deficit = asset.deficit;
        
        suggestions.push(suggestion);
        remainingValue -= investmentValue;
      }
    }
    
    return suggestions;
  }

  /**
   * Calcula distribuição atual do portfólio
   */
  calculateCurrentDistribution(assets) {
    const totalValue = this.calculateTotalValue(assets);
    if (totalValue === 0) return { stocks: 0, reits: 0 };
    
    const stocksValue = assets
      .filter(asset => asset.type === 'stock')
      .reduce((sum, asset) => sum + (parseFloat(asset.price) * parseInt(asset.quantity)), 0);
      
    const reitsValue = assets
      .filter(asset => asset.type === 'reit')
      .reduce((sum, asset) => sum + (parseFloat(asset.price) * parseInt(asset.quantity)), 0);
    
    return {
      stocks: (stocksValue / totalValue) * 100,
      reits: (reitsValue / totalValue) * 100
    };
  }
}

// Exportar instância padrão
export const deterministicOptimizer = new DeterministicOptimizer({ debug: false });