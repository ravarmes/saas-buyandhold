// const AsaasService = require('../services/AsaasService');
const { Payment } = require('../models');
const logger = require('../utils/logger');

// const asaasService = new AsaasService();

// Temporariamente desabilitado para focar no Mercado Pago
const createPixPayment = async (req, res) => {
  res.status(503).json({ error: 'Asaas temporariamente desabilitado' });
};

const getPaymentStatus = async (req, res) => {
  res.status(503).json({ error: 'Asaas temporariamente desabilitado' });
};

const getUserPayments = async (req, res) => {
  res.status(503).json({ error: 'Asaas temporariamente desabilitado' });
};

const handleWebhook = async (req, res) => {
  res.status(503).json({ error: 'Asaas temporariamente desabilitado' });
};

const healthCheck = async (req, res) => {
  res.json({ status: 'Asaas temporariamente desabilitado', timestamp: new Date().toISOString() });
};

module.exports = {
  createPixPayment,
  getPaymentStatus,
  getUserPayments,
  handleWebhook,
  healthCheck
};