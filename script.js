// =====================
// Firebase（設定だけ）
// =====================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApFeYhgvjlRj-0e2tMLp5sbWigohvdjKs",
  authDomain: "note-game-da61b.firebaseapp.com",
  projectId: "note-game-da61b",
  storageBucket: "note-game-da61b.firebasestorage.app",
  messagingSenderId: "713519714721",
  appId: "1:713519714721:web:2f9134e804d6f1e4a77be0",
  measurementId: "G-6R83CXLRWH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =====================
// 基本設定
// =====================

let currentLevel = 1;
let correctAnswer = 0;
let score = 0;
let timeLeft = 10;
let timer = null;
let isPlaying = false;
let currentInput = 0;

// DOM
const notesDiv = document.getElementById("notes");
const startBtn = document.getElementById("startBtn");
const scoreText = document.getElementById("score");
const countdownText = document.getElementById("countdown");

// 効果音
const correctSound = new Audio("correct.wav");
const wrongSound = new Audio("wrong.wav");

// =====================
// 音符データ
// =====================

const level1Notes = [
  { img: "full-note.png", value: 4 },
  { img: "half-note.png", value: 2 },
  { img: "quarter-note.png", value: 1 },
  { img: "eighth-note.png", value: 0.5 },
  { img: "sixteenth-note.png", value: 0.25 }
];

const level2Notes = level1Notes;

const level3Notes = [
  ...level1Notes,
  { img: "dotted-quarter-note.png", value: 1.5 },
  { img: "dotted-half-note.png", value: 3 }
];

// =====================
// レベル選択
// =====================

document.querySelectorAll(".levelBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentLevel = Number(btn.dataset.level);

    document.querySelectorAll(".levelBtn")
      .forEach(b => b.classList.remove("selected"));

    btn.classList.add("selected");
    resetGame();
  });
});

// =====================
// スタート
// =====================

startBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});

// =====================
// ゲーム制御
// =====================

function resetGame() {
  clearInterval(timer);
  score = 0;
  timeLeft = 10;
  currentInput = 0;
  isPlaying = false;
  scoreText.textContent = "スコア：0";
  countdownText.textContent = "";
  notesDiv.innerHTML = "";
}

function startGame() {
  isPlaying = true;
  countdownText.textContent = "スタート！";

  timer = setInterval(() => {
    timeLeft--;
    countdownText.textContent = `残り ${timeLeft} 秒`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      isPlaying = false;
      countdownText.textContent = "終了！";
      notesDiv.innerHTML = "";
    }
  }, 1000);

  nextQuestion();
}

// =====================
// 出題
// =====================

function nextQuestion() {
  if (!isPlaying) return;

  notesDiv.innerHTML = "";
  currentInput = 0;

  if (currentLevel === 1) makeLevel1();
  else if (currentLevel === 2) makeMultiple(level2Notes, 2);
  else makeMultiple(level3Notes, 3);
}

function makeLevel1() {
  const note = randomFrom(level1Notes);
  showNotes([note]);
  correctAnswer = note.value;
}

function makeMultiple(list, count) {
  let total = 0;
  let notes = [];

  for (let i = 0; i < count; i++) {
    const n = randomFrom(list);
    notes.push(n);
    total += n.value;
  }

  showNotes(notes);
  correctAnswer = total;
}

// =====================
// 表示
// =====================

function showNotes(notes) {
  notes.forEach((note, i) => {
    const img = document.createElement("img");
    img.src = note.img;
    notesDiv.appendChild(img);

    if (i < notes.length - 1 && currentLevel !== 1) {
      const plus = document.createElement("span");
      plus.textContent = "＋";
      plus.style.fontSize = "32px";
      notesDiv.appendChild(plus);
    }
  });
}

// =====================
// 回答ボタン
// =====================

document.querySelectorAll("#answerButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    pressValue(Number(btn.dataset.value), btn);
  });
});

function pressValue(value, button) {
  if (!isPlaying) return;

  currentInput += value;

  button.classList.add("active");
  setTimeout(() => button.classList.remove("active"), 150);

  if (Math.abs(currentInput - correctAnswer) < 0.001) {
    correctSound.play();
    score++;
    scoreText.textContent = `スコア：${score}`;
    nextQuestion();
  } else if (currentInput > correctAnswer) {
    wrongSound.play();
    nextQuestion();
  }
}

// =====================
// ユーティリティ
// =====================

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
