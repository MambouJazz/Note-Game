// =====================
// Firebase
// =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config（※実際はあなたのものを使用）
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
// ゲーム状態
// =====================
let currentLevel = 1;
let correctAnswer = 0;
let score = 0;
let timeLeft = 10;
let timer = null;
let isPlaying = false;
let currentInput = 0;
let wrongQuestions = [];
let lastPressed = null; // 初級連打防止用

// DOM
const notesDiv = document.getElementById("notes");
const scoreText = document.getElementById("score");
const countdownText = document.getElementById("countdown");
const wrongDiv = document.getElementById("wrongQuestions");
const nameInput = document.getElementById("playerName");

// 効果音
const correctSound = new Audio("correct.mp3");
const wrongSound = new Audio("wrong.mp3");

// =====================
// 音符データ
// =====================
const level1Notes = [
  { img: "quarter-note.png", value: 1 },
  { img: "half-note.png", value: 2 },
  { img: "full-note.png", value: 4 }
];
const level2Notes = level1Notes;
const level3Notes = [...level1Notes, { img: "dotted-half-note.png", value: 3 }];

// =====================
// レベル選択
// =====================
document.querySelectorAll(".levelBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentLevel = Number(btn.dataset.level);
    document.querySelectorAll(".levelBtn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    loadRanking();
  });
});

// =====================
// スタート
// =====================
document.getElementById("startBtn").addEventListener("click", () => {
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
  wrongQuestions = [];
  lastPressed = null;
  scoreText.textContent = "スコア：0";
  countdownText.textContent = "";
  notesDiv.innerHTML = "";
  wrongDiv.innerHTML = "";
}

function startGame() {
  if (!nameInput.value) { alert("名前を入力してください"); return; }
  isPlaying = true;
  countdownText.textContent = "スタート！";

  timer = setInterval(() => {
    timeLeft--;
    countdownText.textContent = `残り ${timeLeft} 秒`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      isPlaying = false;
      countdownText.textContent = "終了！";
      showWrongAnswers();
      saveScore();
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
  lastPressed = null;

  if (currentLevel === 1) {
    const note = randomFrom(level1Notes);
    showNotes([note]);
    correctAnswer = note.value;
  } else {
    const list = currentLevel === 2 ? level2Notes : level3Notes;
    const a = randomFrom(list);
    const b = randomFrom(list);
    showNotes([a, b]);
    correctAnswer = a.value + b.value;
  }
}

// =====================
// 表示
// =====================
function showNotes(notes) {
  notes.forEach((note, i) => {
    const img = document.createElement("img");
    img.src = note.img;
    notesDiv.appendChild(img);
    if (i < notes.length - 1) {
      const plus = document.createElement("span");
      plus.textContent = "＋";
      plus.style.fontSize = "32px";
      notesDiv.appendChild(plus);
    }
  });
}

// =====================
// 入力
// =====================
window.pressValue = function(value, btn) {
  if (!isPlaying) return;

  // 初級は同じボタン連打防止
  if (currentLevel === 1 && lastPressed === value) return;
  lastPressed = value;

  currentInput += value;
  btn.classList.add("active");
  setTimeout(() => btn.classList.remove("active"), 150);

  if (Math.abs(currentInput - correctAnswer) < 0.001) {
    score++;
    correctSound.play();
    scoreText.textContent = `スコア：${score}`;
    nextQuestion();
  } else if (currentInput > correctAnswer) {
    wrongSound.play();
    if (currentLevel > 1) {
      wrongQuestions.push({ correctAnswer });
    }
    nextQuestion();
  }
};

// =====================
// 間違えた問題表示
// =====================
function showWrongAnswers() {
  wrongDiv.innerHTML = "";
  wrongQuestions.forEach(wq => {
    const li = document.createElement("li");
    li.textContent = `正答：${wq.correctAnswer}`;
    wrongDiv.appendChild(li);
  });
}

// =====================
// Firestore 保存・取得
// =====================
async function saveScore() {
  try {
    await addDoc(
      collection(db, "rankings", `level${currentLevel}`, "scores"),
      { name: nameInput.value, score, createdAt: new Date() }
    );
    loadRanking();
  } catch(e) { console.error(e); }
}

async function loadRanking() {
  const ranking = document.getElementById("ranking");
  ranking.innerHTML = "";
  try {
    const q = query(
      collection(db, "rankings", `level${currentLevel}`, "scores"),
      orderBy("score", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const li = document.createElement("li");
      li.textContent = `${doc.data().name}：${doc.data().score}点`;
      ranking.appendChild(li);
    });
  } catch(e) { console.error(e); }
}

// =====================
// ユーティリティ
// =====================
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

loadRanking();

