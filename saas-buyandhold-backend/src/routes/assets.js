const express = require('express');
const { Portfolio, Asset } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * @route GET /api/assets/portfolio/:portfolioId
 * @desc Listar ativos de uma carteira
 * @access Private
 */
router.get('/portfolio/:portfolioId', authenticate, async (req, res) => {
  try {
    // Verificar se a carteira pertence ao usuário
    const portfolio = await Portfolio.findOne({
      where: { 
        id: req.params.portfolioId, 
        userId: req.user.userId 
      }
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Carteira não encontrada'
      });
    }

    const assets = await Asset.findAll({
      where: { portfolioId: req.params.portfolioId },
      order: [['type', 'ASC'], ['ticker', 'ASC']]
    });

    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      error: 'Erro ao buscar ativos'
    });
  }
});

/**
 * @route POST /api/assets/portfolio/:portfolioId
 * @desc Adicionar ativo à carteira
 * @access Private
 */
router.post('/portfolio/:portfolioId', authenticate, async (req, res) => {
  try {
    const { ticker, name, type, quantity, price, targetAllocation } = req.body;

    // Verificar se a carteira pertence ao usuário
    const portfolio = await Portfolio.findOne({
      where: { 
        id: req.params.portfolioId, 
        userId: req.user.userId 
      }
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Carteira não encontrada'
      });
    }

    // Verificar se o ativo já existe na carteira
    const existingAsset = await Asset.findOne({
      where: { 
        portfolioId: req.params.portfolioId, 
        ticker: ticker.toUpperCase() 
      }
    });

    if (existingAsset) {
      // Atualizar quantidade do ativo existente
      await existingAsset.update({
        quantity: existingAsset.quantity + quantity,
        price: price, // Atualizar preço
        targetAllocation: targetAllocation || existingAsset.targetAllocation
      });

      return res.json({
        message: 'Quantidade do ativo atualizada',
        asset: existingAsset
      });
    }

    // Criar novo ativo
    const asset = await Asset.create({
      portfolioId: req.params.portfolioId,
      ticker: ticker.toUpperCase(),
      name,
      type,
      quantity,
      price,
      targetAllocation: targetAllocation || 0
    });

    // Recalcular valor total da carteira
    await updatePortfolioTotalValue(req.params.portfolioId);

    res.status(201).json(asset);
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({
      error: 'Erro ao adicionar ativo'
    });
  }
});

/**
 * @route PUT /api/assets/:id
 * @desc Atualizar ativo
 * @access Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { quantity, price, targetAllocation } = req.body;

    // Buscar ativo e verificar se pertence ao usuário
    const asset = await Asset.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Portfolio,
          as: 'portfolio',
          where: { userId: req.user.userId }
        }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        error: 'Ativo não encontrado'
      });
    }

    await asset.update({
      quantity: quantity !== undefined ? quantity : asset.quantity,
      price: price !== undefined ? price : asset.price,
      targetAllocation: targetAllocation !== undefined ? targetAllocation : asset.targetAllocation
    });

    // Recalcular valor total da carteira
    await updatePortfolioTotalValue(asset.portfolioId);

    res.json(asset);
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({
      error: 'Erro ao atualizar ativo'
    });
  }
});

/**
 * @route DELETE /api/assets/:id
 * @desc Remover ativo
 * @access Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Buscar ativo e verificar se pertence ao usuário
    const asset = await Asset.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Portfolio,
          as: 'portfolio',
          where: { userId: req.user.userId }
        }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        error: 'Ativo não encontrado'
      });
    }

    const portfolioId = asset.portfolioId;
    await asset.destroy();

    // Recalcular valor total da carteira
    await updatePortfolioTotalValue(portfolioId);

    res.json({
      message: 'Ativo removido com sucesso'
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      error: 'Erro ao remover ativo'
    });
  }
});

/**
 * Função auxiliar para recalcular o valor total da carteira
 */
async function updatePortfolioTotalValue(portfolioId) {
  try {
    const assets = await Asset.findAll({
      where: { portfolioId }
    });

    const totalValue = assets.reduce((sum, asset) => {
      return sum + (parseFloat(asset.quantity) * parseFloat(asset.price));
    }, 0);

    await Portfolio.update(
      { totalValue },
      { where: { id: portfolioId } }
    );
  } catch (error) {
    console.error('Error updating portfolio total value:', error);
  }
}

module.exports = router;