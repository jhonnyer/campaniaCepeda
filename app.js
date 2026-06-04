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
let uploadedImage = null;
let deferredPrompt = null;

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
  ctx.fillRect(48, 48, 984, 984);

  ctx.fillStyle = '#002f6c';
  ctx.fillRect(48, 48, 984, 156);
  ctx.fillStyle = '#f7b600';
  ctx.fillRect(48, 156, 984, 18);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 46px Inter, sans-serif';
  ctx.fillText('Apoyo ciudadano', 84, 110);
  ctx.font = '500 30px Inter, sans-serif';
  ctx.fillText('Iván Cepeda - Presidencia', 84, 150);

  ctx.fillStyle = '#f2f5fb';
  ctx.fillRect(84, 220, 420, 560);
  ctx.strokeStyle = '#d8e2f5';
  ctx.lineWidth = 2;
  ctx.strokeRect(84, 220, 420, 560);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(540, 220, 420, 560);
  ctx.strokeStyle = '#d8e2f5';
  ctx.strokeRect(540, 220, 420, 560);

  ctx.fillStyle = '#003d7a';
  ctx.font = '600 24px Inter, sans-serif';
  ctx.fillText('Mensaje de apoyo', 560, 280);
}

function drawImageCrop(img) {
  const x = 100;
  const y = 260;
  const w = 380;
  const h = 520;

  if (!img) {
    drawPlaceholderImage(x, y, w, h);
    return;
  }

  const ratio = Math.min(img.width / w, img.height / h);
  const sw = w * ratio;
  const sh = h * ratio;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
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

function drawText(header, message) {
  const textX = 560;
  const textWidth = 380;
  const startY = 320;

  ctx.fillStyle = '#003d7a';
  ctx.font = '700 32px Inter, sans-serif';
  ctx.textAlign = 'left';
  wrapText(header, textWidth, 42, textX, startY);

  ctx.fillStyle = '#1d2b4b';
  ctx.font = '500 26px Inter, sans-serif';
  wrapText(message, textWidth, 38, textX, startY + 90);

  ctx.fillStyle = '#003d7a';
  ctx.font = '600 24px Inter, sans-serif';
  ctx.fillText('Mi voz cuenta', textX, 740);
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
