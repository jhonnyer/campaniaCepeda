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
const copyHashtagsBtn = document.getElementById('copyHashtagsBtn');
const generatedCountEl = document.getElementById('generatedCount');
const downloadCountEl = document.getElementById('downloadCount');
const installBtn = document.getElementById('installBtn');
// photo action controls
const photoActionSelect = document.getElementById('photoActionSelect');
const photoPreview = document.getElementById('photoPreview');
const cameraStream = document.getElementById('cameraStream');
const captureBtn = document.getElementById('captureBtn');
const cancelCaptureBtn = document.getElementById('cancelCaptureBtn');
const captureWrapper = document.getElementById('captureWrapper');
const causePreview = document.getElementById('causePreview');
let uploadedImage = null;
let deferredPrompt = null;
let cameraStreamObj = null;
const FIXED_HASHTAG = '#MiVozCuenta';
let generatedCount = 0;
let downloadCount = 0;
let causeMessages = {};
let causeDefinitions = [];
// fixed header logo (use cepeda.jpg placed at project root)
let campaignLogo = new Image();
campaignLogo.src = 'img/cepeda.jpg';
campaignLogo.onload = () => { try { generatePoster(); } catch (e) {} };

// fallback photo when no upload exists
let fallbackPhoto = new Image();
fallbackPhoto.src = 'img/cepeda_fondo.jpg';
fallbackPhoto.onload = () => { try { generatePoster(); } catch (e) {} };

const defaultMessages = [
  'Creo en una Colombia donde la paz, la justicia social y las oportunidades lleguen a todos los territorios. Por eso apoyo a Iván Cepeda.',
  'Sueño con una Colombia donde nuestras diferencias no nos dividan y donde todos tengamos oportunidades para construir un mejor futuro. Por eso apoyo a Iván Cepeda.',
  'Creo que es posible construir un país más justo, más humano y con oportunidades para todos. Por eso apoyo a Iván Cepeda.'
];

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

function populateCauseSelect() {
  if (!causeInput) return;
  const currentValue = causeInput.value;
  const options = causeDefinitions.map((item) => {
    const selected = item.value === currentValue ? ' selected' : '';
    return `<option value="${item.value}"${selected}>${item.label}</option>`;
  });
  causeInput.innerHTML = options.join('');
}

function updateCausePreview(cause) {
  if (!causePreview) return;
  if (causeMessages[cause]) {
    causePreview.textContent = `Sugerencia: ${causeMessages[cause]}`;
  } else {
    causePreview.textContent = 'Selecciona una causa para ver un mensaje sugerido más llamativo.';
  }
}

function loadCounters() {
  generatedCount = parseInt(localStorage.getItem('generatedCount') || '0', 10);
  downloadCount = parseInt(localStorage.getItem('downloadCount') || '0', 10);
  updateCounterDisplay();
}

function saveCounters() {
  localStorage.setItem('generatedCount', generatedCount.toString());
  localStorage.setItem('downloadCount', downloadCount.toString());
}

function updateCounterDisplay() {
  if (generatedCountEl) {
    generatedCountEl.textContent = `Imágenes generadas: ${generatedCount}`;
  }
  if (downloadCountEl) {
    downloadCountEl.textContent = `Descargas: ${downloadCount}`;
  }
}

function isCauseMessage(text) {
  if (!text) return false;
  return Object.values(causeMessages).some((msg) => msg === text.trim());
}

async function loadCauseDefinitions() {
  try {
    const response = await fetch('causes.json');
    if (!response.ok) throw new Error('No se pudo cargar causes.json');
    const data = await response.json();
    causeDefinitions = Array.isArray(data.causes) ? data.causes : [];
  } catch (error) {
    console.warn('No se pudo cargar causes.json, usando textos internos.', error);
    causeDefinitions = [
      { value: '', label: 'Ninguna', message: 'Quiero participar con mi voz y apoyar a Iván Cepeda porque creo en un país más unido y con oportunidades para todos.' },
      { value: 'Paz', label: 'Paz', message: '¡Quiero una Colombia en paz, sin violencia ni miedo, donde la esperanza sea para todos! Apoyo a Iván Cepeda.' },
      { value: 'Educación', label: 'Educación', message: 'La educación debe abrir puertas y transformar vidas. Apoyo a Iván Cepeda para que esto sea una realidad en todo el país.' },
      { value: 'Salud', label: 'Salud', message: 'La salud es un derecho, no un privilegio. Apoyo a Iván Cepeda para que la atención llegue a todas las familias.' },
      { value: 'Juventud', label: 'Juventud', message: 'Los jóvenes somos el futuro y merecemos oportunidades reales para estudiar, trabajar y soñar. Apoyo a Iván Cepeda.' },
      { value: 'Campo', label: 'Campo', message: 'El campo necesita inversión, respeto y justicia. Apoyo a quienes trabajan por una Colombia rural más fuerte.' },
      { value: 'Empleo', label: 'Empleo', message: 'Trabajo digno y oportunidades para todos. Apoyo a Iván Cepeda para que el empleo sea una realidad con derechos.' },
      { value: 'Derechos Humanos', label: 'Derechos Humanos', message: 'La dignidad y los derechos humanos deben protegerse en cada territorio. Apoyo a Iván Cepeda para defender la vida.' },
      { value: 'Justicia Social', label: 'Justicia Social', message: 'La justicia social es urgente y no puede esperar. Quiero un país más equitativo para todas y todos.' },
      { value: 'Medio Ambiente', label: 'Medio Ambiente', message: 'Cuidar la naturaleza es cuidar nuestro futuro. Apoyo políticas que protejan ríos, bosques y comunidades.' }
    ];
  }

  const hasNone = causeDefinitions.some((item) => item.value === '');
  if (!hasNone) {
    causeDefinitions.unshift({ value: '', label: 'Ninguna', message: 'Quiero participar con mi voz y apoyar a Iván Cepeda porque creo en un país más unido y con oportunidades para todos.' });
  }

  causeMessages = causeDefinitions.reduce((acc, item) => {
    acc[item.value] = item.message;
    return acc;
  }, {});

  populateCauseSelect();
  updateCausePreview(causeInput.value);
}

function drawBackground() {
  // lighter, softer background similar to candidate card
  const g = ctx.createLinearGradient(0, 0, 1080, 1080);
  g.addColorStop(0, '#f6fbff'); // very light blue
  g.addColorStop(0.6, '#fff7ec'); // soft peach
  g.addColorStop(1, '#fffaf0'); // warm cream
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1080);

  // subtle decorative overlay for texture (very light)
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(540, 220 + i * 180, 360 - i * 50, 0, Math.PI * 2);
    ctx.fill();
  }

  // soft border
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 1056, 1056);
}

function drawTemplate() {
  const topCardX = 60;
  const topCardY = 40;
  const topCardW = 960; // wider candidate card to show faces more
  const topCardH = 520; // taller so faces are more visible
  const bottomY = topCardY + topCardH + 20;
  const leftCardX = 60;
  const leftCardW = 480; // make bottom cards the same width
  const leftCardH = 480; // and same height
  const rightCardX = leftCardX + leftCardW + 20;
  const rightCardW = 480;
  const rightCardH = leftCardH;

  // top candidate image card
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 12;
  ctx.roundRect(topCardX, topCardY, topCardW, topCardH, 34);
  ctx.fill();
  ctx.restore();

  // remove top card border (clean look)
  ctx.strokeStyle = 'rgba(0,0,0,0)';
  ctx.lineWidth = 0;
  // ctx.roundRect(topCardX, topCardY, topCardW, topCardH, 34); ctx.stroke();

  if (campaignLogo && campaignLogo.complete && campaignLogo.width && campaignLogo.height) {
    try {
      const cropX = topCardX + 12;
      const cropY = topCardY + 12;
      const cropW = topCardW - 24;
      const cropH = topCardH - 24;
      const scale = Math.max(cropW / campaignLogo.width, cropH / campaignLogo.height);
      const sw = Math.round(cropW / scale);
      const sh = Math.round(cropH / scale);
      let sx = Math.round((campaignLogo.width - sw) / 2);
      let sy = Math.round((campaignLogo.height - sh) / 2);
      // nudge crop slightly up to favor faces in many photos
      sy = Math.max(0, sy - Math.round(sh * 0.08));
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cropX, cropY, cropW, cropH, 28);
      ctx.clip();
      ctx.drawImage(campaignLogo, sx, sy, sw, sh, cropX, cropY, cropW, cropH);
      ctx.restore();
    } catch (e) {
      // fallback: empty top card
    }
  }

  // bottom left photo card
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 9;
  ctx.roundRect(leftCardX, bottomY, leftCardW, leftCardH, 32);
  ctx.fill();
  ctx.restore();

  // remove left bottom card border
  ctx.strokeStyle = 'rgba(0,0,0,0)';
  ctx.lineWidth = 0;
  // ctx.roundRect(leftCardX, bottomY, leftCardW, leftCardH, 32); ctx.stroke();

  // bottom right text card
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.roundRect(rightCardX, bottomY, rightCardW, rightCardH, 32);
  ctx.fill();
  ctx.restore();

  // remove right bottom card border
  ctx.strokeStyle = 'rgba(0,0,0,0)';
  ctx.lineWidth = 0;
  // ctx.roundRect(rightCardX, bottomY, rightCardW, rightCardH, 32); ctx.stroke();

  // no 'Mensaje de apoyo' text as requested
}

// draw decorative heart and stars around the top candidate card
function drawDecorations() {
  const topCardX = 60;
  const topCardY = 40;
  const topCardW = 960;
  const topCardH = 480;

  // helper: draw a star at x,y
  function drawStar(cx, cy, spikes, outerRadius, innerRadius, color, rotation = 0) {
    let rot = Math.PI / 2 * 3 + rotation;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i += 1) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // helper: draw a heart centered at x,y
  function drawHeart(cx, cy, size, color) {
    ctx.save();
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(cx, cy + topCurveHeight);
    ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + topCurveHeight);
    ctx.bezierCurveTo(cx - size / 2, cy + (size + topCurveHeight) / 2, cx, cy + (size + topCurveHeight) / 1.1, cx, cy + size);
    ctx.bezierCurveTo(cx, cy + (size + topCurveHeight) / 1.1, cx + size / 2, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + topCurveHeight);
    ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + topCurveHeight);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // place one heart near top-right corner of the card
  const heartX = topCardX + topCardW - 66;
  const heartY = topCardY + 58;
  drawHeart(heartX, heartY, 38, '#ef4444'); // red heart

  // scatter stars around the edges of the top card, outside the frame
  const starColors = ['#f59e0b', '#1d4ed8', '#06b6d4', '#fff176'];
  const starPositions = [
    { x: topCardX - 24, y: topCardY + 40 },
    { x: topCardX - 18, y: topCardY + 160 },
    { x: topCardX + topCardW + 18, y: topCardY + 80 },
    { x: topCardX + topCardW + 24, y: topCardY + 220 },
    { x: topCardX + 140, y: topCardY - 24 },
    { x: topCardX + 360, y: topCardY - 28 },
    { x: topCardX + topCardW - 180, y: topCardY - 24 },
    { x: topCardX + topCardW + 24, y: topCardY + topCardH - 60 }
  ];
  starPositions.forEach((pos) => {
    const outer = 9 + Math.random() * 8;
    const inner = outer * 0.5;
    const spikes = 5;
    const color = starColors[Math.floor(Math.random() * starColors.length)];
    drawStar(pos.x, pos.y, spikes, outer, inner, color, Math.random() * Math.PI);
  });

  // add small stars around the user photo card outer edges
  const leftCardX = 60;
  const leftCardY = 580;
  const leftCardW = 480;
  const leftCardH = 480;
  const photoPositions = [
    { x: leftCardX - 18, y: leftCardY + 100 },
    { x: leftCardX + 80, y: leftCardY + leftCardH + 14 },
    { x: leftCardX + leftCardW + 18, y: leftCardY + 220 },
    { x: leftCardX + leftCardW + 10, y: leftCardY + leftCardH - 80 },
    { x: leftCardX + leftCardW + 48, y: leftCardY + leftCardH + 28 },
    { x: leftCardX + leftCardW + 32, y: leftCardY + 28 }
  ];
  photoPositions.forEach((pos) => {
    const outer = 6 + Math.random() * 6;
    const inner = outer * 0.5;
    const spikes = 5;
    const color = starColors[Math.floor(Math.random() * starColors.length)];
    drawStar(pos.x, pos.y, spikes, outer, inner, color, Math.random() * Math.PI);
  });

  // add hearts and stars around the right bottom text card
  const rightCardX = 560;
  const rightCardY = 580;
  const rightCardW = 480;
  const rightCardH = 480;
  const bottomDecor = [
    { x: rightCardX + rightCardW + 18, y: rightCardY + 60, type: 'star' },
    { x: rightCardX + rightCardW + 20, y: rightCardY + 180, type: 'heart' },
    { x: rightCardX + rightCardW + 40, y: rightCardY + 320, type: 'star' },
    { x: rightCardX + 70, y: rightCardY + rightCardH + 18, type: 'star' },
    { x: rightCardX + rightCardW - 90, y: rightCardY + rightCardH + 28, type: 'heart' }
  ];
  bottomDecor.forEach((item) => {
    if (item.type === 'heart') {
      drawHeart(item.x, item.y, 24, '#ef4444');
    } else {
      const outer = 8 + Math.random() * 6;
      const inner = outer * 0.5;
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      drawStar(item.x, item.y, 5, outer, inner, color, Math.random() * Math.PI);
    }
  });
}

function drawImageCrop(img) {
  // image area sits inside the left bottom card with consistent padding
  const panelX = 60;
  const panelY = 580; // aligned with bottomY from template
  const pad = 20;
  const x = panelX + pad;
  const y = panelY + pad;
  const w = 480 - pad * 2;
  const h = 480 - pad * 2;

  const imageToDraw = img || (fallbackPhoto.complete ? fallbackPhoto : null);
  if (!imageToDraw) {
    drawPlaceholderImage(x, y, w, h);
    return;
  }
  // draw framed photo with shadow and cover-fit crop for a more attractive look
  const framePad = 12;
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
  const scale = Math.max(w / imageToDraw.width, h / imageToDraw.height);
  const sw = Math.round(w / scale);
  const sh = Math.round(h / scale);
  const sx = Math.round((imageToDraw.width - sw) / 2);
  const sy = Math.round((imageToDraw.height - sh) / 2);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.clip();
  ctx.drawImage(imageToDraw, sx, sy, sw, sh, x, y, w, h);
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

  return y + lineHeight;
}

// Draw justified text: distribute extra space between words for each full line
function drawJustifiedText(text, maxWidth, lineHeight, startX, startY, maxHeight) {
  const words = text.split(' ');
  let line = [];
  let y = startY;
  const limitY = maxHeight ? startY + maxHeight : Infinity;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const testLine = line.length ? line.join(' ') + ' ' + word : word;
    const { width: testWidth } = ctx.measureText(testLine);
    if (testWidth > maxWidth && line.length) {
      if (y > limitY) break;
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

  if (line.length && y <= limitY) {
    ctx.fillText(line.join(' '), startX, y);
    y += lineHeight;
  }

  return y;
}

function drawText(header, message) {
  const panelX = 560; // right card X (left 60 + leftCardW 480 + 20 gap)
  const panelW = 480;
  const panelH = 480;
  const panelY = 580;
  const textX = panelX + 36; // right panel inner start
  const textWidth = panelW - 56;
  const startY = panelY + 44;

  // split header into label and name/origin
  const fullHeader = header || '';
  const namePart = fullHeader.replace(/^Me llamo\s*/i, '').replace(/\.+$/, '');

  // label and name same size, name in blue
  ctx.textAlign = 'left';
  ctx.font = '800 34px Inter, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Me llamo', textX, startY);

  ctx.fillStyle = '#1d4ed8';
  const nameStartY = startY + 38;
  const nameEndY = wrapText(namePart, textWidth, 40, textX, nameStartY);

  ctx.fillStyle = '#24346f';
  ctx.font = '500 26px Inter, sans-serif';
  const bodyY = nameEndY + 14;
  const voiceY = panelY + panelH - 96;
  const availableBodyHeight = voiceY - bodyY - 8;
  drawJustifiedText(message, textWidth, 34, textX, bodyY, availableBodyHeight);

  // fixed hashtags at the bottom of the right panel (larger)
  const hashtagX = panelX + panelW / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1d4ed8';
  ctx.font = '800 26px Inter, sans-serif';
  ctx.fillText('#MeLaJuegoPorLaVida', hashtagX, panelY + panelH - 80);
  ctx.fillStyle = '#f97316';
  ctx.fillText('#IvanCepedaPresidente', hashtagX, panelY + panelH - 48);
  ctx.fillStyle = '#0f1724';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText('#AidaQuilcuéVicepresidente', hashtagX, panelY + panelH - 20);
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
  drawDecorations();
  drawImageCrop(uploadedImage);
  drawText(header, bodyMessage);

  if (uploadedImage) {
    setStatus('Imagen generada. Puedes descargarla o compartirla.', false);
  } else {
    setStatus('Imagen generada con imagen por defecto. Sube tu foto para personalizarla.', false);
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
  const currentText = messageInput.value.trim();
  if (causeMessages[cause]) {
    if (!currentText || isCauseMessage(currentText)) {
      messageInput.value = causeMessages[cause];
    }
  }
  updateCausePreview(cause);
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
  generatedCount += 1;
  saveCounters();
  updateCounterDisplay();
  generatePoster();
});

downloadBtn.addEventListener('click', () => {
  const filename = `apoyo-cepeda-${Date.now()}.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = posterCanvas.toDataURL('image/png');
  link.click();
  downloadCount += 1;
  saveCounters();
  updateCounterDisplay();
});

if (copyHashtagsBtn) {
  copyHashtagsBtn.addEventListener('click', async () => {
    const hashtags = '#MeLaJuegoPorLaVida #IvanCepedaPresidente #AidaQuilcuéVicepresidente';
    try {
      await navigator.clipboard.writeText(hashtags);
      setStatus('Hashtags copiados al portapapeles.');
    } catch (error) {
      console.error(error);
      setStatus('No se pudo copiar los hashtags. Intenta de nuevo.', true);
    }
  });
}

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

loadCauseDefinitions().then(() => {
  loadCounters();
  setStatus('Carga una foto y completa los campos para ver la vista previa.');
  generatePoster();
}).catch(() => {
  loadCounters();
  setStatus('Carga una foto y completa los campos para ver la vista previa.');
  generatePoster();
});
