const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

const cv = document.getElementById('bg-canvas');
const ctx = cv.getContext('2d');
let mx = 0.5, my = 0.5;

function resize() {
  cv.width = window.innerWidth * 2;
  cv.height = window.innerHeight * 2;
}
resize();
window.addEventListener('resize', resize);

document.addEventListener('mousemove', e => {
  mx = e.clientX / window.innerWidth;
  my = e.clientY / window.innerHeight;
});

let tx = 0.5, ty = 0.5;

function draw() {
  tx += (mx - tx) * 0.08;
  ty += (my - ty) * 0.08;
  const w = cv.width, h = cv.height;
  const cx = tx * w, cy = ty * h;

  // base gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#1a1a3e');
  bg.addColorStop(0.5, '#2d2b5e');
  bg.addColorStop(1, '#1a2a4a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // luz que segue o cursor
  const r1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55);
  r1.addColorStop(0, 'rgba(90,60,180,0.45)');
  r1.addColorStop(0.5, 'rgba(60,80,160,0.2)');
  r1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = r1;
  ctx.fillRect(0, 0, w, h);

  // luz secundária oposta
  const r2 = ctx.createRadialGradient(w - cx, h - cy, 0, w - cx, h - cy, w * 0.45);
  r2.addColorStop(0, 'rgba(40,60,140,0.35)');
  r2.addColorStop(0.6, 'rgba(30,30,80,0.15)');
  r2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = r2;
  ctx.fillRect(0, 0, w, h);

  requestAnimationFrame(draw);
}
draw();

// Oculta sections
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// Clique abre o seletor de arquivo
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// Quando seleciona pelo clique
fileInput.addEventListener('change', () => {
  handleFile(fileInput.files[0]);
});

function handleFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `<img src="${e.target.result}" id="preview-img">`;
        document.getElementById('btn-continuar').style.display = 'block';
    };
    reader.readAsDataURL(file);
}