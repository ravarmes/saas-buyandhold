const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Portfolio = sequelize.define('Portfolio', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Minha Carteira'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Percentuais de distribuição desejados entre ações e FIIs
    stocksPercentage: {
      type: DataTypes.DECIMAL(5,2),
      defaultValue: 70.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    reitsPercentage: {
      type: DataTypes.DECIMAL(5,2),
      defaultValue: 30.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    // Valor total calculado da carteira
    totalValue: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0.00
    }
  }, {
    timestamps: true,
    validate: {
      // Validação para garantir que ações + FIIs = 100%
      percentagesSum() {
        const stocksPercentage = parseFloat(this.stocksPercentage) || 0;
        const reitsPercentage = parseFloat(this.reitsPercentage) || 0;
        const total = stocksPercentage + reitsPercentage;
        
        if (Math.abs(total - 100) > 0.01) {
          throw new Error('A soma dos percentuais de ações e FIIs deve ser 100%');
        }
      }
    }
  });

  return Portfolio;
};