const MAX_FILE_SIZE = 10 * 1024 * 1024;
const posterCanvas = document.getElementById('posterCanvas');
const ctx = posterCanvas.getContext('2d');
const supportForm = document.getElementById('supportForm');
const photoInput = document.getElementById('photo');
const nameInput = document.getElementById('name');
const originInput = document.getElementById('origin');
const causeInput = document.getElementById('cause');
const messageInput = document.getElementById('message');
const status = document.getElementById('status');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const installBtn = document.getElementById('installBtn');
// photo action controls
const photoActionSelect = document.getElementById('photoActionSelect');
const photoPreview = document.getElementById('photoPreview');
const cameraStream = document.getElementById('cameraStream');
const captureBtn = document.getElementById('captureBtn');
const cancelCaptureBtn = document.getElementById('cancelCaptureBtn');
const captureWrapper = document.getElementById('captureWrapper');
let uploadedImage = null;
let deferredPrompt = null;
let cameraStreamObj = null;
const FIXED_HASHTAG = '#MiVozCuenta';
// fixed header logo (use cepeda.jpg placed at project root)
let campaignLogo = new Image();
campaignLogo.src = 'img/cepeda.jpg';
campaignLogo.onload = () => { try { generatePoster(); } catch (e) {} };

const defaultMessages = [
  'Creo en una Colombia donde la paz, la justicia social y las oportunidades lleguen a todos los territorios. Por eso apoyo a Iván Cepeda.',
  'Sueño con una Colombia donde nuestras diferencias no nos dividan y donde todos tengamos oportunidades para construir un mejor futuro. Por eso apoyo a Iván Cepeda.',
  'Creo que es posible construir un país más justo, más humano y con oportunidades para todos. Por eso apoyo a Iván Cepeda.'
];

const causeMessages = {
  Paz: 'Creo en una Colombia donde la violencia no determine el futuro de nuestras comunidades y donde la paz sea una realidad para todos. Por eso apoyo a Iván Cepeda.',
  Educación: 'Creo que la educación debe abrir oportunidades para todos los jóvenes del país. Por eso apoyo a Iván Cepeda.',
  Salud: 'Creo que la salud debe ser un derecho garantizado para todos los colombianos. Por eso apoyo a Iván Cepeda.',
  Juventud: 'Creo en una Colombia donde los jóvenes tengan más oportunidades y puedan construir sus proyectos de vida. Por eso apoyo a Iván Cepeda.',
  Campo: 'Creo en un país que valore el campo, apoye a los campesinos y fortalezca el desarrollo rural. Por eso apoyo a Iván Cepeda.',
  Empleo: 'Creo en una Colombia con empleo digno y oportunidades para todos. Por eso apoyo a Iván Cepeda.',
  'Derechos Humanos': 'Creo en una Colombia donde la dignidad humana y los derechos de todos sean respetados. Por eso apoyo a Iván Cepeda.',
  'Justicia Social': 'Creo en una Colombia más justa e incluyente, donde nadie quede atrás. Por eso apoyo a Iván Cepeda.',
  'Medio Ambiente': 'Creo en una Colombia que proteja su riqueza natural y garantice un futuro sostenible para las próximas generaciones. Por eso apoyo a Iván Cepeda.'
};

function setStatus(text, isError = false) {
  status.textContent = text;
  status.style.color = isError ? '#b00020' : '#334155';
}

function isValidImage(file) {
  if (!file) return false;
  if (file.size > MAX_FILE_SIZE) return false;
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
}

function getHeaderText(name, origin) {
  if (!origin.trim()) {
    return `Me llamo ${name.trim()}.`;
  }
  return `Me llamo ${name.trim()}, de ${origin.trim()}.`;
}

function getMessageText(message, cause) {
  if (message.trim()) {
    return message.trim();
  }
  if (cause && causeMessages[cause]) {
    return causeMessages[cause];
  }
  return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#002f6c');
  gradient.addColorStop(1, '#4786d5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (let i = 0; i < 7; i += 1) {
    const size = 340 + i * 70;
    ctx.beginPath();
    ctx.arc(540, 540, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTemplate() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(24, 24, 1032, 1032);

  ctx.fillStyle = '#002f6c';
  // header background (fallback color) - make header taller to show cover image
  const headerX = 24;
  const headerY = 24;
  const headerW = 1032;
  const headerH = 300; // increased height
  ctx.fillRect(headerX, headerY, headerW, headerH);

  // draw campaign image as full-width header cover (if available)
  if (campaignLogo && campaignLogo.complete && campaignLogo.width && campaignLogo.height) {
    try {
      const dx = headerX;
      const dy = headerY;
      const dw = headerW;
      const dh = headerH;
      const scale = Math.max(dw / campaignLogo.width, dh / campaignLogo.height);
      const sw = Math.round(dw / scale);
      const sh = Math.round(dh / scale);
      const sx = Math.round((campaignLogo.width - sw) / 2);
      const sy = Math.round((campaignLogo.height - sh) / 2);
      ctx.drawImage(campaignLogo, sx, sy, sw, sh, dx, dy, dw, dh);
    } catch (e) {
      // fallback: keep colored header
    }
  }
  ctx.font = '500 30px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  // header title vertically centered
  ctx.fillText('Iván Cepeda - Presidencia', 60, headerY + Math.round(headerH / 2) + 6);

  // left and right panels (same size)
  const panelX = 60;
  const panelY = headerY + headerH + 12; // position panels below expanded header
  const panelW = 440;
  const panelH = 560;

  ctx.fillStyle = '#f2f5fb';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#d8e2f5';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // right text panel slightly tinted for better contrast
  ctx.fillStyle = '#fbfdff';
  ctx.fillRect(panelX + panelW + 16, panelY, panelW, panelH);
  ctx.strokeStyle = '#d8e2f5';
  ctx.strokeRect(panelX + panelW + 16, panelY, panelW, panelH);

  // no 'Mensaje de apoyo' text as requested
}

function drawImageCrop(img) {
  // image area sits inside the left panel with consistent padding
  const panelX = 60;
  const headerY = 24;
  const headerH = 300;
  const panelY = headerY + headerH + 12;
  const pad = 16;
  const x = panelX + pad;
  const y = panelY + pad;
  const w = 440 - pad * 2;
  const h = 560 - pad * 2;

  if (!img) {
    drawPlaceholderImage(x, y, w, h);
    return;
  }
  // draw framed photo with shadow and cover-fit crop for a more attractive look
  const framePad = 10;
  ctx.save();
  // outer shadowed frame
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - framePad, y - framePad, w + framePad * 2, h + framePad * 2, 34);
  ctx.fill();
  ctx.restore();

  // compute cover crop (scale image so it fills area)
  const scale = Math.max(w / img.width, h / img.height);
  const sw = Math.round(w / scale);
  const sh = Math.round(h / scale);
  const sx = Math.round((img.width - sw) / 2);
  const sy = Math.round((img.height - sh) / 2);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();

  // inner border
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d8e2f5';
  ctx.stroke();
}

function drawPlaceholderImage(x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.fillStyle = '#e6eefb';
  ctx.fill();
  ctx.strokeStyle = '#d8e2f5';
  ctx.lineWidth = 2;
  ctx.stroke();

  // simple avatar silhouette
  ctx.fillStyle = '#b6c7e8';
  const cx = x + w / 2;
  const cy = y + h / 2 - 30;
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy + 70, 90, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6b7280';
  ctx.font = '600 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sube tu foto', cx, y + h - 28);
  ctx.restore();
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

function wrapText(text, maxWidth, lineHeight, startX, startY) {
  const words = text.split(' ');
  let line = '';
  let y = startY;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const { width: testWidth } = ctx.measureText(testLine);
    if (testWidth > maxWidth && line) {
      ctx.fillText(line, startX, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) {
    ctx.fillText(line, startX, y);
  }
}

// Draw justified text: distribute extra space between words for each full line
function drawJustifiedText(text, maxWidth, lineHeight, startX, startY) {
  const words = text.split(' ');
  let line = [];
  let y = startY;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const testLine = line.length ? line.join(' ') + ' ' + word : word;
    const { width: testWidth } = ctx.measureText(testLine);
    if (testWidth > maxWidth && line.length) {
      // justify current line
      const lineText = line.join(' ');
      const wordsInLine = line;
      const wordsWidth = wordsInLine.reduce((sum, w) => sum + ctx.measureText(w).width, 0);
      const spaceCount = wordsInLine.length - 1;
      const extraSpace = spaceCount > 0 ? (maxWidth - wordsWidth) / spaceCount : 0;
      let x = startX;
      for (let j = 0; j < wordsInLine.length; j += 1) {
        ctx.fillText(wordsInLine[j], x, y);
        x += ctx.measureText(wordsInLine[j]).width + extraSpace;
      }
      line = [word];
      y += lineHeight;
    } else {
      line.push(word);
    }
  }

  // draw last line left-aligned
  if (line.length) {
    ctx.fillText(line.join(' '), startX, y);
  }
}

function drawText(header, message) {
  const panelX = 60;
  const panelW = 440;
  const panelH = 560;
  const headerY = 24;
  const headerH = 300;
  const panelY = headerY + headerH + 12;
  const textX = panelX + panelW + 36; // right panel inner start
  const textWidth = panelW - 56;
  const startY = panelY + 40;

  ctx.fillStyle = '#003d7a';
  ctx.font = '700 32px Inter, sans-serif';
  ctx.textAlign = 'left';
  wrapText(header, textWidth, 42, textX, startY);

  ctx.fillStyle = '#1d2b4b';
  ctx.font = '500 26px Inter, sans-serif';
  // draw justified message text
  drawJustifiedText(message, textWidth, 38, textX, startY + 90);

  ctx.fillStyle = '#003d7a';
  ctx.font = '600 24px Inter, sans-serif';
  const voiceY = panelY + panelH - 60;
  ctx.fillText('Mi voz cuenta', textX, voiceY);

  // fixed hashtags at the bottom center (two lines) — moved up
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f7b600';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText('#MeLaJuegoPorLaVida', 540, 860);
  ctx.fillText('#IvanCepedaPresidente', 540, 888);
  ctx.textAlign = 'left';
}

function generatePoster() {
  const name = nameInput.value.trim();
  const origin = originInput.value.trim();
  const cause = causeInput.value;
  const message = messageInput.value.trim();

  // allow preview without uploaded image (uses placeholder)
  if (!name) {
    // still draw preview so user can see layout while typing
    setStatus('Por favor ingresa tu nombre para la versión final.', true);
  }

  const header = getHeaderText(name, origin);
  const bodyMessage = getMessageText(message, cause);

  drawBackground();
  drawTemplate();
  drawImageCrop(uploadedImage);
  drawText(header, bodyMessage);

  if (uploadedImage) {
    setStatus('Imagen generada. Puedes descargarla o compartirla.', false);
  } else {
    setStatus('Vista previa (sin foto). Sube una foto para incluirla en la imagen final.', false);
  }
}

function updatePreview(image) {
  uploadedImage = image;
  generatePoster();
}

photoInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!isValidImage(file)) {
    setStatus('El archivo no es válido. Usa JPG, JPEG, PNG o WEBP y menos de 10 MB.', true);
    photoInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => updatePreview(img);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  // update UX: show thumbnail
  try {
    if (photoPreview) {
      const url = URL.createObjectURL(file);
      photoPreview.src = url;
      photoPreview.style.display = 'inline-block';
      // revoke after image loads
      photoPreview.onload = () => URL.revokeObjectURL(url);
    }
  } catch (e) {}
});

// Live preview: update poster as user types or changes fields
nameInput.addEventListener('input', () => generatePoster());
originInput.addEventListener('input', () => generatePoster());
causeInput.addEventListener('change', () => {
  setStatus('Actualizando vista previa según causa seleccionada...', false);
  const cause = causeInput.value;
  // If user has not entered a custom message, populate it with the cause message
  if (!messageInput.value.trim() && cause && causeMessages[cause]) {
    messageInput.value = causeMessages[cause];
  }
  generatePoster();
});
messageInput.addEventListener('input', () => generatePoster());

// photo action dropdown behavior
photoActionSelect.addEventListener('change', (e) => {
  const v = e.target.value;
  if (v === 'take') {
    startCamera();
  } else if (v === 'upload') {
    photoInput.click();
  } else if (v === 'remove') {
    uploadedImage = null;
    photoInput.value = '';
    if (photoPreview) { photoPreview.style.display = 'none'; photoPreview.src = ''; }
    generatePoster();
    setStatus('Foto eliminada.', false);
  }
  // reset dropdown to placeholder
  e.target.value = '';
});

// Camera capture handlers
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Este navegador no soporta captura por cámara.', true);
    return;
  }
  try {
    cameraStreamObj = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    cameraStream.srcObject = cameraStreamObj;
    cameraStream.style.display = 'block';
    captureWrapper.style.display = 'block';
    setStatus('Cámara activa. Pulsa Capturar para usar la foto.', false);
  } catch (err) {
    console.error(err);
    setStatus('No se pudo abrir la cámara. Comprueba permisos.', true);
  }
}

function stopCamera() {
  if (cameraStreamObj) {
    cameraStreamObj.getTracks().forEach((t) => t.stop());
    cameraStreamObj = null;
  }
  cameraStream.srcObject = null;
  cameraStream.style.display = 'none';
  captureWrapper.style.display = 'none';
  setStatus('Cámara detenida.', false);
}

function captureFromCamera() {
  try {
    const video = cameraStream;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(video, 0, 0, w, h);
    const dataUrl = tmp.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      updatePreview(img);
      setStatus('Foto capturada y aplicada.', false);
    };
    img.src = dataUrl;
    // stop camera after capture
    stopCamera();
  } catch (e) {
    console.error(e);
    setStatus('No se pudo capturar la foto.', true);
  }
}

captureBtn.addEventListener('click', captureFromCamera);
if (cancelCaptureBtn) cancelCaptureBtn.addEventListener('click', stopCamera);

supportForm.addEventListener('submit', (event) => {
  event.preventDefault();
  generatePoster();
});

downloadBtn.addEventListener('click', () => {
  const filename = `apoyo-cepeda-${Date.now()}.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = posterCanvas.toDataURL('image/png');
  link.click();
});

shareBtn.addEventListener('click', async () => {
  if (!navigator.canShare || !navigator.canShare({ files: [] })) {
    setStatus('Compartir no está disponible en este dispositivo. Descarga la imagen en su lugar.', true);
    return;
  }

  posterCanvas.toBlob(async (blob) => {
    if (!blob) {
      setStatus('No se pudo generar la imagen para compartir.', true);
      return;
    }

    const file = new File([blob], 'apoyo-cepeda.png', { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: 'Apoyo a Iván Cepeda', text: 'Genera tu imagen de apoyo ciudadano.' });
    } catch (error) {
      setStatus('Compartir cancelado o no soportado.', true);
    }
  }, 'image/png');
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.style.display = 'inline-flex';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    setStatus('Aplicación instalada correctamente.');
  } else {
    setStatus('Instalación cancelada.');
  }
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      console.warn('No se pudo registrar el service worker.');
    });
  });
}

setStatus('Carga una foto y completa los campos para ver la vista previa.');
