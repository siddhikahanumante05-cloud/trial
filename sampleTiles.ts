/**
 * Generates realistic synthetic 256x256 Sentinel-2 RGB tile crops for demo tiles.
 * Sentinel-2 imagery has 10m GSD, meaning a typical 25m x 70m kiln is ~3-7 pixels wide and ~7-10 pixels long.
 * These canvas-generated textures simulate agricultural fields, irrigation canals, soil patches, and kiln pits.
 */

export function generateTileImageDataUrl(tileId: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Base terrain: dusty alluvial soil and dry agricultural patchwork (Indo-Gangetic Plain tones)
  ctx.fillStyle = '#b7a284';
  ctx.fillRect(0, 0, 256, 256);

  // Field patches
  const fields = [
    { x: 0, y: 0, w: 110, h: 130, color: '#9d8869' },
    { x: 110, y: 0, w: 146, h: 90, color: '#8e795c' },
    { x: 110, y: 90, w: 146, h: 100, color: '#a79577' },
    { x: 0, y: 130, w: 120, h: 126, color: '#7a6a52' },
    { x: 120, y: 190, w: 136, h: 66, color: '#8b7c62' },
  ];

  fields.forEach((f) => {
    ctx.fillStyle = f.color;
    ctx.fillRect(f.x, f.y, f.w, f.h);
  });

  // Subtle field boundary lines
  ctx.strokeStyle = 'rgba(70, 55, 40, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(110, 0);
  ctx.lineTo(110, 256);
  ctx.moveTo(0, 130);
  ctx.lineTo(256, 130);
  ctx.stroke();

  // Dirt track / canal
  ctx.strokeStyle = 'rgba(190, 175, 150, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(10, 250);
  ctx.quadraticCurveTo(120, 150, 245, 10);
  ctx.stroke();

  // Synthetic brick kiln earthworks (excavated trench, reddish brick firing dust, chimney shadow)
  if (tileId === 'tile_042') {
    drawKilnMark(ctx, 75, 95, 30, 16, 32, '#c25e40'); // Oval FCBK
    drawKilnMark(ctx, 165, 140, 28, 15, 75, '#c25e40'); // Oval FCBK
    drawKilnMark(ctx, 195, 205, 22, 22, 0, '#825970', true); // Circular CFCBK
  } else if (tileId === 'tile_088') {
    drawKilnMark(ctx, 80, 85, 32, 18, 120, '#c25e40');
    drawKilnMark(ctx, 150, 95, 28, 16, 80, '#367b73'); // Rectangular Zigzag
    drawKilnMark(ctx, 130, 180, 29, 17, 135, '#c25e40');
    drawKilnMark(ctx, 190, 170, 24, 24, 0, '#825970', true);
  } else {
    // tile_104 / general
    drawKilnMark(ctx, 90, 110, 30, 16, 95, '#367b73');
    drawKilnMark(ctx, 170, 120, 28, 17, 20, '#c25e40');
    drawKilnMark(ctx, 140, 190, 31, 16, 85, '#c25e40');
  }

  // Add subtle 10m pixel grid texture (Sentinel-2 10m GSD feel)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  for (let x = 0; x < 256; x += 8) {
    ctx.fillRect(x, 0, 1, 256);
  }
  for (let y = 0; y < 256; y += 8) {
    ctx.fillRect(0, y, 256, 1);
  }

  return canvas.toDataURL('image/png');
}

function drawKilnMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  len: number,
  wid: number,
  angleDeg: number,
  color: string,
  isCircular = false
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);

  // Outer excavated trench halo
  ctx.fillStyle = 'rgba(60, 40, 25, 0.4)';
  if (isCircular) {
    ctx.beginPath();
    ctx.arc(0, 0, len / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-len / 2 - 3, -wid / 2 - 3, len + 6, wid + 6);
  }

  // Kiln brick ring
  ctx.fillStyle = color;
  if (isCircular) {
    ctx.beginPath();
    ctx.arc(0, 0, len / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-len / 2, -wid / 2, len, wid);
  }

  // Inner trench hollow
  ctx.fillStyle = '#654e38';
  if (isCircular) {
    ctx.beginPath();
    ctx.arc(0, 0, len / 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-len / 3, -wid / 4, (len * 2) / 3, wid / 2);
  }

  // Center chimney dot & shadow
  ctx.fillStyle = '#1e140d';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Shadow cast northwest
  ctx.strokeStyle = 'rgba(20, 15, 10, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7, -7);
  ctx.stroke();

  ctx.restore();
}
