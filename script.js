let currentScreen = "menuAwal";
let numPlayers = 2; // minimal 2
let currentPlayer = 1;
let positions = {};
let playerNames = {};
let boardSize = 64; // 8x8
let playerAvatars = {};
let quizOrder = [];  // urutan soal acak
let quizPtr = 0;     // penanda index soal yang sedang ditampilkan

// === NEW: Stat per pemain ===
let playerStats = {}; // { [idx]: {correct:0, wrong:0, points:0} }

// ====== ATURAN ULAR & TANGGA ======
const jumps = {
  // Tangga (naik)
  5: 11,
  21: 37,
  26: 55,
  31: 46,
  51: 63,
  // Ular (turun)
  29: 3,
  49: 33,
  59: 45
};

// ====== DICE ICON MAP (1–6) ======
const DICE_ICONS = {
  1: "assets/d1.png",
  2: "assets/d2.png",
  3: "assets/d3.png",
  4: "assets/d4.png",
  5: "assets/d5.png",
  6: "assets/d6.png",
};

// ====== AUDIO HELPERS ======
function playSfxById(id, volume = 1) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    el.volume = volume;
    el.currentTime = 0;
    el.play();
  } catch (_) {}
}
function startBgm(vol = 0.6) {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;
  try {
    bgm.volume = vol;
    if (bgm.paused) bgm.play();
  } catch (_) {}
}

// ====== DICE ENABLE HELPER ======
function setDiceEnabled(on) {
  const btn = document.getElementById("rollDiceBtn");
  if (!btn) return;
  btn.disabled = !on;
  btn.classList.toggle("disabled", !on); // untuk styling disabled di CSS (opsional)
}

// ====== NAVIGASI ======
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  currentScreen = id;
}
function goBack(button) {
  const current = button.closest(".screen");
  const prevId = current.getAttribute("data-prev");
  if (prevId) showScreen(prevId);
}

// Mulai musik saat user pertama kali klik "Play"
document.getElementById("playBtn")?.addEventListener("click", () => {
  startBgm(0.6);
  showScreen("menuMode");
});

function selectMode(_) {
  showScreen("menuLawan");
}
function selectOpponent(_) {
  showScreen("menuPemain");
  generatePlayerInputs(numPlayers);
}

// ====== INPUT DINAMIS NAMA ======
function generatePlayerInputs(count) {
  const container = document.getElementById("playerInputs");
  container.innerHTML = "";
  for (let i = 1; i <= count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = `player${i}`;
    input.placeholder = `Nama Pemain ${i}`;
    container.appendChild(input);
    container.appendChild(document.createElement("br"));
  }
}

// Batasi 2–4 pemain
document.getElementById("playerCount")?.addEventListener("input", function () {
  numPlayers = parseInt(this.value, 10);
  if (isNaN(numPlayers)) numPlayers = 2;
  if (numPlayers < 2) numPlayers = 2;
  if (numPlayers > 4) numPlayers = 4;
  this.value = String(numPlayers);
  generatePlayerInputs(numPlayers);
});

// ====== MULAI GAME ======
function startGame() {
  startBgm(0.6);

  // === VALIDASI NAMA PEMAIN (WAJIB TERISI) ===
  const countInput = document.getElementById("playerCount");
  numPlayers = Math.max(2, Math.min(4, parseInt(countInput?.value || "2", 10)));

  for (let i = 1; i <= numPlayers; i++) {
    const el = document.getElementById(`player${i}`);
    if (!el || !el.value.trim()) {
      alert(`Nama Pemain ${i} belum diisi.`);
      el?.focus();
      return;
    }
  }

  positions = {};
  playerNames = {};
  playerAvatars = {};

  const defaultAvatars = [
    "assets/p1.png",
    "assets/p2.png",
    "assets/p3.png",
    "assets/p4.png"
  ];

  for (let i = 1; i <= numPlayers; i++) {
    playerNames[i] = document.getElementById(`player${i}`)?.value || `Pemain ${i}`;
    positions[i] = 1; // mulai di kotak 1
    playerAvatars[i] = defaultAvatars[(i - 1) % defaultAvatars.length];
  }

  // === reset statistik
  playerStats = {};
  for (let i = 1; i <= numPlayers; i++) {
    playerStats[i] = { correct: 0, wrong: 0, points: 0 };
  }

  currentPlayer = 1;
  showScreen("gameBoard");
  renderBoard();
  ensureTokens();
  renderPlayers();
  updateTurnInfo();

  // Reset tampilan dadu
  const diceText = document.getElementById("diceResult");
  if (diceText) diceText.innerText = "";
  const diceIcon = document.getElementById("diceIcon");
  if (diceIcon) { diceIcon.src = DICE_ICONS[1] || ""; diceIcon.alt = "Hasil Dadu"; }

  setupBgmControls(); // hubungkan tombol & slider pojok kanan atas

  // set urutan soal acak (soal, bukan opsi)
  if (Array.isArray(window.quizBank) && window.quizBank.length) {
    quizOrder = shuffle([...Array(window.quizBank.length).keys()]);
    quizPtr = 0;
  }

  // dadu aktif saat baru mulai (belum ada soal terbuka)
  setDiceEnabled(true);
}

// ====== RENDER PAPAN ======
function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  const size = Math.sqrt(boardSize);

  for (let row = size - 1; row >= 0; row--) {
    for (let col = 0; col < size; col++) {
      const actualCol = (row % 2 === 0) ? col : size - 1 - col; // zigzag
      const cellNumber = row * size + actualCol + 1;

      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.id = `cell-${cellNumber}`;
      cell.innerText = cellNumber; // kalau tidak mau angka: kosongkan
      board.appendChild(cell);
    }
  }
}

// ====== TOKEN (PION GAMBAR) ======
function ensureTokens() {
  const board = document.getElementById("board");
  for (let i = 1; i <= numPlayers; i++) {
    let wrap = document.querySelector(`.token-wrap[data-player="${i}"]`);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "token-wrap";
      wrap.dataset.player = String(i);

      const img = document.createElement("img");
      img.className = "token-img";
      img.src = playerAvatars[i];
      img.alt = playerNames[i];

      wrap.appendChild(img);
      board.appendChild(wrap);
    }
  }
}
function getCellXY(pos, offsetIndex = 0) {
  const cell = document.getElementById(`cell-${pos}`);
  const board = document.getElementById("board");
  if (!cell || !board) return { x: 0, y: 0 };

  const c = cell.getBoundingClientRect();
  const b = board.getBoundingClientRect();

  const centerX = c.left - b.left + c.width / 2;
  const centerY = c.top  - b.top  + c.height / 2;

  let x = centerX - 20; // setengah pion ~20px
  let y = centerY - 20;

  // offset kecil biar tidak tumpuk (grid 2x2)
  const COL = offsetIndex % 2;
  const ROW = Math.floor(offsetIndex / 2);
  x += (COL * 18) - 9;
  y += (ROW * 18) - 9;

  return { x, y };
}
function animateMoveTo(i, pos, callback) {
  ensureTokens();
  const wrap = document.querySelector(`.token-wrap[data-player="${i}"]`);
  const img  = wrap?.querySelector(".token-img");
  if (!wrap || !img) return callback && callback();

  const { x, y } = getCellXY(pos, i - 1);

  // trigger anim loncat
  img.classList.remove("token-jump");
  void img.offsetWidth; // reflow
  img.classList.add("token-jump");

  wrap.style.transform = `translate(${x}px, ${y}px)`;

  setTimeout(() => {
    img.classList.remove("token-jump");
    if (callback) callback();
  }, 430);
}
function renderPlayers() {
  ensureTokens();
  for (let i = 1; i <= numPlayers; i++) {
    const pos = positions[i] || 1;
    const { x, y } = getCellXY(pos, i - 1);
    const wrap = document.querySelector(`.token-wrap[data-player="${i}"]`);
    if (wrap) wrap.style.transform = `translate(${x}px, ${y}px)`;
  }
}

// ====== ULAR/TANGGA ======
function applyJump(pos) {
  if (jumps[pos] !== undefined) {
    const to = jumps[pos];
    const naik = to > pos;
    playSfxById(naik ? "sfxUp" : "sfxDown", 0.9);
    alert(`${naik ? "Tangga ⬆️" : "Ular ⬇️"}! Dari ${pos} ke ${to}`);
    return to;
  }
  return pos;
}

// ====== DADU ======
document.getElementById("rollDiceBtn")?.addEventListener("click", () => {
  // Jangan jalan kalau tombol disabled
  const rollBtn = document.getElementById("rollDiceBtn");
  if (rollBtn?.disabled) return;

  playSfxById("sfxDice", 0.9);

  const dice = Math.floor(Math.random() * 6) + 1;

  const diceText = document.getElementById("diceResult");
  if (diceText) diceText.innerText = `Dadu: ${dice}`;

  const diceIcon = document.getElementById("diceIcon");
  if (diceIcon) {
    diceIcon.classList.remove("spin");
    void diceIcon.offsetWidth;
    diceIcon.src = DICE_ICONS[dice] || "";
    diceIcon.alt = `Dadu ${dice}`;
    diceIcon.classList.add("spin");
  }

  let landed = positions[currentPlayer] + dice;
  if (landed > boardSize) landed = boardSize;
  positions[currentPlayer] = landed;

  animateMoveTo(currentPlayer, landed, () => {
    const jumpedTo = jumps[landed];
    if (jumpedTo !== undefined) {
      positions[currentPlayer] = jumpedTo;
      setTimeout(() => {
        animateMoveTo(currentPlayer, jumpedTo, afterAllMoves);
      }, 200);
    } else {
      afterAllMoves();
    }
  });

  function afterAllMoves() {
    if (positions[currentPlayer] >= boardSize) {
      setTimeout(() => {
        // Game selesai → tampilkan rekap hasil
        showResults();
      }, 120);
      return;
    }
    // Kunci dadu sampai soal dijawab
    setDiceEnabled(false);
    showQuiz(); // kuis muncul setelah pion selesai bergerak
  }
});

// ====== UTIL QUIZ ======
const LABELS = ["A", "B", "C", "D", "E", "F"];
function ensureLabeledOptions(options) {
  if (!Array.isArray(options)) return [];
  const already = options.every(o => /^[A-F]\s*[\.\)\-]\s*/i.test(String(o).trim()));
  return already ? options.slice() : options.map((o, i) => `${LABELS[i] || ""}. ${o}`);
}
// acak array (Fisher–Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function norm(s) {
  return String(s || "").trim().replace(/^[A-F]\s*[\.\)\-]\s*/i, "").toLowerCase();
}

// ====== KUIS ======
let _currentQuiz = null;

function showQuiz() {
  if (!Array.isArray(window.quizBank) || window.quizBank.length === 0) {
    nextTurn();
    return;
  }

  // ambil soal berdasarkan urutan acak (soal diacak, opsi TIDAK)
  if (!Array.isArray(quizOrder) || quizOrder.length === 0 || quizPtr >= quizOrder.length) {
    quizOrder = shuffle([...Array(window.quizBank.length).keys()]);
    quizPtr = 0;
  }
  const qIndex = quizOrder[quizPtr++];
  const q = window.quizBank[qIndex];

  // urutan A/B/C/D tetap — tidak diacak
  const labeledOptions = ensureLabeledOptions(q.options || []);
  const answerLabeled  = ensureLabeledOptions([q.answer || ""])[0];

  _currentQuiz = {
    question: q.question,
    options: labeledOptions,
    answer: answerLabeled
  };

  const box = document.getElementById("quizBox");
  const qEl = document.getElementById("quizQuestion");
  const optionsContainer = document.getElementById("quizOptions");
  if (!box || !qEl || !optionsContainer) {
    nextTurn();
    return;
  }

  qEl.textContent = _currentQuiz.question;
  optionsContainer.innerHTML = "";

  _currentQuiz.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;

    // === Catat benar/salah + poin (tanpa popup)
    btn.onclick = () => {
      const isCorrect = norm(opt) === norm(_currentQuiz.answer);
      if (isCorrect) {
        playerStats[currentPlayer].correct += 1;
        playerStats[currentPlayer].points  += 10;
      } else {
        playerStats[currentPlayer].wrong   += 1;
      }
      nextTurn();
    };

    optionsContainer.appendChild(btn);
  });

  box.classList.remove("hidden");
}

// ====== GILIRAN ======
function nextTurn() {
  document.getElementById("quizBox")?.classList.add("hidden");
  _currentQuiz = null;

  // Setelah menjawab soal → aktifkan dadu lagi
  setDiceEnabled(true);

  currentPlayer++;
  if (currentPlayer > numPlayers) currentPlayer = 1;
  updateTurnInfo();
}
function updateTurnInfo() {
  document.getElementById("turnInfo").innerText = `Giliran: ${playerNames[currentPlayer]}`;
}

// ====== HASIL ======
function showResults() {
  const table = document.getElementById("resultTable");
  const tbody = table?.querySelector("tbody");

  if (table && tbody) {
    // isi tabel
    tbody.innerHTML = "";
    for (let i = 1; i <= numPlayers; i++) {
      const tr = document.createElement("tr");
      const tdName   = document.createElement("td");
      const tdRight  = document.createElement("td");
      const tdWrong  = document.createElement("td");
      const tdPoints = document.createElement("td");

      tdName.textContent   = playerNames[i] || `Pemain ${i}`;
      tdRight.textContent  = playerStats[i]?.correct ?? 0;
      tdWrong.textContent  = playerStats[i]?.wrong ?? 0;
      tdPoints.textContent = playerStats[i]?.points ?? 0;

      tr.appendChild(tdName);
      tr.appendChild(tdRight);
      tr.appendChild(tdWrong);
      tr.appendChild(tdPoints);
      tbody.appendChild(tr);
    }
    showScreen("resultScreen");
  } else {
    // fallback kalau belum ada layar hasil di HTML
    let msg = "Hasil Permainan:\n\n";
    for (let i = 1; i <= numPlayers; i++) {
      const c = playerStats[i]?.correct ?? 0;
      const w = playerStats[i]?.wrong ?? 0;
      const p = playerStats[i]?.points ?? 0;
      msg += `${playerNames[i] || "Pemain " + i} → Benar: ${c}, Salah: ${w}, Poin: ${p}\n`;
    }
    alert(msg);
    showScreen("menuAwal");
  }
}

// ====== KONTROL BGM (pojok kanan atas, pakai IKON) ======
function setupBgmControls() {
  const bgm = document.getElementById("bgm");
  const toggle = document.getElementById("bgmToggle");
  const vol = document.getElementById("bgmVolume");
  const icon = document.getElementById("bgmIcon");
  if (!bgm || !toggle || !icon) return;

  const setIcon = () => {
    if (bgm.paused) {
      icon.src = "assets/off.png";
      icon.alt = "Musik OFF";
      toggle.setAttribute("aria-label", "Musik OFF");
    } else {
      icon.src = "assets/on.png";
      icon.alt = "Musik ON";
      toggle.setAttribute("aria-label", "Musik ON");
    }
  };

  // set label/ikon awal
  setIcon();

  toggle.addEventListener("click", () => {
    if (bgm.paused) {
      bgm.play().catch(()=>{});
    } else {
      bgm.pause();
    }
    setIcon();
  });

  vol?.addEventListener("input", (e) => {
    const v = parseFloat(e.target.value || "0.6");
    bgm.volume = isNaN(v) ? 0.6 : v;
  });

  // jaga sinkron saat state audio berubah dari luar
  bgm.addEventListener("play", setIcon);
  bgm.addEventListener("pause", setIcon);
}

// ====== EKSPOR FUNGSI GLOBAL YANG DIPAKAI DI HTML ======
window.selectMode = selectMode;
window.selectOpponent = selectOpponent;
window.startGame = startGame;
window.goBack = goBack;
