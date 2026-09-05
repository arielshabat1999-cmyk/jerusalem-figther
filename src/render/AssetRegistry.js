// Central asset registry (art-pack README/manifest requirement: "Use an
// asset registry instead of hard-coded paths throughout gameplay systems").
// This is the ONLY place that knows about image files, sheet coordinates,
// or animation frame sequences. Nothing in physics/AI/entities ever touches
// it — only render/ArtAdapter.js does — so gameplay stays fully independent
// of art dimensions (spec section 33, art-pack integration rules).
//
// Manifest schema this registry consumes (see assets/art/manifest.json):
//   {
//     "sheets": { "<sheetId>": "relative/path/to/sheet.png", ... },
//     "sprites": {
//       "<spriteKey>": { "sheet": "<sheetId>", "x":0,"y":0,"w":0,"h":0,
//                         "anchorX":0.5, "anchorY":1 }
//     },
//     "animations": {
//       "<animKey>": { "frames": ["<spriteKey>", ...], "fps": 8, "loop": true }
//     }
//   }
//
// Sprite/animation key convention: "<actorId>.<animState>[.<frameIndex>]",
// e.g. "player_male.walk.2" / animation key "player_male.walk". This keeps
// ArtAdapter's lookups mechanical instead of hard-coding filenames.
export class AssetRegistry {
  constructor() {
    this.sheets = new Map(); // sheetId -> HTMLImageElement
    this.sprites = new Map(); // spriteKey -> {sheet, x,y,w,h, anchorX, anchorY}
    this.animations = new Map(); // animKey -> {frames:[spriteKey], fps, loop}
    this.loaded = false;
  }

  async loadManifest(url) {
    const absManifestUrl = new URL(url, document.baseURI).href;
    let manifest;
    try {
      const res = await fetch(absManifestUrl);
      manifest = res.ok ? await res.json() : { sheets: {}, sprites: {}, animations: {} };
    } catch {
      manifest = { sheets: {}, sprites: {}, animations: {} };
    }

    const sheetEntries = Object.entries(manifest.sheets || {});
    await Promise.all(
      sheetEntries.map(([id, path]) => this._loadSheet(id, new URL(path, absManifestUrl).href).catch(() => {}))
    );

    for (const [key, def] of Object.entries(manifest.sprites || {})) {
      if (!this.sheets.has(def.sheet)) continue; // sheet failed to load — skip, adapter falls back
      this.sprites.set(key, {
        sheet: def.sheet,
        x: def.x, y: def.y, w: def.w, h: def.h,
        anchorX: def.anchorX ?? 0.5,
        anchorY: def.anchorY ?? 1,
      });
    }
    for (const [key, def] of Object.entries(manifest.animations || {})) {
      const frames = (def.frames || []).filter((f) => this.sprites.has(f));
      if (frames.length) this.animations.set(key, { frames, fps: def.fps || 8, loop: def.loop !== false });
    }

    this.loaded = true;
    return this;
  }

  async _loadSheet(id, href) {
    const img = new Image();
    img.decoding = 'async';
    img.src = href;
    await img.decode();
    this.sheets.set(id, img);
  }

  hasAnimation(animKey) {
    return this.animations.has(animKey);
  }

  hasSprite(spriteKey) {
    return this.sprites.has(spriteKey);
  }

  // Returns the sprite to draw for `animKey` at `timeSec` (looping or
  // clamped to the last frame), or null if that animation isn't loaded —
  // callers must fall back to the placeholder adapter in that case.
  getAnimationFrame(animKey, timeSec) {
    const anim = this.animations.get(animKey);
    if (!anim) return null;
    const frameIndex = Math.floor(timeSec * anim.fps);
    const i = anim.loop ? frameIndex % anim.frames.length : Math.min(frameIndex, anim.frames.length - 1);
    return this.getSprite(anim.frames[i]);
  }

  getSprite(spriteKey) {
    const sprite = this.sprites.get(spriteKey);
    if (!sprite) return null;
    const sheet = this.sheets.get(sprite.sheet);
    if (!sheet) return null;
    return { image: sheet, ...sprite };
  }
}
