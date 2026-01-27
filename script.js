// =====================
// 基本設定
// =====================

let currentLevel = 1;
let correctAnswer = 0;
let score = 0;
let timeLeft = 10;
let timer = null;

// ボタン入力用
let currentInput = 0;

// DOM
const notesDiv = document.getElementById("notes");
const startBtn = document.getElementById("startBtn");
const scoreText = document.getElementById("score");
const countdownText = document.getElementById("countdown");

// 効果音
const correctSound = new Audio("correct.mp3");
const wrongSound = new Audio("wrong.mp3");

// =====================
// 音符データ
// =====================

const level1Notes = [
  { img: "full-note.png", value: 4 },
  { img: "half-note.png", value: 2 },
  { img: "quarter-note.png", value: 1 },
  { img: "eighth-note.png", value: 0.5 },
  { img: "sixteenth-note.png", value: 0.25 },
  { img: "half-kyufu.png", value: 2 },
  { img: "quarter-kyufu.png", value: 1 },
  { img: "eighth-kyufu.png", value: 0.5 },
  { img: "sixteenth-kyufu.png", value: 0.25 }
];

const level2Notes = level1Notes;

const level3Notes = [
  ...level1Notes,
  { img: "dotted-quarter-note.png", value: 1.5 },
  { img: "dotted-half-note.png", value: 3 },
  { img: "dotted-eighth-note.png", value: 0.75 }
];

// =====================
// レベル選択
// =====================

document.querySelectorAll(".levelBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentLevel = Number(btn.dataset.level);
    resetGame();
    showRanking();
  });
});

// =====================
// スタート
// =====================

startBtn.addEventListener("click", () => {
  resetGame();
  startCountdown();
});

// =====================
// ゲーム制御
// =====================

function resetGame() {
  clearInterval(timer);
  score = 0;
  timeLeft = 10;
  currentInput = 0;

  scoreText.textContent = "スコア：0";
  countdownText.textContent = "";
  notesDiv.innerHTML = "";
}

function startCountdown() {
  countdownText.textContent = "スタート！";

  timer = setInterval(() => {
    timeLeft--;
    countdownText.textContent = `残り ${timeLeft} 秒`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      countdownText.textContent = "終了！";
      saveScore(score);
      showRanking();
      notesDiv.innerHTML = "";
    }
  }, 1000);

  nextQuestion();
}

// =====================
// 出題
// =====================

function nextQuestion() {
  notesDiv.innerHTML = "";
  currentInput = 0;

  if (currentLevel === 1) {
    makeLevel1Question();
  } else if (currentLevel === 2) {
    makeMultipleNotes(level2Notes, 2);
  } else {
    makeMultipleNotes(level3Notes, 3);
  }
}

function makeLevel1Question() {
  const note = randomFrom(level1Notes);
  showNotes([note]);
  correctAnswer = note.value;
}

function makeMultipleNotes(noteList, count) {
  let total = 0;
  let selected = [];

  for (let i = 0; i < count; i++) {
    const note = randomFrom(noteList);
    selected.push(note);
    total += note.value;
  }

  showNotes(selected);
  correctAnswer = total;
}

// =====================
// 表示
// =====================

function showNotes(notes) {
  notes.forEach((note, index) => {
    const img = document.createElement("img");
    img.src = note.img;
    img.style.height = "80px";
    img.style.margin = "10px";
    notesDiv.appendChild(img);

    if (currentLevel !== 1 && index < notes.length - 1) {
      const plus = document.createElement("span");
      plus.textContent = "＋";
      plus.style.fontSize = "32px";
      plus.style.margin = "0 10px";
      notesDiv.appendChild(plus);
    }
  });
}

// =====================
// ボタン入力（自動送信）
// =====================

function pressValue(value, button) {
  currentInput += value;

  // ボタンを光らせる
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
// ランキング（レベル別）
// =====================

function saveScore(newScore) {
  const key = `scores_level_${currentLevel}`;
  let scores = JSON.parse(localStorage.getItem(key)) || [];

  scores.push(newScore);
  scores.sort((a, b) => b - a);
  scores = scores.slice(0, 5);

  localStorage.setItem(key, JSON.stringify(scores));
}

function showRanking() {
  const ranking = document.getElementById("ranking");
  ranking.innerHTML = "";

  const key = `scores_level_${currentLevel}`;
  let scores = JSON.parse(localStorage.getItem(key)) || [];

  scores.forEach(score => {
    const li = document.createElement("li");
    li.textContent = `${score} 点`;
    ranking.appendChild(li);
  });
}

// =====================
// ユーティリティ
// =====================

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}
