const express = require('express');
const { User, Portfolio, Asset } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * @route GET /api/portfolios
 * @desc Listar carteiras do usuário
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const portfolios = await Portfolio.findAll({
      where: { userId: req.user.userId },
      attributes: ['id', 'name', 'isDefault', 'stocksPercentage', 'reitsPercentage', 'totalValue', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Asset,
          as: 'assets',
          attributes: ['id', 'ticker', 'name', 'type', 'quantity', 'price', 'targetAllocation']
        }
      ],
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
    });

    res.json(portfolios);
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({
      error: 'Erro ao buscar carteiras'
    });
  }
});

/**
 * @route POST /api/portfolios
 * @desc Criar nova carteira
 * @access Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, stocksPercentage, reitsPercentage } = req.body;
    const user = await User.findByPk(req.user.userId);

    // Verificar se pode criar múltiplas carteiras
    if (!user.isPremium()) {
      const existingPortfolios = await Portfolio.count({
        where: { userId: req.user.userId }
      });
      
      if (existingPortfolios >= 1) {
        return res.status(403).json({
          error: 'Usuários gratuitos podem ter apenas uma carteira',
          upgradeRequired: true
        });
      }
    }

    // Validar percentuais
    if (Math.abs((stocksPercentage + reitsPercentage) - 100) > 0.01) {
      return res.status(400).json({
        error: 'A soma dos percentuais de ações e FIIs deve ser 100%'
      });
    }

    const portfolio = await Portfolio.create({
      userId: req.user.userId,
      name: name || 'Minha Carteira',
      stocksPercentage: stocksPercentage || 70,
      reitsPercentage: reitsPercentage || 30,
      isDefault: false
    });

    res.status(201).json(portfolio);
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({
      error: 'Erro ao criar carteira'
    });
  }
});

/**
 * @route GET /api/portfolios/:id
 * @desc Obter carteira específica
 * @access Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      },
      attributes: ['id', 'name', 'isDefault', 'stocksPercentage', 'reitsPercentage', 'totalValue', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Asset,
          as: 'assets',
          attributes: ['id', 'ticker', 'name', 'type', 'quantity', 'price', 'targetAllocation']
        }
      ]
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Carteira não encontrada'
      });
    }

    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      error: 'Erro ao buscar carteira'
    });
  }
});

/**
 * @route PUT /api/portfolios/:id
 * @desc Atualizar carteira
 * @access Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, stocksPercentage, reitsPercentage } = req.body;

    const portfolio = await Portfolio.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      }
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Carteira não encontrada'
      });
    }

    // Validar percentuais se fornecidos
    if (stocksPercentage !== undefined && reitsPercentage !== undefined) {
      if (Math.abs((stocksPercentage + reitsPercentage) - 100) > 0.01) {
        return res.status(400).json({
          error: 'A soma dos percentuais de ações e FIIs deve ser 100%'
        });
      }
    }

    await portfolio.update({
      name: name || portfolio.name,
      stocksPercentage: stocksPercentage !== undefined ? stocksPercentage : portfolio.stocksPercentage,
      reitsPercentage: reitsPercentage !== undefined ? reitsPercentage : portfolio.reitsPercentage
    });

    // Buscar a carteira atualizada com os assets incluídos
    const updatedPortfolio = await Portfolio.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      },
      attributes: ['id', 'name', 'isDefault', 'stocksPercentage', 'reitsPercentage', 'totalValue', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Asset,
          as: 'assets',
          attributes: ['id', 'ticker', 'name', 'type', 'quantity', 'price', 'targetAllocation']
        }
      ]
    });

    res.json(updatedPortfolio);
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({
      error: 'Erro ao atualizar carteira'
    });
  }
});

/**
 * @route DELETE /api/portfolios/:id
 * @desc Deletar carteira
 * @access Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      }
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Carteira não encontrada'
      });
    }

    await portfolio.destroy();

    res.json({
      message: 'Carteira removida com sucesso'
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({
      error: 'Erro ao remover carteira'
    });
  }
});

module.exports = router;