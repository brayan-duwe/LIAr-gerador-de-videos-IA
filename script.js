// =============================================
//  LIAr — script.js
// =============================================

// Em produção (Vercel), front e back ficam no mesmo domínio, então
// usamos caminho relativo. Localmente, aponta pro servidor na porta 3001.
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api';

// ---- Estado global ----
let accessToken = localStorage.getItem('liar_token') || null;
let selectedFile = null;

// ---- Canvas de background ----
document.querySelector('header').style.display = 'none';
const cv  = document.getElementById('bg-canvas');
const ctx = cv.getContext('2d');
let mx = 0.5, my = 0.5;
const screenHistory = [];

function resize() {
  cv.width  = window.innerWidth  * 2;
  cv.height = window.innerHeight * 2;
}
resize();
window.addEventListener('resize', resize);
document.addEventListener('mousemove', (e) => {
  mx = e.clientX / window.innerWidth;
  my = e.clientY / window.innerHeight;
});

let tx = 0.5, ty = 0.5;
function draw() {
  tx += (mx - tx) * 0.08;
  ty += (my - ty) * 0.08;
  const w = cv.width, h = cv.height;
  const cx = tx * w, cy = ty * h;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0,   '#1a1a3e');
  bg.addColorStop(0.5, '#2d2b5e');
  bg.addColorStop(1,   '#1a2a4a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const r1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55);
  r1.addColorStop(0,   'rgba(90,60,180,0.45)');
  r1.addColorStop(0.5, 'rgba(60,80,160,0.2)');
  r1.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = r1;
  ctx.fillRect(0, 0, w, h);
  const r2 = ctx.createRadialGradient(w - cx, h - cy, 0, w - cx, h - cy, w * 0.45);
  r2.addColorStop(0,   'rgba(40,60,140,0.35)');
  r2.addColorStop(0.6, 'rgba(30,30,80,0.15)');
  r2.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = r2;
  ctx.fillRect(0, 0, w, h);
  requestAnimationFrame(draw);
}
draw();

// ---- Modal ----
function showModal(msg, tipo = 'erro') {
  const icones = { erro: '❌', sucesso: '✅', aviso: '⚠️' };
  document.getElementById('modal-icon').textContent     = icones[tipo] || '❌';
  document.getElementById('modal-mensagem').textContent = msg;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// Fecha modal ao clicar fora
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fecharModal();
});

// ---- Navegação ----
function navigateTo(screenId) {
  const current = document.querySelector('.screen.active');
  if (current) screenHistory.push(current.id);
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  const header   = document.querySelector('header');
  const btnVoltar = document.getElementById('btn-voltar-header');
  const semHeader = ['login', 'cadastro'];
  const semVoltar = ['login', 'cadastro', 'selecionar-imagem'];
  header.style.display     = semHeader.includes(screenId) ? 'none' : 'flex';
  btnVoltar.style.visibility = semVoltar.includes(screenId) ? 'hidden' : 'visible';
}

document.getElementById('btn-voltar-header').addEventListener('click', () => {
  if (screenHistory.length > 0) {
    const previous = screenHistory.pop();
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById(previous).classList.add('active');
    const header    = document.querySelector('header');
    const btnVoltar = document.getElementById('btn-voltar-header');
    const semHeader = ['login', 'cadastro'];
    const semVoltar = ['login', 'cadastro', 'selecionar-imagem'];
    header.style.display      = semHeader.includes(previous) ? 'none' : 'flex';
    btnVoltar.style.visibility = semVoltar.includes(previous) ? 'hidden' : 'visible';
  }
});

// ---- Helpers de botão ----
function setButtonLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.textContent;
    btn.textContent = 'Aguarde...';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.original;
  }
}

// ---- Auth: Cadastro ----
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
  const nome          = document.getElementById('nome-cadastro').value.trim();
  const email         = document.getElementById('email-cadastro').value.trim();
  const senha         = document.getElementById('senha-cadastro').value;
  const confirmarSenha = document.getElementById('confirmar-senha').value;

  if (!nome || !email || !senha) return showModal('Preencha todos os campos.');
  if (senha !== confirmarSenha)  return showModal('As senhas não coincidem.');
  if (senha.length < 6)         return showModal('A senha deve ter pelo menos 6 caracteres.');

  const btn = document.getElementById('btn-cadastrar');
  setButtonLoading(btn, true);

  try {
    const res  = await fetch(`${API_BASE}/auth/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showModal('Conta criada com sucesso! Faça login para continuar.', 'sucesso');
    // Só navega para login depois que o usuário fechar o modal
    document.querySelector('.modal-btn').addEventListener('click', () => navigateTo('login'), { once: true });
  } catch (err) {
    showModal(err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

// ---- Auth: Login ----
document.getElementById('entrar').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!email || !senha) return showModal('Preencha email e senha.');

  const btn = document.getElementById('entrar');
  setButtonLoading(btn, true);

  try {
    const res  = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Só navega se o login foi bem-sucedido
    accessToken = data.access_token;
    localStorage.setItem('liar_token', accessToken);
    navigateTo('selecionar-imagem');
  } catch (err) {
    showModal(err.message);  // fica na tela de login
  } finally {
    setButtonLoading(btn, false);
  }
});

// ---- Upload de imagem ----
const uploadArea = document.getElementById('uploadArea');
const fileInput  = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = function (e) {
    uploadArea.innerHTML = `<img src="${e.target.result}" id="preview-img">`;
    document.getElementById('prompt-preview').src = e.target.result;
    document.getElementById('button-continuar').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// ---- Contador de caracteres ----
document.getElementById('prompt-input').addEventListener('input', function () {
  document.getElementById('char-count').textContent = this.value.length + '/500 caracteres';
  const btn = document.getElementById('button-config-video');
  if (this.value.trim().length > 0) {
    btn.disabled = false;
    btn.classList.remove('disabled');
  } else {
    btn.disabled = true;
    btn.classList.add('disabled');
  }
});

// ---- Gerar vídeo ----
document.getElementById('button-gerar-video').addEventListener('click', async () => {
  if (!selectedFile)  return showModal('Nenhuma imagem selecionada.');
  if (!accessToken)   return showModal('Você precisa estar logado.');

  const prompt   = document.getElementById('prompt-input').value.trim();
  const duracao  = document.getElementById('duracao').value;
  const qualidade = document.getElementById('qualidade').value;
  const fps      = document.getElementById('fps').value;

  navigateTo('loading');

  let progress = 0;
  const fill    = document.getElementById('progressFill');
  const percent = document.getElementById('progress-percent');
  const interval = setInterval(() => {
    if (progress < 90) {
      progress += Math.random() * 3;
      fill.style.width      = Math.min(progress, 90) + '%';
      percent.textContent   = Math.round(Math.min(progress, 90)) + '%';
    }
  }, 400);

  try {
    const formData = new FormData();
    formData.append('imagem',   selectedFile);
    formData.append('prompt',   prompt);
    formData.append('duracao',  duracao);
    formData.append('qualidade', qualidade);
    formData.append('fps',      fps);

    const res  = await fetch(`${API_BASE}/videos/gerar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData
    });
    const data = await res.json();
    clearInterval(interval);

    if (!res.ok) throw new Error(data.error);

    fill.style.width    = '100%';
    percent.textContent = '100%';
    setTimeout(() => exibirResultado(data.video_url), 600);

  } catch (err) {
    clearInterval(interval);
    navigateTo('configuracoes-video');
    showModal('Erro ao gerar vídeo: ' + err.message);
  }
});

// ---- Exibir resultado ----
function exibirResultado(videoUrl) {
  const player = document.querySelector('.video-player');
  player.innerHTML = `
    <video id="video-resultado" src="${videoUrl}" controls autoplay loop
      style="width:100%;border-radius:12px;max-height:400px;">
      Seu navegador não suporta vídeo.
    </video>
  `;
  document.getElementById('btn-baixar').onclick = () => baixarVideo(videoUrl);
  navigateTo('resultado');
}

function baixarVideo(url) {
  const a = document.createElement('a');
  a.href     = url;
  a.download = `liar-video-${Date.now()}.mp4`;
  a.target   = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- Histórico ----
async function carregarHistorico() {
  if (!accessToken) return;
  const lista  = document.getElementById('historico-lista');
  const vazio  = document.getElementById('historico-vazio');
  lista.innerHTML = '<p style="color:#aaa;text-align:center">Carregando...</p>';

  try {
    const res  = await fetch(`${API_BASE}/videos/historico`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    lista.innerHTML = '';

    if (!data.videos || data.videos.length === 0) {
      vazio.style.display = 'block';
      return;
    }
    vazio.style.display = 'none';
    data.videos.forEach((item) => {
      const icone = item.status === 'completed' ? '✅' : item.status === 'failed' ? '❌' : '⏳';
      lista.innerHTML += `
        <div class="historico-item">
          <div class="historico-info">
            <p>${icone} ${item.prompt}</p>
            <span>${new Date(item.created_at).toLocaleString('pt-BR')} — ${item.duracao} | ${item.qualidade}</span>
            ${item.video_url
              ? `<a href="${item.video_url}" target="_blank" style="color:#a78bfa;font-size:0.85rem">▶ Assistir / Baixar</a>`
              : ''}
          </div>
        </div>
      `;
    });
  } catch (err) {
    lista.innerHTML = '<p style="color:#f87171">Erro ao carregar histórico.</p>';
  }
}

// ---- Logout ----
async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (_) {}

  accessToken = null;
  localStorage.removeItem('liar_token');
  selectedFile = null;
  screenHistory.length = 0;

  document.getElementById('prompt-input').value = '';
  document.getElementById('char-count').textContent = '0/500 caracteres';
  document.getElementById('uploadArea').innerHTML = `
    <span class="upload-icon">⬆</span>
    <p class="upload-text">Clique para fazer upload</p>
    <p class="upload-hint">PNG, JPG até 10MB</p>
    <input type="file" id="fileInput" accept="image/png, image/jpeg" hidden>
  `;
  document.getElementById('button-continuar').classList.add('hidden');
  const newInput = document.getElementById('fileInput');
  if (newInput) newInput.addEventListener('change', () => handleFile(newInput.files[0]));

  navigateTo('login');
}

// ---- Sessão persistente ----
// Se já tem token salvo, vai direto para a tela principal
if (accessToken) navigateTo('selecionar-imagem');
