import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio deve ser usado dentro de um PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  const { user, permissions } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [currentPortfolio, setCurrentPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carregar carteiras quando usuário logado
  useEffect(() => {
    if (user && permissions.save) {
      // Sempre carregar carteiras para usuários premium
      loadPortfolios();
    } else if (user && !permissions.save) {
      // Usuário gratuito - criar carteira temporária
      createTemporaryPortfolio();
    } else {
      // Usuário não logado - limpar carteiras
      setPortfolios([]);
      setCurrentPortfolio(null);
    }
  }, [user, permissions.save]);

  const loadPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/portfolios');
      setPortfolios(response.data);
      
      // Selecionar primeira carteira ou criar uma padrão
      if (response.data.length > 0) {
        setCurrentPortfolio(response.data[0]);
      } else {
        // Só criar carteira padrão se o usuário tem permissão para salvar
        if (permissions.save) {
          await createPortfolio('Minha Carteira', 70, 30);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
      // Em caso de erro, limpar estado
      setPortfolios([]);
      setCurrentPortfolio(null);
    } finally {
      setLoading(false);
    }
  }, [permissions.save]);

  const createTemporaryPortfolio = useCallback(() => {
    const tempPortfolio = {
      id: 'temp',
      name: 'Carteira Temporária',
      stocksPercentage: 70,
      reitsPercentage: 30,
      totalValue: 0,
      assets: [],
      isTemporary: true
    };
    setCurrentPortfolio(tempPortfolio);
    setPortfolios([tempPortfolio]);
  }, []);

  const createPortfolio = async (name, stocksPercentage = 70, reitsPercentage = 30) => {
    if (!permissions.save) {
      // Usuário gratuito só pode ter uma carteira temporária
      if (portfolios.length > 0) {
        throw new Error('Usuários gratuitos podem ter apenas uma carteira');
      }
      createTemporaryPortfolio();
      return portfolios[0];
    }

    try {
      const response = await axios.post('/portfolios', {
        name,
        stocksPercentage,
        reitsPercentage
      });

      const newPortfolio = response.data;
      setPortfolios(prev => [...prev, newPortfolio]);
      setCurrentPortfolio(newPortfolio);
      
      return newPortfolio;
    } catch (error) {
      console.error('Erro ao criar carteira:', error);
      throw error;
    }
  };

  const updatePortfolio = async (portfolioId, data) => {
    if (!permissions.save && portfolioId !== 'temp') {
      throw new Error('Funcionalidade disponível apenas para usuários Premium');
    }

    if (portfolioId === 'temp') {
      // Atualizar carteira temporária
      const updatedPortfolio = { ...currentPortfolio, ...data };
      setCurrentPortfolio(updatedPortfolio);
      setPortfolios([updatedPortfolio]);
      return updatedPortfolio;
    }

    try {
      const response = await axios.put(`/portfolios/${portfolioId}`, data);
      const updatedPortfolio = response.data;
      
      setPortfolios(prev => 
        prev.map(p => p.id === portfolioId ? updatedPortfolio : p)
      );
      
      if (currentPortfolio?.id === portfolioId) {
        setCurrentPortfolio(updatedPortfolio);
      }
      
      return updatedPortfolio;
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
      throw error;
    }
  };

  const deletePortfolio = async (portfolioId) => {
    if (!permissions.save || portfolioId === 'temp') {
      throw new Error('Não é possível deletar esta carteira');
    }

    try {
      await axios.delete(`/portfolios/${portfolioId}`);
      
      setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
      
      if (currentPortfolio?.id === portfolioId) {
        setCurrentPortfolio(portfolios[0] || null);
      }
    } catch (error) {
      console.error('Erro ao deletar carteira:', error);
      throw error;
    }
  };

  const addAsset = async (assetData) => {
    const portfolioId = currentPortfolio?.id;
    
    if (!portfolioId) {
      throw new Error('Nenhuma carteira selecionada');
    }

    if (portfolioId === 'temp') {
      // Adicionar a carteira temporária
      const newAsset = {
        id: `temp-${Date.now()}`,
        ...assetData,
        ticker: assetData.ticker.toUpperCase()
      };
      
      const updatedAssets = [...(currentPortfolio.assets || [])];
      const existingIndex = updatedAssets.findIndex(a => a.ticker === newAsset.ticker);
      
      if (existingIndex >= 0) {
        updatedAssets[existingIndex].quantity += newAsset.quantity;
      } else {
        updatedAssets.push(newAsset);
      }
      
      const totalValue = updatedAssets.reduce((sum, asset) => 
        sum + (asset.price * asset.quantity), 0
      );
      
      const updatedPortfolio = {
        ...currentPortfolio,
        assets: updatedAssets,
        totalValue
      };
      
      setCurrentPortfolio(updatedPortfolio);
      return newAsset;
    }

    try {
      const response = await axios.post(`/assets/portfolio/${portfolioId}`, assetData);
      
      // Recarregar carteira atual
      await loadCurrentPortfolio(portfolioId);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
      throw error;
    }
  };

  const updateAsset = async (assetId, data) => {
    if (currentPortfolio?.isTemporary) {
      // Atualizar ativo na carteira temporária
      const updatedAssets = currentPortfolio.assets.map(asset =>
        asset.id === assetId ? { ...asset, ...data } : asset
      );
      
      const totalValue = updatedAssets.reduce((sum, asset) => 
        sum + (asset.price * asset.quantity), 0
      );
      
      const updatedPortfolio = {
        ...currentPortfolio,
        assets: updatedAssets,
        totalValue
      };
      
      setCurrentPortfolio(updatedPortfolio);
      return;
    }

    try {
      await axios.put(`/assets/${assetId}`, data);
      
      // Recarregar carteira atual
      await loadCurrentPortfolio(currentPortfolio.id);
    } catch (error) {
      console.error('Erro ao atualizar ativo:', error);
      throw error;
    }
  };

  const removeAsset = async (assetId) => {
    if (currentPortfolio?.isTemporary) {
      // Remover da carteira temporária
      const updatedAssets = currentPortfolio.assets.filter(asset => asset.id !== assetId);
      
      const totalValue = updatedAssets.reduce((sum, asset) => 
        sum + (asset.price * asset.quantity), 0
      );
      
      const updatedPortfolio = {
        ...currentPortfolio,
        assets: updatedAssets,
        totalValue
      };
      
      setCurrentPortfolio(updatedPortfolio);
      return;
    }

    try {
      await axios.delete(`/assets/${assetId}`);
      
      // Recarregar carteira atual
      await loadCurrentPortfolio(currentPortfolio.id);
    } catch (error) {
      console.error('Erro ao remover ativo:', error);
      throw error;
    }
  };

  const loadCurrentPortfolio = async (portfolioId) => {
    try {
      const response = await axios.get(`/portfolios/${portfolioId}`);
      setCurrentPortfolio(response.data);
      
      // Atualizar na lista também
      setPortfolios(prev =>
        prev.map(p => p.id === portfolioId ? response.data : p)
      );
    } catch (error) {
      console.error('Erro ao carregar carteira:', error);
    }
  };

  const switchPortfolio = (portfolio) => {
    setCurrentPortfolio(portfolio);
  };

  const resetPortfolios = () => {
    setPortfolios([]);
    setCurrentPortfolio(null);
    setLoading(false);
  };

  const value = {
    portfolios,
    currentPortfolio,
    loading,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    removeAsset,
    switchPortfolio,
    loadPortfolios,
    loadCurrentPortfolio,
    resetPortfolios
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
