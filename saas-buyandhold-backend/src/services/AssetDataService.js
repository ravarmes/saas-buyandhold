const axios = require('axios');

class AssetDataService {
  constructor() {
    // APIs gratuitas para dados de ações brasileiras
    this.apis = {
      // Brapi - API brasileira gratuita
      brapi: {
        baseUrl: 'https://brapi.dev/api',
        endpoints: {
          quote: '/quote/{ticker}',
          search: '/available'
        }
      },
      // Yahoo Finance (através de API pública)
      yahoo: {
        baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
        endpoints: {
          quote: '/{ticker}.SA'
        }
      },
      // Hg Finance - API brasileira
      hgFinance: {
        baseUrl: 'https://api.hgbrasil.com/finance',
        endpoints: {
          quote: '/stock_price?key=free&symbol={ticker}'
        }
      }
    };
  }

  /**
   * Buscar dados do ativo usando múltiplas APIs
   */
  async searchAsset(ticker) {
    const cleanTicker = ticker.toUpperCase().trim();
    
    try {
      // Tentar Brapi primeiro (mais confiável para ações brasileiras)
      const brapiData = await this.fetchFromBrapi(cleanTicker);
      if (brapiData) return brapiData;

      // Fallback para Yahoo Finance
      const yahooData = await this.fetchFromYahoo(cleanTicker);
      if (yahooData) return yahooData;

      // Fallback para HG Finance
      const hgData = await this.fetchFromHgFinance(cleanTicker);
      if (hgData) return hgData;

      // Se nenhuma API funcionou, retornar dados básicos
      return this.createFallbackData(cleanTicker);

    } catch (error) {
      console.error('Erro ao buscar dados do ativo:', error);
      return this.createFallbackData(cleanTicker);
    }
  }

  /**
   * Buscar dados na API Brapi
   */
  async fetchFromBrapi(ticker) {
    try {
      const url = `${this.apis.brapi.baseUrl}/quote/${ticker}`;
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const data = response.data.results[0];
        
        return {
          ticker: data.symbol,
          name: data.longName || data.shortName || ticker,
          price: data.regularMarketPrice || 0,
          type: this.determineAssetType(ticker),
          source: 'Brapi',
          currency: data.currency || 'BRL',
          marketCap: data.marketCap,
          sector: data.sector
        };
      }
    } catch (error) {
      console.log(`Brapi falhou para ${ticker}:`, error.message);
    }
    return null;
  }

  /**
   * Buscar dados no Yahoo Finance
   */
  async fetchFromYahoo(ticker) {
    try {
      const tickerWithSuffix = ticker.endsWith('.SA') ? ticker : `${ticker}.SA`;
      const url = `${this.apis.yahoo.baseUrl}/${tickerWithSuffix}`;
      
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data && response.data.chart && response.data.chart.result) {
        const data = response.data.chart.result[0];
        const meta = data.meta;
        
        return {
          ticker: ticker,
          name: meta.longName || meta.shortName || ticker,
          price: meta.regularMarketPrice || meta.previousClose || 0,
          type: this.determineAssetType(ticker),
          source: 'Yahoo Finance',
          currency: meta.currency || 'BRL'
        };
      }
    } catch (error) {
      console.log(`Yahoo Finance falhou para ${ticker}:`, error.message);
    }
    return null;
  }

  /**
   * Buscar dados na HG Finance
   */
  async fetchFromHgFinance(ticker) {
    try {
      const url = `${this.apis.hgFinance.baseUrl}/stock_price?key=free&symbol=${ticker}`;
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data && response.data.results && response.data.results[ticker]) {
        const data = response.data.results[ticker];
        
        return {
          ticker: ticker,
          name: data.name || ticker,
          price: parseFloat(data.price) || 0,
          type: this.determineAssetType(ticker),
          source: 'HG Finance',
          currency: 'BRL',
          change: data.change_percent
        };
      }
    } catch (error) {
      console.log(`HG Finance falhou para ${ticker}:`, error.message);
    }
    return null;
  }

  /**
   * Determinar tipo do ativo baseado no ticker
   */
  determineAssetType(ticker) {
    const cleanTicker = ticker.replace('.SA', '');
    
    // FIIs geralmente terminam em 11
    if (cleanTicker.endsWith('11')) {
      return 'reit';
    }
    
    // Ações geralmente terminam em 3, 4, ou outros números
    if (/\d+$/.test(cleanTicker)) {
      return 'stock';
    }
    
    // Default para ação
    return 'stock';
  }

  /**
   * Criar dados básicos quando APIs falham
   */
  createFallbackData(ticker) {
    return {
      ticker: ticker,
      name: `${ticker} - Nome não encontrado`,
      price: 0,
      type: this.determineAssetType(ticker),
      source: 'Manual',
      currency: 'BRL',
      note: 'Dados não encontrados nas APIs. Insira manualmente.'
    };
  }

  /**
   * Buscar lista de ativos disponíveis (para autocomplete)
   */
  async getAvailableAssets() {
    try {
      const response = await axios.get(`${this.apis.brapi.baseUrl}/available`, { timeout: 5000 });
      
      if (response.data && response.data.stocks) {
        return response.data.stocks.map(stock => ({
          ticker: stock,
          name: stock,
          type: this.determineAssetType(stock)
        }));
      }
    } catch (error) {
      console.log('Erro ao buscar lista de ativos:', error.message);
    }
    
    // Lista básica de ativos populares como fallback
    return this.getPopularAssets();
  }

  /**
   * Lista de ativos populares como fallback
   */
  getPopularAssets() {
    return [
      // Ações populares
      { ticker: 'PETR4', name: 'Petrobras', type: 'stock' },
      { ticker: 'VALE3', name: 'Vale', type: 'stock' },
      { ticker: 'ITUB4', name: 'Itaú Unibanco', type: 'stock' },
      { ticker: 'BBDC4', name: 'Bradesco', type: 'stock' },
      { ticker: 'ABEV3', name: 'Ambev', type: 'stock' },
      { ticker: 'WEGE3', name: 'WEG', type: 'stock' },
      { ticker: 'SUZB3', name: 'Suzano', type: 'stock' },
      { ticker: 'MGLU3', name: 'Magazine Luiza', type: 'stock' },
      
      // FIIs populares
      { ticker: 'HGLG11', name: 'CSHG Logística', type: 'reit' },
      { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária', type: 'reit' },
      { ticker: 'XPML11', name: 'XP Malls', type: 'reit' },
      { ticker: 'VISC11', name: 'Vinci Shopping Centers', type: 'reit' },
      { ticker: 'MXRF11', name: 'Maxi Renda', type: 'reit' },
      { ticker: 'BCFF11', name: 'BTG Pactual Corporate', type: 'reit' }
    ];
  }

  /**
   * Validar se o ticker existe
   */
  async validateTicker(ticker) {
    const data = await this.searchAsset(ticker);
    return data && data.price > 0;
  }
}

module.exports = AssetDataService;
