// =====================
// Apology Site for Vany
// Mini Game: Tangkap Hati
// =====================

const TARGET_SCORE = 6;
const GAME_DURATION = 25;
const HEART_SPAWN_MS = 1000;
const HEART_LIFE_MS = 1800;


const btnStart = document.getElementById("btnStart");
const btnOpenLetter = document.getElementById("btnOpenLetter");
const btnPlay = document.getElementById("btnPlay");
const btnReset = document.getElementById("btnReset");

const gameArea = document.getElementById("gameArea");
const overlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayDesc = document.getElementById("overlayDesc");

const scoreText = document.getElementById("scoreText");
const progressBar = document.getElementById("progressBar");

const timeText = document.getElementById("timeText");
const comboText = document.getElementById("comboText");

const toggleSound = document.getElementById("toggleSound");
const soundLabel = document.querySelector(".sound-label");

const btnForgive = document.getElementById("btnForgive");
const btnNotYet = document.getElementById("btnNotYet");
const resultBox = document.getElementById("resultBox");

let score = 0;
let timeLeft = GAME_DURATION;
let combo = 0;

let gameRunning = false;
let timerId = null;
let spawnId = null;

const HEART_EMOJIS = ["💗","💞","💖","💕","💘","❤️‍🔥"];

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function setScore(newScore){
  score = clamp(newScore, 0, TARGET_SCORE);
  scoreText.textContent = `${score} / ${TARGET_SCORE}`;
  progressBar.style.width = `${(score / TARGET_SCORE) * 100}%`;

  if(score >= TARGET_SCORE){
    btnOpenLetter.disabled = false;
    endGame(true);
  }
}

function setTime(t){
  timeLeft = t;
  timeText.textContent = String(timeLeft);
}

function setCombo(c){
  combo = c;
  comboText.textContent = String(combo);
}

function sfx(type){
  if(!toggleSound.checked) return;

  // Very small SFX using WebAudio (no file needed)
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.connect(g);
  g.connect(ctx.destination);

  let freq = 440;
  let dur = 0.08;

  if(type === "pop"){ freq = 740; dur = 0.06; }
  if(type === "win"){ freq = 520; dur = 0.14; }
  if(type === "lose"){ freq = 180; dur = 0.14; }

  o.frequency.value = freq;
  o.type = "sine";

  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

  o.start();
  o.stop(ctx.currentTime + dur);

  // Close context later
  setTimeout(() => ctx.close(), 250);
}

function clearHearts(){
  [...gameArea.querySelectorAll(".heart")].forEach(el => el.remove());
}

function randomWithin(min, max){
  return Math.random() * (max - min) + min;
}

function spawnHeart(){
  if(!gameRunning) return;

  const rect = gameArea.getBoundingClientRect();

  // Keep inside boundaries with padding
  const pad = 34;
  const x = randomWithin(pad, rect.width - pad);
  const y = randomWithin(pad, rect.height - pad);

  const heart = document.createElement("div");
  heart.className = "heart";
  heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;

  // Auto remove after some time (missed heart)
  const lifeMs = 950;
  const bornAt = Date.now();

  const missTimeout = setTimeout(() => {
    if(heart.isConnected){
      heart.remove();
      // miss breaks combo
      setCombo(0);
    }
  }, lifeMs);

  heart.addEventListener("click", () => {
    clearTimeout(missTimeout);
    if(!gameRunning) return;

    heart.classList.add("pop");
    setTimeout(() => heart.remove(), 180);

    // combo increases score slightly faster
    setCombo(combo + 1);
    const bonus = combo >= 3 ? 2 : 1; // after 3 combo, get 2 points
    setScore(score + bonus);

    sfx("pop");
  });

  gameArea.appendChild(heart);

  // Safety cleanup (if overlay ends while hearts remain)
  setTimeout(() => {
    if(Date.now() - bornAt > 1400 && heart.isConnected) heart.remove();
  }, 1600);
}

function showOverlay(title, desc, showPlayButton){
  overlayTitle.textContent = title;
  overlayDesc.textContent = desc;
  overlay.style.display = "grid";
  btnPlay.style.display = showPlayButton ? "inline-flex" : "none";
}

function hideOverlay(){
  overlay.style.display = "none";
}

function startGame(){
  if(gameRunning) return;

  clearHearts();
  setCombo(0);
  setTime(GAME_DURATION);

  gameRunning = true;
  hideOverlay();

  // countdown timer
  timerId = setInterval(() => {
    setTime(timeLeft - 1);
    if(timeLeft <= 0){
      endGame(false);
    }
  }, 1000);

  // spawn hearts
  spawnId = setInterval(spawnHeart, HEART_SPAWN_MS);
}

function endGame(won){
  if(!gameRunning && !won) return;

  gameRunning = false;
  if(timerId){ clearInterval(timerId); timerId = null; }
  if(spawnId){ clearInterval(spawnId); spawnId = null; }

  // Remove remaining hearts slowly
  setTimeout(clearHearts, 250);

  if(won){
    sfx("win");
    showOverlay(
      "Kamu berhasil! 💗",
      "Hatinya udah terkumpul. Sekarang kamu bisa buka surat maafnya.",
      false
    );
    btnOpenLetter.disabled = false;
  } else {
    sfx("lose");
    showOverlay(
      "Hampir! 🥺",
      `Waktunya habis. Kamu dapat ${score}/${TARGET_SCORE}. Coba lagi ya—aku tungguin.`,
      true
    );
  }
}

function resetAll(){
  setScore(0);
  setCombo(0);
  setTime(GAME_DURATION);
  btnOpenLetter.disabled = true;
  resultBox.classList.add("hidden");
  resultBox.textContent = "";

  gameRunning = false;
  if(timerId){ clearInterval(timerId); timerId = null; }
  if(spawnId){ clearInterval(spawnId); spawnId = null; }

  clearHearts();

  showOverlay(
    "Siap, Vany? 💗",
    "Klik hati yang muncul! Kumpulin 10 hati dalam 20 detik untuk membuka surat maaf.",
    true
  );
}

function scrollToLetter(){
  document.querySelector(".letter").scrollIntoView({behavior:"smooth", block:"start"});
}

function softScrollToGame(){
  document.querySelector(".game").scrollIntoView({behavior:"smooth", block:"start"});
}

// Letter buttons
btnForgive.addEventListener("click", () => {
  resultBox.classList.remove("hidden");
  resultBox.innerHTML = `
    <b>Makasi ya, Vany… 😭💗</b><br/>
    Aku janji bakal dengerin kamu, jaga perasaan kamu, dan buktiin aku bisa lebih baik.
    <br/><br/>
    <span style="opacity:.9">Mau nggak kita mulai dari pelan-pelan, bareng-bareng?</span>
  `;
  sfx("win");
});

btnNotYet.addEventListener("click", () => {
  resultBox.classList.remove("hidden");
  resultBox.innerHTML = `
    <b>Oke… aku ngerti. 😔</b><br/>
    Kamu berhak kesel. Aku nggak akan maksa.
    Tapi aku tetap mau berusaha sampai kamu ngerasa aman dan dihargai lagi.
    <br/><br/>
    <span style="opacity:.9">Kalau kamu siap, aku ada di sini.</span>
  `;
  sfx("lose");
});

// Top actions
btnStart.addEventListener("click", () => {
  softScrollToGame();
  showOverlay(
    "Ayo main dulu 💘",
    "Klik hati yang muncul! Kumpulin 10 hati dalam 20 detik untuk membuka surat.",
    true
  );
});

btnPlay.addEventListener("click", () => startGame());

btnReset.addEventListener("click", () => resetAll());

btnOpenLetter.addEventListener("click", () => {
  scrollToLetter();
  // little sparkle
  resultBox.classList.add("hidden");
  resultBox.textContent = "";
});

// Sound label updates
function updateSoundLabel(){
  soundLabel.textContent = `SFX: ${toggleSound.checked ? "ON" : "OFF"}`;
}
toggleSound.addEventListener("change", updateSoundLabel);
updateSoundLabel();

// Initialize
resetAll();

