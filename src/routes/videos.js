const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

const MAGICHOUR_API = 'https://api.magichour.ai';

// Multer: imagem em memória, max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Apenas JPG, PNG e WEBP são suportados.'));
    }
    cb(null, file);
  }
});

// Mapa duração (label do front → segundos)
const DURACAO_MAP = {
  '3 segundos': 3,
  '5 segundos': 5,
  '10 segundos': 10
};

// Plano gratuito da Magic Hour só suporta 480p
const QUALIDADE_MAP = {
  'SD (480p)': '480p'
};

// ─── Helper: faz polling até o vídeo ficar pronto ───────────────────────────
// IMPORTANTE: na Vercel, funções serverless no plano Hobby têm 60s de
// limite por padrão. Com o "Fluid Compute" ativado (gratuito, só precisa
// ligar nas configurações do projeto), esse limite sobe para até 300s,
// que é o valor configurado em maxDuration no vercel.json. Por isso o
// timeout aqui também foi ajustado para 280s (um pouco abaixo do limite,
// pra função ter tempo de responder antes de a Vercel matá-la à força).
async function aguardarVideo(jobId, timeoutMs = 280000) {
  const inicio = Date.now();
  const headers = {
    Authorization: `Bearer ${process.env.MAGICHOUR_KEY}`,
    Accept: 'application/json'
  };

  while (Date.now() - inicio < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000)); // aguarda 3s entre checks

    const res = await fetch(`${MAGICHOUR_API}/v1/video-projects/${jobId}`, { headers });
    const data = await res.json();

    console.log(`[MagicHour] Job ${jobId} status: ${data.status}`);

    if (data.status === 'complete') {
      const url = data.downloads?.[0]?.url;
      if (!url) throw new Error('Vídeo completo mas sem URL de download.');
      return url;
    }

    if (data.status === 'error' || data.status === 'canceled') {
      throw new Error(`Magic Hour retornou status: ${data.status}. Detalhe: ${data.error?.message || 'sem detalhe'}`);
    }
    // status: queued | rendering → continua polling
  }

  throw new Error('O vídeo está demorando mais que o esperado. Confira o Histórico em alguns instantes — ele pode aparecer lá quando terminar.');
}

// ─── POST /api/videos/gerar ──────────────────────────────────────────────────
router.post('/gerar', authMiddleware, upload.single('imagem'), async (req, res) => {
  try {
    const { prompt, duracao, qualidade, fps } = req.body;
    const imageFile = req.file;

    if (!imageFile) return res.status(400).json({ error: 'Imagem é obrigatória.' });
    if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt é obrigatório.' });

    const authHeader = { Authorization: `Bearer ${process.env.MAGICHOUR_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' };

    // ── PASSO 1: Pede URL de upload para a Magic Hour ──────────────────────
    const ext = imageFile.mimetype === 'image/png' ? 'png' : imageFile.mimetype === 'image/webp' ? 'webp' : 'jpg';

    const uploadUrlRes = await fetch(`${MAGICHOUR_API}/v1/files/upload-urls`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ items: [{ extension: ext, type: 'image' }] })
    });

    if (!uploadUrlRes.ok) {
      const err = await uploadUrlRes.json().catch(() => ({}));
      throw new Error(`Erro ao obter URL de upload: ${err.message || uploadUrlRes.status}`);
    }

    const { items } = await uploadUrlRes.json();
    const { upload_url, file_path } = items[0];

    // ── PASSO 2: Faz upload direto da imagem via PUT ───────────────────────
    const putRes = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': imageFile.mimetype },
      body: imageFile.buffer
    });

    if (!putRes.ok) throw new Error(`Falha no upload da imagem: HTTP ${putRes.status}`);

    // ── PASSO 3: Salva registro no Supabase (pending) ──────────────────────
    const { data: videoRecord, error: dbError } = await req.supabase
      .from('videos')
      .insert({
        user_id:   req.user.id,
        prompt:    prompt.trim(),
        image_url: file_path,
        duracao:   duracao   || '5 segundos',
        qualidade: qualidade || 'SD (480p)',
        fps:       fps       || '24 FPS',
        status:    'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ error: 'Erro ao salvar registro no banco.' });
    }

    // ── PASSO 4: Cria o job de Image-to-Video na Magic Hour ────────────────
    const endSeconds   = DURACAO_MAP[duracao]   || 5;
    const resolution   = QUALIDADE_MAP[qualidade] || '480p';

    const jobRes = await fetch(`${MAGICHOUR_API}/v1/image-to-video`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        name:        `LIAr - ${videoRecord.id}`,
        end_seconds: endSeconds,
        model:       'ltx-2.3',   // modelo gratuito disponível no plano free
        resolution,
        assets: {
          image_file_path: file_path
        },
        style: {
          prompt: prompt.trim()
        }
      })
    });

    if (!jobRes.ok) {
      const err = await jobRes.json().catch(() => ({}));
      await req.supabase.from('videos').update({ status: 'failed' }).eq('id', videoRecord.id);
      throw new Error(`Magic Hour rejeitou o job: ${err.message || jobRes.status}`);
    }

    const { id: jobId } = await jobRes.json();
    console.log(`[MagicHour] Job criado: ${jobId}`);

    // ── PASSO 5: Polling até completar ────────────────────────────────────
    const videoUrl = await aguardarVideo(jobId);

    // ── PASSO 6: Atualiza Supabase com URL final ──────────────────────────
    await req.supabase
      .from('videos')
      .update({ video_url: videoUrl, status: 'completed' })
      .eq('id', videoRecord.id);

    return res.json({
      video_url: videoUrl,
      video_id:  videoRecord.id,
      message:   'Vídeo gerado com sucesso!'
    });

  } catch (err) {
    console.error('[/gerar]', err.message);
    return res.status(500).json({ error: err.message || 'Erro interno ao gerar vídeo.' });
  }
});

// ─── GET /api/videos/historico ───────────────────────────────────────────────
router.get('/historico', authMiddleware, async (req, res) => {
  const { data, error } = await req.supabase
    .from('videos')
    .select('id, prompt, video_url, image_url, duracao, qualidade, fps, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ videos: data });
});

module.exports = router;
