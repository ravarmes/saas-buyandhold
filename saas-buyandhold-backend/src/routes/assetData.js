const express = require('express');
const AssetDataService = require('../services/AssetDataService');
const router = express.Router();

const assetService = new AssetDataService();

/**
 * @route GET /api/asset-data/search/:ticker
 * @desc Buscar dados de um ativo por ticker
 * @access Public
 */
router.get('/search/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker || ticker.length < 3) {
      return res.status(400).json({
        error: 'Ticker deve ter pelo menos 3 caracteres'
      });
    }

    const assetData = await assetService.searchAsset(ticker);
    
    res.json({
      success: true,
      data: assetData
    });
  } catch (error) {
    console.error('Erro ao buscar dados do ativo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      success: false
    });
  }
});

/**
 * @route GET /api/asset-data/available
 * @desc Listar ativos disponíveis para autocomplete
 * @access Public
 */
router.get('/available', async (req, res) => {
  try {
    const assets = await assetService.getAvailableAssets();
    
    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Erro ao buscar ativos disponíveis:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      success: false
    });
  }
});

/**
 * @route POST /api/asset-data/validate
 * @desc Validar múltiplos tickers
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const { tickers } = req.body;
    
    if (!Array.isArray(tickers)) {
      return res.status(400).json({
        error: 'Tickers deve ser um array'
      });
    }

    const validationResults = await Promise.all(
      tickers.map(async (ticker) => {
        const isValid = await assetService.validateTicker(ticker);
        return { ticker, valid: isValid };
      })
    );
    
    res.json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Erro ao validar tickers:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      success: false
    });
  }
});

module.exports = router;
