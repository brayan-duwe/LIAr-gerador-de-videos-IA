document.querySelector("header").style.display = "none";
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const cv = document.getElementById("bg-canvas");
const ctx = cv.getContext("2d");
let mx = 0.5,
  my = 0.5;

const screenHistory = [];

function navigateTo(screenId) {
  const current = document.querySelector(".screen.active");
  if (current) screenHistory.push(current.id);

  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");

  // no login esconde o header inteiro
  const header = document.querySelector("header");
  header.style.display = (screenId === "login" || screenId === "cadastro") ? "none" : "flex";
  const btnVoltar = document.getElementById("btn-voltar-header");

  // esconde voltar no login e na tela de selecionar imagem
  const semVoltar = ["login", "selecionar-imagem", "cadastro"];
  btnVoltar.style.visibility = semVoltar.includes(screenId)
    ? "hidden"
    : "visible";
}

document.getElementById("btn-voltar-header").addEventListener("click", () => {
  if (screenHistory.length > 0) {
    const previous = screenHistory.pop();
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(previous).classList.add("active");

    const header = document.querySelector("header");
    const btnVoltar = document.getElementById("btn-voltar-header");

    header.style.display = previous === "login" ? "none" : "flex";

    const semVoltar = ["login", "selecionar-imagem"];
    btnVoltar.style.visibility = semVoltar.includes(previous)
      ? "hidden"
      : "visible";
  }
});

function resize() {
  cv.width = window.innerWidth * 2;
  cv.height = window.innerHeight * 2;
}
resize();
window.addEventListener("resize", resize);

document.addEventListener("mousemove", (e) => {
  mx = e.clientX / window.innerWidth;
  my = e.clientY / window.innerHeight;
});

let tx = 0.5,
  ty = 0.5;

function draw() {
  tx += (mx - tx) * 0.08;
  ty += (my - ty) * 0.08;
  const w = cv.width,
    h = cv.height;
  const cx = tx * w,
    cy = ty * h;

  // base gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#1a1a3e");
  bg.addColorStop(0.5, "#2d2b5e");
  bg.addColorStop(1, "#1a2a4a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // luz que segue o cursor
  const r1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55);
  r1.addColorStop(0, "rgba(90,60,180,0.45)");
  r1.addColorStop(0.5, "rgba(60,80,160,0.2)");
  r1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = r1;
  ctx.fillRect(0, 0, w, h);

  // luz secundária oposta
  const r2 = ctx.createRadialGradient(
    w - cx,
    h - cy,
    0,
    w - cx,
    h - cy,
    w * 0.45,
  );
  r2.addColorStop(0, "rgba(40,60,140,0.35)");
  r2.addColorStop(0.6, "rgba(30,30,80,0.15)");
  r2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = r2;
  ctx.fillRect(0, 0, w, h);

  requestAnimationFrame(draw);
}
draw();

// Clique abre o seletor de arquivo
uploadArea.addEventListener("click", () => fileInput.click());

// Drag and drop
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// Quando seleciona pelo clique
fileInput.addEventListener("change", () => {
  handleFile(fileInput.files[0]);
});

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.innerHTML = `<img src="${e.target.result}" id="preview-img">`;
    // seta a mesma imagem na tela de prompt
    document.getElementById("prompt-preview").src = e.target.result;
    document.getElementById("button-continuar").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

// Contador de caracteres
document.getElementById("prompt-input").addEventListener("input", function () {
  document.getElementById("char-count").textContent =
    this.value.length + "/500 caracteres";
  const btn = document.getElementById("button-config-video");
  if (this.value.trim().length > 0) {
    btn.disabled = false;
    btn.classList.remove("disabled");
  } else {
    btn.disabled = true;
    btn.classList.add("disabled");
  }
});

function startLoading() {
  navigateTo("loading");
  let progress = 0;
  const fill = document.getElementById("progressFill");
  const percent = document.getElementById("progress-percent");

  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      // espera um momento e vai pro resultado
      setTimeout(() => {
        document.getElementById("resultado-preview").src =
          document.getElementById("prompt-preview").src;
        navigateTo("resultado");
      }, 500);
    }
    fill.style.width = progress + "%";
    percent.textContent = Math.round(progress) + "%";
  }, 300);
}

function logout() {
  // limpa o estado
  screenHistory.length = 0;
  document.getElementById("prompt-input").value = "";
  document.getElementById("char-count").textContent = "0/500 caracteres";
  document.getElementById("uploadArea").innerHTML = `
        <span class="upload-icon">⬆</span>
        <p class="upload-text">Clique para fazer upload</p>
        <p class="upload-hint">PNG, JPG até 10MB</p>
        <input type="file" id="fileInput" accept="image/png, image/jpeg" hidden>
    `;
  document.getElementById("button-continuar").classList.add("hidden");
  navigateTo("login");
}
