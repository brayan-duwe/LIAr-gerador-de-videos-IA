// Ponto de entrada exigido pela Vercel para rodar o Express
// como função serverless. Tudo que está em /api é tratado
// pela Vercel como uma rota de back-end.
const app = require('../server');

module.exports = app;
