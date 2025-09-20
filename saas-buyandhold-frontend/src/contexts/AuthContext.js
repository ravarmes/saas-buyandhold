import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl, debugLog } from '../config/environment';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurar axios interceptor
  useEffect(() => {
    const baseURL = getApiUrl();
    axios.defaults.baseURL = baseURL;
    debugLog('Configurando axios baseURL:', baseURL);
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Carregar perfil do usuário ao inicializar
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/profile');
          setUser(response.data.user);
          
          // Atualizar status de assinatura após carregar o usuário
          try {
            const subscriptionResponse = await axios.get('/auth/subscription-status');
            setUser(prevUser => ({
              ...prevUser,
              planType: subscriptionResponse.data.planType,
              subscriptionStatus: subscriptionResponse.data.subscriptionStatus,
              subscriptionEndDate: subscriptionResponse.data.subscriptionEndDate
            }));
          } catch (subscriptionError) {
            console.log('Erro ao carregar status de assinatura:', subscriptionError);
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          // Token inválido, remover
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/auth/register', {
        name,
        email,
        password
      });

      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao criar conta';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/auth/profile', profileData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao atualizar perfil';
      return { success: false, error: message };
    }
  };

  // Atualizar status de assinatura
  const updateSubscriptionStatus = async () => {
    try {
      const response = await axios.get('/auth/subscription-status');
      setUser(prevUser => ({
        ...prevUser,
        planType: response.data.planType,
        subscriptionStatus: response.data.subscriptionStatus,
        subscriptionEndDate: response.data.subscriptionEndDate
      }));
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status de assinatura:', error);
      return null;
    }
  };

  // Verificar se o usuário é premium
  const isPremium = () => {
    return user?.planType === 'premium' && user?.subscriptionStatus === 'active';
  };

  // Verificar se pode salvar carteiras
  const canSavePortfolios = () => {
    return isPremium();
  };

  // Verificar se pode criar múltiplas carteiras
  const canCreateMultiplePortfolios = () => {
    return isPremium();
  };

  // Função para recarregar dados do usuário
  const refreshUser = async () => {
    try {
      const [profileResponse, subscriptionResponse] = await Promise.all([
        axios.get('/auth/profile'),
        axios.get('/auth/subscription-status')
      ]);

      setUser(profileResponse.data.user);
      return { success: true, user: profileResponse.data.user, subscription: subscriptionResponse.data };
    } catch (error) {
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateSubscriptionStatus,
    refreshUser,
    // Flags para controle de recursos
    permissions: {
      isPremium: isPremium(),
      save: canSavePortfolios(),
      multiplePortfolios: canCreateMultiplePortfolios(),
      history: isPremium(),
      analytics: isPremium()
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
