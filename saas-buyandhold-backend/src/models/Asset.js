const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Asset = sequelize.define('Asset', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    portfolioId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // Código do ativo (ex: PETR4, ITUB4, HGLG11)
    ticker: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [4, 10]
      }
    },
    // Nome do ativo (ex: Petrobras, Itaú Unibanco)
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    // Tipo do ativo
    type: {
      type: DataTypes.ENUM('stock', 'reit'),
      allowNull: false
    },
    // Quantidade de cotas/ações possuídas
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Preço atual do ativo
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Percentual desejado deste ativo DENTRO do seu tipo (ações ou FIIs)
    // Ex: PETR4 = 50% das ações, ITUB4 = 50% das ações
    targetAllocation: {
      type: DataTypes.DECIMAL(5,2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100
      }
    }
  }, {
    timestamps: true
  });

  // Instance methods
  Asset.prototype.getCurrentValue = function() {
    return parseFloat(this.quantity) * parseFloat(this.price);
  };

  Asset.prototype.getTargetValueInPortfolio = function(portfolioTotalValue, portfolioStocksPercentage, portfolioReitsPercentage) {
    const typePercentage = this.type === 'stock' ? portfolioStocksPercentage : portfolioReitsPercentage;
    const typeValue = (typePercentage / 100) * portfolioTotalValue;
    return (this.targetAllocation / 100) * typeValue;
  };

  return Asset;
};