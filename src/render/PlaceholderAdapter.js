// Pure placeholder shapes (spec section 1/36: temporary geometric visuals
// are fine, final art is explicitly out of scope). Every draw function only
// reads an entity's LOGICAL bounds (x/y/w/h) — swapping this module for a
// real sprite-based adapter later should require no changes anywhere else.
const SKY_GRADIENTS = {
  day: ['#7ec6e8', '#dcd0ad'],
  sunset: ['#e8926a', '#f2c98f'],
  night: ['#1a2438', '#3a3f5c'],
};

export const PlaceholderAdapter = {
  drawBackground(ctx, cam, viewportWidth, viewportHeight, lightingState) {
    const [top, bottom] = SKY_GRADIENTS[lightingState] || SKY_GRADIENTS.day;
    const sky = ctx.createLinearGradient(0, 0, 0, viewportHeight);
    sky.addColorStop(0, top);
    sky.addColorStop(1, bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  },

  drawSolid(ctx, s, cam) {
    ctx.fillStyle = s.y < 0 ? '#5b4636' : '#8a7357';
    ctx.fillRect(s.x - cam.x, s.y - cam.y, s.w, Math.min(s.h, 900));
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.strokeRect(s.x - cam.x, s.y - cam.y, s.w, Math.min(s.h, 900));
  },

  drawStair(ctx, stair, cam) {
    ctx.fillStyle = '#b8a06a';
    ctx.beginPath();
    ctx.moveTo(stair.x - cam.x, stair.yAtX0 - cam.y);
    ctx.lineTo(stair.x + stair.w - cam.x, stair.yAtX1 - cam.y);
    ctx.lineTo(stair.x + stair.w - cam.x, stair.yAtX1 - cam.y + 16);
    ctx.lineTo(stair.x - cam.x, stair.yAtX0 - cam.y + 16);
    ctx.closePath();
    ctx.fill();
  },

  drawDoor(ctx, door, cam, label) {
    const w = 40;
    const h = 90;
    const x = door.x - w / 2 - cam.x;
    const y = door.floorY - h - cam.y;
    ctx.fillStyle = door.open ? '#2f6f4f' : '#5a3a2a';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y - 4);
  },

  drawMarkerDoor(ctx, x, floorY, cam, label, color) {
    const w = 40;
    const h = 90;
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2 - cam.x, floorY - h - cam.y, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x - cam.x, floorY - h - cam.y - 4);
  },

  drawCrate(ctx, crate, cam) {
    ctx.fillStyle = '#a06a34';
    ctx.fillRect(crate.x - cam.x, crate.y - cam.y, crate.w, crate.h);
    ctx.strokeStyle = '#5a3a1a';
    ctx.strokeRect(crate.x - cam.x, crate.y - cam.y, crate.w, crate.h);
  },

  drawCoin(ctx, coin, cam) {
    ctx.fillStyle = '#f0c93d';
    ctx.beginPath();
    ctx.arc(coin.x - cam.x, coin.y - cam.y, 6, 0, Math.PI * 2);
    ctx.fill();
  },

  drawProjectile(ctx, p, cam) {
    ctx.fillStyle = p.faction === 'player' ? '#ffe25e' : '#ff5e5e';
    ctx.fillRect(p.x - cam.x - 4, p.y - cam.y - 2, p.isExplosive ? 10 : 8, 4);
  },

  drawPlayer(ctx, player, cam) {
    const x = player.x - cam.x;
    const y = player.y - cam.y;
    ctx.fillStyle = player.invulnTimer > 0 && Math.floor(player.invulnTimer * 20) % 2 === 0 ? 'rgba(60,140,220,0.4)' : '#3c8cdc';
    ctx.fillRect(x, y, player.w, player.h);
    ctx.fillStyle = '#1c1c1c';
    const eyeX = player.facingDir > 0 ? x + player.w - 5 : x + 2;
    ctx.fillRect(eyeX, y + 6, 3, 3);
    drawHealthBar(ctx, x - 5, y - 12, player.w + 10, player.health / player.maxHealth, player.shield / (player.maxShield || 1));
  },

  drawEnemy(ctx, enemy, cam) {
    const x = enemy.x - cam.x;
    const y = enemy.y - cam.y;
    if (enemy.dead) {
      ctx.fillStyle = '#555';
      ctx.fillRect(x, y + enemy.h * 0.6, enemy.h, enemy.w * 0.6);
      return;
    }
    ctx.fillStyle = enemy.kind === 'melee' ? (enemy.strong ? '#8a1f1f' : '#b23b3b') : enemy.strong ? '#1f4f8a' : '#3b7bb2';
    ctx.fillRect(x, y, enemy.w, enemy.h);
    ctx.fillStyle = '#1c1c1c';
    const eyeX = enemy.facingDir > 0 ? x + enemy.w - 5 : x + 2;
    ctx.fillRect(eyeX, y + 6, 3, 3);
    drawHealthBar(ctx, x - 4, y - 10, enemy.w + 8, enemy.hp / enemy.maxHp, 0);
  },

  drawExplosion(ctx, x, y, radius, cam) {
    ctx.fillStyle = 'rgba(255,150,40,0.5)';
    ctx.beginPath();
    ctx.arc(x - cam.x, y - cam.y, radius, 0, Math.PI * 2);
    ctx.fill();
  },
};

function drawHealthBar(ctx, x, y, w, healthPct, shieldPct) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x, y, w * Math.max(0, healthPct), 4);
  if (shieldPct > 0) {
    ctx.fillStyle = '#5ec8ff';
    ctx.fillRect(x, y - 3, w * Math.max(0, shieldPct), 2);
  }
}
