const { createClient } = require('@supabase/supabase-js');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  // Cria um cliente Supabase autenticado com o token do usuário
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
  );

  const { data: { user }, error } = await supabaseUser.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.user = user;
  req.supabase = supabaseUser; // cliente já autenticado com o token do usuário
  next();
}

module.exports = authMiddleware;
