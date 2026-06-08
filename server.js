require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes  = require('./src/routes/auth');
const videoRoutes = require('./src/routes/videos');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ADICIONA ESSAS DUAS LINHAS AQUI:
const path = require('path');
app.use(express.static(path.join(__dirname)));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',   authRoutes);
app.use('/api/videos', videoRoutes);

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`✅ LIAr Backend rodando em http://localhost:${PORT}`);
  console.log(`   Supabase URL:    ${process.env.SUPABASE_URL     ? '✓ configurado' : '✗ NÃO configurado'}`);
  console.log(`   Magic Hour Key:  ${process.env.MAGICHOUR_KEY    ? '✓ configurado' : '✗ NÃO configurado'}`);
});
