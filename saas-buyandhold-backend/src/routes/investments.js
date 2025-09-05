const express = require('express');
const { Portfolio, Asset, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const DeterministicOptimizer = require('../services/DeterministicOptimizer');
const router = express.Router();

const optimizer = new DeterministicOptimizer();

/**
 * @route POST /api/investments/calculate
 * @desc Calcular sugestões de investimento
 * @access Private
 */
router.post('/calculate', authenticate, async (req, res) => {
  try {
    const { portfolioId, investmentAmount, portfolioData } = req.body;

    // Validar valor de investimento
    const parsedInvestmentAmount = parseFloat(investmentAmount);
    if (!investmentAmount || parsedInvestmentAmount <= 0 || isNaN(parsedInvestmentAmount)) {
      return res.status(400).json({
        error: 'Valor de investimento deve ser um número válido maior que zero'
      });
    }

    let portfolio;
    let assetsForCalculation;
    let portfolioSettings;

    // Verificar se é carteira temporária (usuários gratuitos)
    if (portfolioId === 'temp' && portfolioData) {
      // Usar dados da carteira temporária enviados pelo frontend
      portfolio = portfolioData;
      
      if (!portfolio.assets || portfolio.assets.length === 0) {
        return res.status(400).json({
          error: 'Adicione ativos à carteira antes de calcular sugestões'
        });
      }

      // Preparar configurações da carteira temporária
      const stocksPercentage = parseFloat(portfolio.stocksPercentage) || 0;
      const reitsPercentage = parseFloat(portfolio.reitsPercentage) || 0;
      
      // Validar percentuais
      if (isNaN(stocksPercentage) || isNaN(reitsPercentage)) {
        console.error('Invalid portfolio percentages:', { stocksPercentage: portfolio.stocksPercentage, reitsPercentage: portfolio.reitsPercentage });
        return res.status(400).json({
          error: 'Percentuais de alocação inválidos. Verifique os valores de ações e FIIs.'
        });
      }
      
      portfolioSettings = {
        stocksPercentage: stocksPercentage,
        reitsPercentage: reitsPercentage,
        assetAllocations: {}
      };

      // Mapear alocações dos ativos
      portfolio.assets.forEach(asset => {
        if (asset.targetAllocation > 0) {
          portfolioSettings.assetAllocations[asset.ticker] = parseFloat(asset.targetAllocation);
        }
      });

      // Converter assets para formato esperado pelo calculador
      assetsForCalculation = portfolio.assets.map(asset => {
        const quantity = parseInt(asset.quantity) || 0;
        const price = parseFloat(asset.price) || 0;
        const targetAllocation = parseFloat(asset.targetAllocation) || 0;
        
        // Validar se os valores são válidos
        if (isNaN(quantity) || isNaN(price) || isNaN(targetAllocation)) {
          console.error('Invalid asset data:', asset);
          throw new Error(`Dados inválidos para o ativo ${asset.ticker}`);
        }
        
        return {
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          quantity: quantity,
          price: price,
          targetAllocation: targetAllocation
        };
      });
    } else {
      // Carteira persistente (usuários premium)
      if (!portfolioId) {
        return res.status(400).json({
          error: 'ID da carteira é obrigatório'
        });
      }

      // Buscar carteira e verificar propriedade
      portfolio = await Portfolio.findOne({
        where: { id: portfolioId, userId: req.user.userId },
        include: [{ model: Asset, as: 'assets' }]
      });

      if (!portfolio) {
        return res.status(404).json({
          error: 'Carteira não encontrada'
        });
      }

      if (!portfolio.assets || portfolio.assets.length === 0) {
        return res.status(400).json({
          error: 'Adicione ativos à carteira antes de calcular sugestões'
        });
      }

      // Preparar configurações da carteira
      portfolioSettings = {
        stocksPercentage: parseFloat(portfolio.stocksPercentage),
        reitsPercentage: parseFloat(portfolio.reitsPercentage),
        assetAllocations: {}
      };

      // Mapear alocações dos ativos
      portfolio.assets.forEach(asset => {
        if (asset.targetAllocation > 0) {
          portfolioSettings.assetAllocations[asset.ticker] = parseFloat(asset.targetAllocation);
        }
      });

      // Converter assets para formato esperado pelo calculador
      assetsForCalculation = portfolio.assets.map(asset => ({
        ticker: asset.ticker,
        name: asset.name,
        type: asset.type,
        quantity: parseInt(asset.quantity),
        price: parseFloat(asset.price),
        targetAllocation: parseFloat(asset.targetAllocation) || 0
      }));
    }

    // Calcular sugestões usando DeterministicOptimizer
    const suggestions = optimizer.optimize(
      assetsForCalculation,
      portfolioSettings,
      parsedInvestmentAmount
    );

    // Calcular resumo
    const totalAllocated = suggestions.reduce((sum, s) => sum + s.value, 0);
    const remainingValue = parseFloat(investmentAmount) - totalAllocated;
    
    // Calcular alocação por categoria
    const stocksAllocation = suggestions
      .filter(s => s.type === 'stock')
      .reduce((sum, s) => sum + (s.value || 0), 0);
    
    const reitsAllocation = suggestions
      .filter(s => s.type === 'reit')
      .reduce((sum, s) => sum + (s.value || 0), 0);
    
    // Debug logs para identificar problemas com NaN
    console.log('Debug - Investment calculation:');
    console.log('- Investment Amount:', parsedInvestmentAmount);
    console.log('- Portfolio Settings:', portfolioSettings);
    console.log('- Assets for calculation:', assetsForCalculation);
    console.log('- Suggestions:', suggestions);
    console.log('- Stocks Allocation:', stocksAllocation);
    console.log('- REITs Allocation:', reitsAllocation);
    
    const result = {
      suggestions,
      summary: {
        totalAllocated,
        remainingValue,
        totalInvestment: parseFloat(investmentAmount),
        stocksAllocation,
        reitsAllocation
      }
    };

    // Validação simples
    const validation = {
      isValid: totalAllocated <= parseFloat(investmentAmount),
      totalSuggested: totalAllocated,
      availableAmount: parseFloat(investmentAmount),
      remainingAmount: remainingValue
    };

    // Incrementar contador de simulações do usuário
    await User.increment('investmentSimulationsCount', {
      where: { id: req.user.userId }
    });

    // Calcular distribuição atual
    const currentValues = optimizer.calculateCategoryValues(assetsForCalculation);
    const currentDistribution = {
      stocks: currentValues.stocksPercentage,
      reits: currentValues.reitsPercentage
    };
    const portfolioValue = currentValues.total;

    res.json({
      portfolioId,
      investmentAmount: parseFloat(investmentAmount),
      suggestions: result.suggestions,
      summary: result.summary,
      validation,
      currentDistribution,
      portfolioValue,
      portfolioSettings
    });
  } catch (error) {
    console.error('Investment calculation error:', error);
    res.status(500).json({
      error: 'Erro ao calcular sugestões de investimento',
      details: error.message
    });
  }
});

/**
 * @route POST /api/investments/execute
 * @desc Executar investimento (atualizar carteira)
 * @access Private
 */
router.post('/execute', authenticate, async (req, res) => {
  try {
    const { portfolioId, selectedSuggestions } = req.body;

    if (!selectedSuggestions || !Array.isArray(selectedSuggestions) || selectedSuggestions.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma sugestão selecionada para execução'
      });
    }

    // Buscar carteira
    const portfolio = await Portfolio.findOne({
      where: { id: portfolioId, userId: req.user.userId },
      include: [{ model: Asset, as: 'assets' }]
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Carteira não encontrada'
      });
    }

    // Executar cada sugestão selecionada
    for (const suggestion of selectedSuggestions) {
      const existingAsset = await Asset.findOne({
        where: { 
          portfolioId, 
          ticker: suggestion.ticker 
        }
      });

      if (existingAsset) {
        // Atualizar quantidade do ativo existente
        await existingAsset.update({
          quantity: existingAsset.quantity + suggestion.quantityToBuy,
          price: suggestion.price // Atualizar preço também
        });
      } else {
        // Criar novo ativo
        await Asset.create({
          portfolioId,
          ticker: suggestion.ticker,
          name: suggestion.name,
          type: suggestion.type,
          quantity: suggestion.quantityToBuy,
          price: suggestion.price,
          targetAllocation: 0 // Será definido pelo usuário posteriormente
        });
      }
    }

    // Recalcular valor total da carteira
    const updatedAssets = await Asset.findAll({
      where: { portfolioId }
    });

    const newTotalValue = updatedAssets.reduce((sum, asset) => {
      return sum + (parseFloat(asset.quantity) * parseFloat(asset.price));
    }, 0);

    await portfolio.update({ totalValue: newTotalValue });

    // Buscar carteira atualizada
    const updatedPortfolio = await Portfolio.findOne({
      where: { id: portfolioId, userId: req.user.userId },
      include: [{ model: Asset, as: 'assets' }]
    });

    // Calcular nova distribuição
    const assetsForDistribution = updatedPortfolio.assets.map(asset => ({
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      quantity: parseInt(asset.quantity),
      price: parseFloat(asset.price)
    }));

    const newDistribution = optimizer.calculateCategoryValues(assetsForDistribution);

    res.json({
      message: 'Investimento executado com sucesso',
      portfolio: updatedPortfolio,
      executedSuggestions: selectedSuggestions,
      newDistribution,
      newTotalValue
    });
  } catch (error) {
    console.error('Investment execution error:', error);
    res.status(500).json({
      error: 'Erro ao executar investimento',
      details: error.message
    });
  }
});

module.exports = router;