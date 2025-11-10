// quizdata.js (non-module, langsung nempel ke window)

(function () {
  const quizBank = [
  {
    id: 1,
    question: "Magnet memiliki dua kutub, yaitu …",
    options: [
      "A. Kutub kanan dan kiri",
      "B. Kutub utara dan selatan",
      "C. Kutub atas dan bawah",
      "D. Kutub depan dan belakang"
    ],
    answer: "B. Kutub utara dan selatan"
  },
  {
    id: 2,
    question: "Jika dua kutub magnet yang sama didekatkan, maka magnet akan …",
    options: [
      "A. Saling menarik",
      "B. Saling menolak",
      "C. Saling menempel",
      "D. Diam saja"
    ],
    answer: "B. Saling menolak"
  },
  {
    id: 3,
    question: "Magnet dapat menarik benda yang terbuat dari …",
    options: [
      "A. Kayu",
      "B. Kertas",
      "C. Besi",
      "D. Plastik"
    ],
    answer: "C. Besi"
  },
  {
    id: 4,
    question: "Gaya magnet paling kuat terdapat di bagian …",
    options: [
      "A. Tengah magnet",
      "B. Ujung magnet",
      "C. Sisi magnet",
      "D. Belakang magnet"
    ],
    answer: "B. Ujung magnet"
  },
  {
    id: 5,
    question: "Jika magnet dipotong menjadi dua bagian, maka …",
    options: [
      "A. Salah satu bagian tidak memiliki kutub",
      "B. Setiap bagian tetap memiliki kutub utara dan selatan",
      "C. Magnet menjadi hilang kekuatannya",
      "D. Hanya satu bagian yang menjadi magnet"
    ],
    answer: "B. Setiap bagian tetap memiliki kutub utara dan selatan"
  },
  {
    id: 6,
    question: "Contoh benda yang tidak dapat ditarik magnet adalah …",
    options: [
      "A. Paku",
      "B. Jarum",
      "C. Sendok besi",
      "D. Penghapus"
    ],
    answer: "D. Penghapus"
  },
  {
    id: 7,
    question: "Magnet bisa kehilangan kekuatannya jika …",
    options: [
      "A. Didinginkan",
      "B. Dibiarkan di tempat sejuk",
      "C. Dipukul atau dipanaskan",
      "D. Ditarik benda logam"
    ],
    answer: "C. Dipukul atau dipanaskan"
  },
  {
    id: 8,
    question: "Magnet yang dapat dibuat dari besi dengan cara dialiri arus listrik disebut …",
    options: [
      "A. Magnet batang",
      "B. Magnet permanen",
      "C. Elektromagnet",
      "D. Magnet alam"
    ],
    answer: "C. Elektromagnet"
  },
  {
    id: 9,
    question: "Kutub magnet yang berlawanan akan …",
    options: [
      "A. Menolak",
      "B. Menarik",
      "C. Hilang",
      "D. Diam"
    ],
    answer: "B. Menarik"
  },
  {
    id: 10,
    question: "Jika magnet digantung bebas, ujung magnet yang menunjuk ke arah utara bumi adalah …",
    options: [
      "A. Kutub selatan magnet",
      "B. Kutub utara magnet",
      "C. Tengah magnet",
      "D. Kutub timur magnet"
    ],
    answer: "B. Kutub utara magnet"
  }

  ];

  // util opsional
  function getRandomQuiz() {
    return quizBank[Math.floor(Math.random() * quizBank.length)];
  }
  function getRandomQuizzes(count = 1) {
    const shuffled = [...quizBank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, quizBank.length));
  }
  function addQuiz(question, options, answer) {
    const id = quizBank.length ? Math.max(...quizBank.map(q => q.id)) + 1 : 1;
    quizBank.push({ id, question, options, answer });
  }

  // expose ke window (GLOBAL)
  window.quizBank = quizBank;
  window.getRandomQuiz = getRandomQuiz;
  window.getRandomQuizzes = getRandomQuizzes;
  window.addQuiz = addQuiz;
})();
