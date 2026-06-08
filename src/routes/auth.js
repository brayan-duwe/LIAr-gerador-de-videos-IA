const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
  const { email, senha, nome } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { full_name: nome }
    }
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.status(201).json({
    message: 'Conta criada! Verifique seu email para confirmar.',
    user: data.user
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) return res.status(401).json({ error: 'Email ou senha incorretos.' });

  return res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      nome: data.user.user_metadata?.full_name
    }
  });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const userSupabase = require('../supabaseClient');
    await userSupabase.auth.signOut();
  }
  return res.json({ message: 'Logout realizado.' });
});

module.exports = router;
