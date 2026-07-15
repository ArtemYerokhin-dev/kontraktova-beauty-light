// Renders a booking confirmation as a PNG "ticket" via Canvas 2D — no extra
// dependency needed, and a plain image is the most frictionless thing to
// save to Photos/Gallery on both iOS and Android (one tap, no "open with").

const WIDTH = 960;
const HEIGHT = 1280;
const PADDING = 64;

const COLORS = {
  bg: '#FBF6F8',
  card: '#FFFFFF',
  ink: '#241A20',
  dim: 'rgba(36,26,32,0.5)',
  accent: '#E91E8C',
  divider: 'rgba(36,26,32,0.12)',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRow(ctx, label, value, y) {
  ctx.font = '28px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.textAlign = 'left';
  ctx.fillText(label, PADDING + 48, y);

  ctx.font = '600 30px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'right';
  ctx.fillText(value, WIDTH - PADDING - 48, y);
}

export function buildTicketCanvas(booking) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // card
  roundRect(ctx, PADDING, PADDING, WIDTH - PADDING * 2, HEIGHT - PADDING * 2, 32);
  ctx.fillStyle = COLORS.card;
  ctx.fill();

  // brand + checkmark
  ctx.textAlign = 'left';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText('KONTRAKTOVA BEAUTY', PADDING + 48, PADDING + 80);

  ctx.font = '64px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText('✓', PADDING + 48, PADDING + 170);

  ctx.font = '600 46px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.ink;
  ctx.fillText('Вас записано!', PADDING + 48, PADDING + 240);

  // divider
  ctx.strokeStyle = COLORS.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING + 48, PADDING + 290);
  ctx.lineTo(WIDTH - PADDING - 48, PADDING + 290);
  ctx.stroke();

  // details
  const rows = [
    ['Послуга', booking.serviceName],
    ['Майстер', booking.masterName],
    ['Дата', booking.dateLabel],
    ['Час', `${booking.startTime}–${booking.endTime}`],
    ["Ім'я", booking.clientName],
    ['Телефон', booking.clientPhone],
  ];
  let y = PADDING + 370;
  for (const [label, value] of rows) {
    drawRow(ctx, label, value, y);
    y += 78;
  }

  // dashed separator (ticket-stub look)
  y += 10;
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = COLORS.divider;
  ctx.beginPath();
  ctx.moveTo(PADDING + 48, y);
  ctx.lineTo(WIDTH - PADDING - 48, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // footer note
  ctx.font = '24px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.textAlign = 'center';
  wrapText(
    ctx,
    'Покажіть цей квиток адміністратору при відвідуванні. Чекаємо на вас!',
    WIDTH / 2,
    y + 60,
    WIDTH - (PADDING + 48) * 2,
    36
  );

  return canvas;
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}

export function downloadTicketPng(booking) {
  const canvas = buildTicketCanvas(booking);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kontraktova-beauty-квиток.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
