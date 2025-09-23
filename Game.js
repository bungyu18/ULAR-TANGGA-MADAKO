// ===== Data default: Ular & Tangga (papan 8x8 = 64) =====
export const DEFAULT_JUMPS = {
  // Tangga (naik)
  5: 11,
  21: 37,
  26: 55,
  31: 46,
  51: 63,
  // Ular (turun)
  29: 3,
  49: 33,
  59: 45,
};

export class Game {
  /**
   * @param {Array<{name:string, position?:number}>} players
   * @param {object} opts
   *   - boardDim: jumlah kotak per sisi (default 8 → 64 kotak)
   *   - jumps: objek ular/tangga, contoh: { 3:22, 20:6 }
   *   - requireExactFinish: kalau true, harus mendarat tepat di kotak terakhir
   *   - diceSides: jumlah sisi dadu (default 6)
   */
  constructor(players, opts = {}) {
    const {
      boardDim = 8,
      jumps = DEFAULT_JUMPS,
      requireExactFinish = false,
      diceSides = 6,
    } = opts;

    // Normalisasi pemain
    this.players = players.map(p => ({
      name: p.name,
      position: Number.isFinite(p.position) ? p.position : 0,
    }));

    this.currentPlayerIndex = 0;
    this.boardDim = boardDim;
    this.boardSize = boardDim * boardDim;
    this.jumps = { ...jumps };
    this.requireExactFinish = !!requireExactFinish;
    this.diceSides = diceSides;
    this.isGameOver = false;
  }

  // ===== Helpers konfigurasi =====
  setJumps(jumps) { this.jumps = { ...jumps }; }
  setBoardDim(dim) { this.boardDim = dim; this.boardSize = dim * dim; }
  setRequireExactFinish(v) { this.requireExactFinish = !!v; }
  setDiceSides(n) { this.diceSides = Math.max(2, Number(n) || 6); }

  // Buat game cepat dari array nama
  static fromNames(names, opts = {}) {
    const players = names.map(n => ({ name: n, position: 0 }));
    return new Game(players, opts);
  }

  // ===== Gameplay =====
  rollDice() {
    return Math.floor(Math.random() * this.diceSides) + 1;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    if (this.isGameOver) return;
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  getWinner() {
    return this.players.find(p => p.position >= this.boardSize) || null;
  }

  reset() {
    this.players.forEach(p => (p.position = 0));
    this.currentPlayerIndex = 0;
    this.isGameOver = false;
  }

  // Terapkan ular/tangga bila mendarat pada kotak yg punya lompatan
  applyJump(pos) {
    if (this.jumps[pos] !== undefined) return this.jumps[pos];
    return pos;
  }

  /**
   * Gerakkan pemain yang sedang jalan.
   * @param {number} steps
   * @returns {{
   *   from:number, to:number, landed:number,
   *   jumpedTo:number|null, jumpType:'ladder'|'snake'|null,
   *   finished:boolean, overshoot:boolean
   * }}
   */
  moveCurrent(steps) {
    if (this.isGameOver) {
      return {
        from: null, to: null, landed: null,
        jumpedTo: null, jumpType: null, finished: true, overshoot: false
      };
    }

    const player = this.getCurrentPlayer();
    const from = player.position;
    let target = from + steps;
    let overshoot = false;

    if (this.requireExactFinish) {
      if (target > this.boardSize) {
        target = from;      // tidak bergerak kalau kebablasan
        overshoot = true;
      }
    } else {
      if (target > this.boardSize) target = this.boardSize;
    }

    const landed = target;

    // Cek ular/tangga
    const jumped = this.applyJump(landed);
    let jumpType = null;
    if (jumped !== landed) {
      jumpType = jumped > landed ? 'ladder' : 'snake';
    }

    player.position = jumped;

    const finished = player.position >= this.boardSize;
    if (finished) this.isGameOver = true;

    return {
      from,
      to: player.position,
      landed,
      jumpedTo: jumped === landed ? null : jumped,
      jumpType,
      finished,
      overshoot
    };
  }

  getPositions() {
    return this.players.map(p => p.position);
  }
}
