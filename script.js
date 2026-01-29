// =====================
// Firebase 設定
// =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
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
let lastPressed = null; // 初級連打防止用
let wrongCount = 0; // 初級3回失格用
let wrongQuestions = []; // 中級・上級で間違えた問題保存用

// DOM
const notesDiv = document.getElementById("notes");
const scoreText = document.getElementById("score");
const countdownText = document.getElementById("countdown");
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
  lastPressed = null;
  wrongCount = 0;
  wrongQuestions = [];
  isPlaying = false;

  scoreText.textContent = "スコア：0";
  countdownText.textContent = "";
  notesDiv.innerHTML = "";
}

function startGame() {
  if (!nameInput.value) {
    alert("名前を入力してください");
    return;
  }

  isPlaying = true;
  countdownText.textContent = "スタート！";

  timer = setInterval(() => {
    timeLeft--;
    countdownText.textContent = `残り ${timeLeft} 秒`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      isPlaying = false;
      countdownText.textContent = "終了！";
      showWrongAnswers(); // 間違えた問題の正答表示
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
    // 中級・上級は複数音符の合計
    const count = 2 + (currentLevel === 3 ? 1 : 0); // 中級=2, 上級=3
    let total = 0;
    let selectedNotes = [];
    for (let i = 0; i < count; i++) {
      const note = randomFrom(list);
      selectedNotes.push(note);
      total += note.value;
    }
    correctAnswer = total;
    showNotes(selectedNotes);
  }
}

// =====================
// 表示
// =====================
function showNotes(notes) {
  notes.forEach((note, i) => {
    const img = document.createElement("img");
    img.src = note.img;
    img.style.height = "80px";
    img.style.margin = "10px";
    notesDiv.appendChild(img);

    if (i < notes.length - 1) {
      const plus = document.createElement("span");
      plus.textContent = "＋";
      plus.style.fontSize = "32px";
      plus.style.margin = "0 10px";
      notesDiv.appendChild(plus);
    }
  });
}

// =====================
// ボタン入力
// =====================
window.pressValue = function(value, btn) {
  if (!isPlaying) return;

  // 初級は同じボタンの連打防止
  if (currentLevel === 1 && lastPressed === value) return;
  lastPressed = value;

  currentInput += value;
  btn.classList.add("active");
  setTimeout(() => btn.classList.remove("active"), 150);

  // 判定
  if (Math.abs(currentInput - correctAnswer) < 0.001) {
    correctSound.play();
    score++;
    scoreText.textContent = `スコア：${score}`;
    wrongCount = 0;
    nextQuestion();
  } else if (currentInput > correctAnswer) {
    wrongSound.play();
    // 初級は連続間違え3回で失格
    if (currentLevel === 1) {
      wrongCount++;
      if (wrongCount >= 3) {
        alert("失格！3回間違えました");
        isPlaying = false;
        clearInterval(timer);
        countdownText.textContent = "終了！";
        showWrongAnswers();
        saveScore();
        return;
      }
    } else {
      // 中級・上級は間違えた問題を記録
      wrongQuestions.push({ correctAnswer });
    }
    nextQuestion();
  }
};

// =====================
// 間違えた問題の正答表示
// =====================
function showWrongAnswers() {
  if ((currentLevel === 2 || currentLevel === 3) && wrongQuestions.length > 0) {
    notesDiv.innerHTML = "<h3>間違えた問題の正答</h3>";
    wrongQuestions.forEach((q, i) => {
      const div = document.createElement("div");
      div.textContent = `問題 ${i + 1}： 正答 = ${q.correctAnswer}`;
      notesDiv.appendChild(div);
    });
  }
}

// =====================
// Firestore 保存・取得
// =====================
async function saveScore() {
  const colRef = collection(db, "rankings", `level${currentLevel}`, "scores");
  await addDoc(colRef, {
    name: nameInput.value,
    score: score,
    createdAt: new Date()
  });
  loadRanking();
}

async function loadRanking() {
  const ranking = document.getElementById("ranking");
  ranking.innerHTML = "";

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
}

// =====================
// ユーティリティ
// =====================
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 初期表示
loadRanking();
