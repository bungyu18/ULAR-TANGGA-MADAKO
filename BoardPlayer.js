// boardplayer.js

// Warna default kalau tidak diberikan
const DEFAULT_COLORS = ["#e53935", "#1e88e5", "#8e24aa", "#43a047", "#fb8c00"];

/**
 * Representasi pemain.
 * - name: nama pemain
 * - color: warna token (hex/css color)
 * - position: posisi sekarang (default 0 → sebelum start). 
 *   Jika papanmu mulai dari 1, set startCell: 1 di constructor.
 * - score: opsional, kalau mau dipakai.
 */
export class Player {
  /**
   * @param {string} name
   * @param {object} opts
   *  - color?: string
   *  - startCell?: number  (default 0; pakai 1 kalau papanmu mulai dari 1)
   *  - id?: string|number
   *  - avatar?: string (opsional, kalau mau tampilkan gambar token)
   */
  constructor(name, opts = {}) {
    const {
      color,
      startCell = 0,     // ganti ke 1 kalau kamu ingin mulai di sel 1
      id = cryptoRandomId(),
      avatar = null,
    } = opts;

    this.id = id;
    this.name = name;
    this.color = color || pickColorById(id);
    this.position = startCell;
    this.score = 0;
    this.avatar = avatar;
    this.history = []; // simpan jejak langkah jika perlu
  }

  /** Tambahkan skor (opsional) */
  addScore(points = 1) {
    this.score += points;
  }

  /** Pindahkan absolut ke posisi tertentu (dibatasi 0..boardSize) */
  setPosition(pos, boardSize = null) {
    let target = Number(pos) || 0;
    if (boardSize) {
      target = Math.max(0, Math.min(boardSize, target));
    }
    const from = this.position;
    this.position = target;
    this.history.push({ from, to: target, type: "set" });
    return { from, to: target };
  }

  /**
   * Geser relatif beberapa langkah.
   * @param {number} steps
   * @param {number} boardSize
   * @param {boolean} requireExactFinish
   * @returns {{from:number,to:number,overshoot:boolean}}
   */
  move(steps, boardSize, requireExactFinish = false) {
    const from = this.position;
    let target = from + Number(steps || 0);
    let overshoot = false;

    if (boardSize != null) {
      if (requireExactFinish) {
        if (target > boardSize) {
          target = from; // tidak bergerak kalau kebablasan
          overshoot = true;
        }
      } else if (target > boardSize) {
        target = boardSize;
      }
      if (target < 0) target = 0;
    }

    this.position = target;
    this.history.push({ from, to: target, type: "move", steps });
    return { from, to: target, overshoot };
  }

  /** Reset ke awal */
  reset(startCell = 0) {
    this.position = startCell;
    this.score = 0;
    this.history = [];
  }

  /** Serialisasi ringan (opsional) */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      position: this.position,
      score: this.score,
      avatar: this.avatar,
    };
  }

  static fromJSON(data = {}) {
    const p = new Player(data.name || "Pemain", {
      color: data.color,
      startCell: data.position ?? 0,
      id: data.id,
      avatar: data.avatar || null,
    });
    p.score = Number(data.score) || 0;
    return p;
  }
}

/* ===========================
   Helper: Token Rendering
   =========================== */

/**
 * Buat elemen token DOM untuk pemain.
 * - Jika avatar ada → pakai <img>, kalau tidak → pakai <div> warna bulat.
 */
export function createTokenEl(player) {
  if (player.avatar) {
    const img = document.createElement("img");
    img.src = player.avatar;
    img.alt = player.name;
    img.className = "token avatar";
    img.style.width = "18px";
    img.style.height = "18px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";
    img.style.position = "absolute";
    img.style.bottom = "6px";
    img.style.left = "6px";
    return img;
  }

  const el = document.createElement("div");
  el.className = "token";
  el.style.position = "absolute";
  el.style.width = "16px";
  el.style.height = "16px";
  el.style.borderRadius = "50%";
  el.style.background = player.color;
  el.style.bottom = "6px";
  el.style.left = "6px";
  return el;
}

/**
 * Letakkan token pemain pada sel #cell-{pos}.
 * @param {Player} player
 * @param {number} playerIndex  (0-based) untuk offset agar tidak tumpuk
 */
export function placeToken(player, playerIndex = 0) {
  // Hapus token lama milik pemain (jika kamu memberi data-id)
  // (opsional) el.dataset.pid = player.id

  const pos = player.position;
  if (!pos || pos < 1) return; // jika start di 0/awal, tidak ditempatkan di papan

  const cell = document.getElementById(`cell-${pos}`);
  if (!cell) return;

  const token = createTokenEl(player);

  // Offset agar beberapa pemain tidak tumpuk di pojok yang sama
  const COL = playerIndex % 3;
  const ROW = Math.floor(playerIndex / 3);
  const dx = 6 + COL * 18;
  const dy = 6 + ROW * 18;

  token.style.left = `${dx}px`;
  token.style.bottom = `${dy}px`;

  cell.appendChild(token);
}

/**
 * Bersihkan semua token yang ada di papan.
 * (Panggil sebelum me-render ulang semua token.)
 */
export function clearAllTokens() {
  document.querySelectorAll(".cell .token").forEach(el => el.remove());
}

/* ===========================
   Util kecil
   =========================== */

function cryptoRandomId() {
  // gunakan crypto jika tersedia, fallback ke Math.random
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return `${arr[0].toString(16)}${arr[1].toString(16)}`;
  }
  return Math.random().toString(16).slice(2);
}

function pickColorById(id) {
  // pilih warna deterministik berdasar hash id
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) {
    hash = ((hash << 5) - hash) + String(id).charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[idx];
}
