// quizdata.js

/**
 * Bank soal kuis.
 * Bisa ditambah sesuai kebutuhan.
 */
export const quizBank = [
  {
    id: 1,
    question: "Ibukota Indonesia?",
    options: ["Jakarta", "Surabaya", "Medan"],
    answer: "Jakarta"
  },
  {
    id: 2,
    question: "2 + 2 = ?",
    options: ["3", "4", "5"],
    answer: "4"
  },
  {
    id: 3,
    question: "Warna bendera Indonesia?",
    options: ["Merah Putih", "Merah Kuning", "Putih Biru"],
    answer: "Merah Putih"
  }
];

/**
 * Ambil satu soal acak dari bank soal.
 * @returns {object} soal kuis
 */
export function getRandomQuiz() {
  return quizBank[Math.floor(Math.random() * quizBank.length)];
}

/**
 * Ambil beberapa soal unik secara acak.
 * @param {number} count jumlah soal
 * @returns {Array<object>}
 */
export function getRandomQuizzes(count = 1) {
  const shuffled = [...quizBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, quizBank.length));
}

/**
 * Tambahkan soal baru ke bank soal.
 * @param {string} question
 * @param {Array<string>} options
 * @param {string} answer
 */
export function addQuiz(question, options, answer) {
  const id = quizBank.length ? Math.max(...quizBank.map(q => q.id)) + 1 : 1;
  quizBank.push({ id, question, options, answer });
}
