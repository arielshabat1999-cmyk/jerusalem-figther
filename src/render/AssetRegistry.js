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
// A sprite may instead be declared as its own standalone image, with no
// pre-declared "sheets" entry needed:
//   "<spriteKey>": { "file": "relative/path/to/frame.png",
//                     "anchorX":0.5, "anchorY":1, "refH": 144 }
// This is the drop-in path for a production pack that ships one runtime
// PNG per animation frame (art-pack rule: never crop/repack those files
// into a shared atlas) — each file is loaded as its own private sheet and
// drawn in full, exactly like any other sprite. `refH` is optional: the
// true on-screen character height to use for CHARACTER_SCALE normalization
// when the file itself is a padded fixed-size canvas (e.g. 256x256) whose
// pixel height isn't the actual character height — ArtAdapter falls back
// to the sprite's own height when refH is absent.
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

    const spriteEntries = Object.entries(manifest.sprites || {});
    const standaloneEntries = spriteEntries.filter(([, def]) => def.file);
    await Promise.all(
      standaloneEntries.map(([key, def]) =>
        this._loadSheet(this._standaloneSheetId(key), new URL(def.file, absManifestUrl).href).catch(() => {})
      )
    );

    for (const [key, def] of spriteEntries) {
      if (def.file) {
        const sheetId = this._standaloneSheetId(key);
        const img = this.sheets.get(sheetId);
        if (!img) continue; // this frame failed to load — skip, adapter falls back
        this.sprites.set(key, {
          sheet: sheetId,
          x: 0, y: 0, w: def.w ?? img.naturalWidth, h: def.h ?? img.naturalHeight,
          anchorX: def.anchorX ?? 0.5,
          anchorY: def.anchorY ?? 1,
          refH: def.refH,
        });
        continue;
      }
      if (!this.sheets.has(def.sheet)) continue; // sheet failed to load — skip, adapter falls back
      this.sprites.set(key, {
        sheet: def.sheet,
        x: def.x, y: def.y, w: def.w, h: def.h,
        anchorX: def.anchorX ?? 0.5,
        anchorY: def.anchorY ?? 1,
        refH: def.refH,
      });
    }
    for (const [key, def] of Object.entries(manifest.animations || {})) {
      const frames = (def.frames || []).filter((f) => this.sprites.has(f));
      if (frames.length) this.animations.set(key, { frames, fps: def.fps || 8, loop: def.loop !== false });
    }

    this.loaded = true;
    return this;
  }

  // Private sheet id for a standalone (`file`) sprite — namespaced so it can
  // never collide with an explicitly declared shared sheet id.
  _standaloneSheetId(spriteKey) {
    return `__frame__:${spriteKey}`;
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

  // Like getAnimationFrame, but the caller supplies the frame index
  // directly (as a float, floored here) instead of a wall-clock time -
  // used for walk/run so cadence tracks actual distance travelled rather
  // than elapsed time (see Player.gaitPhase).
  getAnimationFrameAtPhase(animKey, phase) {
    const anim = this.animations.get(animKey);
    if (!anim) return null;
    const frameIndex = Math.floor(phase);
    const n = anim.frames.length;
    const i = anim.loop ? ((frameIndex % n) + n) % n : Math.min(Math.max(frameIndex, 0), n - 1);
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
