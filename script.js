let currentScreen = "menuAwal";
let numPlayers = 2; // minimal 2
let currentPlayer = 1;
let positions = {};
let playerNames = {};
let boardSize = 64; // 8x8
let playerAvatars = {};

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

// ====== SOAL KUIS ======
const quizData = [
  { question: "Ibukota Indonesia?", options: ["Jakarta", "Bali", "Surabaya"], answer: "Jakarta" },
  { question: "2 + 2 = ?", options: ["3", "4", "5"], answer: "4" },
  { question: "Warna bendera Indonesia?", options: ["Merah Putih", "Biru Putih", "Hijau Kuning"], answer: "Merah Putih" },
];

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
const playBtnEl = document.getElementById("playBtn");
if (playBtnEl) {
  playBtnEl.addEventListener("click", () => {
    startBgm(0.6);
    showScreen("menuMode");
  });
}

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
const numPlayerInput = document.getElementById("playerCount");
if (numPlayerInput) {
  numPlayerInput.addEventListener("input", function () {
    numPlayers = parseInt(this.value, 10);
    if (isNaN(numPlayers)) numPlayers = 2;
    if (numPlayers < 2) numPlayers = 2;
    if (numPlayers > 4) numPlayers = 4;
    this.value = String(numPlayers);
    generatePlayerInputs(numPlayers);
  });
}

// ====== MULAI GAME ======
function startGame() {
  startBgm(0.6);

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
      // Kalau ingin tanpa angka: cell.innerText = "";
      cell.innerText = cellNumber;
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

  // sesuaikan dengan ukuran pion (default CSS 40px → setengah = 20)
  let x = centerX - 20;
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
const rollBtn = document.getElementById("rollDiceBtn");
if (rollBtn) {
  rollBtn.addEventListener("click", () => {
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
          alert(`${playerNames[currentPlayer]} menang!`);
          showScreen("menuAwal");
        }, 120);
        return;
      }
      showQuiz();
    }
  });
}

// ====== KUIS ======
function showQuiz() {
  const quiz = quizData[Math.floor(Math.random() * quizData.length)];
  document.getElementById("quizQuestion").innerText = quiz.question;
  const optionsContainer = document.getElementById("quizOptions");
  optionsContainer.innerHTML = "";

  quiz.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => {
      nextTurn();
    };
    optionsContainer.appendChild(btn);
  });

  document.getElementById("quizBox").classList.remove("hidden");
}

// ====== GILIRAN ======
function nextTurn() {
  document.getElementById("quizBox").classList.add("hidden");
  currentPlayer++;
  if (currentPlayer > numPlayers) currentPlayer = 1;
  updateTurnInfo();
}
function updateTurnInfo() {
  document.getElementById("turnInfo").innerText = `Giliran: ${playerNames[currentPlayer]}`;
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
