// =====================
// Firebase
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

// Firebase設定（自分のものに置き換えてください）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
let wrongCount = 0;
let wrongQuestions = [];

// DOM
const notesDiv = document.getElementById("notes");
const scoreText = document.getElementById("score");
const countdownText = document.getElementById("countdown");
const nameInput = document.getElementById("playerName");
const wrongDiv = document.getElementById("wrongAnswers");

// 効果音
const correctSound = new Audio("correct.mp3");
const wrongSound = new Audio("wrong.mp3");

// =====================
// 音符データ
// =====================
const level1Notes = [
  { img: "sixteenth-note.png", value: 0.25 },
  { img: "eights-note.png", value: 0.5 },
  { img: "quarter-note.png", value: 1 },
  { img: "half-note.png", value: 2 },
  { img: "full-note.png", value: 4 },
  { img: "sixteenth-kyufu.png", value: 0.25 },
  { img: "eights-kyufu.png", value: 0.5 },
  { img: "quarter-kyufu.png", value: 1 },
  { img: "half-kyufu.png", value: 2 }
  
];
const level2Notes = level1Notes;
const level3Notes = [...level1Notes,
 { img: "dotted-half-note.png", value: 3 },
 { img: "dotted-quarter-note.png", value: 3 },
 { img: "dotted-eights-note.png", value: 3 }

];

// =====================
// レベル選択
// =====================
document.querySelectorAll(".levelBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentLevel = Number(btn.dataset.level);
    document.querySelectorAll(".levelBtn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    loadRanking();
    resetGame();
  });
});

// =====================
// スタート
// =====================
document.getElementById("startBtn").addEventListener("click", () => {
  if (!nameInput.value) {
    alert("名前を入力してください");
    return;
  }
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
  wrongCount = 0;
  wrongQuestions = [];
  isPlaying = false;
  scoreText.textContent = "スコア：0";
  countdownText.textContent = "";
  notesDiv.innerHTML = "";
  wrongDiv.innerHTML = "";
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
  wrongCount = 0;

  let question = [];
  if (currentLevel === 1) {
    const note = randomFrom(level1Notes);
    question.push(note);
    correctAnswer = note.value;
  } else {
    const list = currentLevel === 2 ? level2Notes : level3Notes;
    const note1 = randomFrom(list);
    const note2 = randomFrom(list);
    question.push(note1, note2);
    correctAnswer = note1.value + note2.value;
  }

  showNotes(question);
  // 間違えた場合の表示用
  wrongQuestions.push({ notes: question, answer: correctAnswer, wrong: false });
}

// =====================
// 表示
// =====================
function showNotes(notes) {
  notes.forEach((note, i) => {
    const img = document.createElement("img");
    img.src = note.img;
    img.style.height = "80px";
    img.style.margin = "0 5px";
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
// 回答ボタン処理
// =====================
window.pressValue = function(value, btn) {
  if (!isPlaying) return;

  // 初級：同じボタン連打防止
  if (currentLevel === 1 && currentInput === value) return;

  currentInput += value;

  btn.classList.add("active");
  setTimeout(() => btn.classList.remove("active"), 150);

  if (Math.abs(currentInput - correctAnswer) < 0.001) {
    correctSound.play();
    score++;
    scoreText.textContent = `スコア：${score}`;
    nextQuestion();
  } else if (currentInput > correctAnswer) {
    wrongSound.play();
    // 間違えた問題を記録
    wrongQuestions[wrongQuestions.length - 1].wrong = true;
    nextQuestion();
  }
};

// =====================
// 間違えた問題の正答表示
// =====================
function showWrongAnswers() {
  wrongDiv.innerHTML = "<h3>間違えた問題</h3>";
  wrongQuestions.forEach(q => {
    if (q.wrong) {
      const div = document.createElement("div");
      q.notes.forEach(note => {
        const img = document.createElement("img");
        img.src = note.img;
        img.style.height = "60px";
        img.style.margin = "0 3px";
        div.appendChild(img);
      });
      const span = document.createElement("span");
      span.textContent = ` = ${q.answer}`;
      span.style.marginLeft = "10px";
      div.appendChild(span);
      wrongDiv.appendChild(div);
    }
  });
}

// =====================
// Firestore 保存・取得
// =====================
async function saveScore() {
  const key = `level${currentLevel}`;
  try {
    await addDoc(collection(db, "rankings", key, "scores"), {
      name: nameInput.value,
      score: score,
      createdAt: new Date()
    });
  } catch (e) {
    console.error("保存エラー:", e);
  }
  loadRanking();
}

async function loadRanking() {
  const ranking = document.getElementById("ranking");
  ranking.innerHTML = "";
  const key = `level${currentLevel}`;
  try {
    const q = query(
      collection(db, "rankings", key, "scores"),
      orderBy("score", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const li = document.createElement("li");
      li.textContent = `${doc.data().name}：${doc.data().score}点`;
      ranking.appendChild(li);
    });
  } catch (e) {
    console.error("ランキング取得エラー:", e);
  }
}

// =====================
// ユーティリティ
// =====================
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

loadRanking();

