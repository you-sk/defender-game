let startTime;
let timerInterval;
let gameRunning = false;
let bullets = [];
let enemies = [];
let allies = [];
let gameArea = document.getElementById("game");
let player = document.getElementById("player");
let alliesContainer = document.getElementById("allies");
let keysPressed = {};

function updateTimer() {
  if (!gameRunning) return;
  const now = performance.now();
  const elapsed = ((now - startTime) / 1000).toFixed(2);
  document.getElementById("timer").textContent = `${elapsed}秒`;
}

function createChar(char, x, y, className = "char", parent = gameArea) {
  const el = document.createElement("div");
  el.className = className;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.textContent = char;
  parent.appendChild(el);
  return el;
}

function createAlly(x) {
  const el = createChar("大", x, 580, "char", alliesContainer);
  allies.push({ el, x, dir: Math.random() < 0.5 ? -1 : 1 });
}

function shootBullet() {
  if (!gameRunning) return;
  const rect = player.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect();
  const bulletX = rect.left - gameRect.left + rect.width / 2 - 10;
  const bulletY = rect.top - gameRect.top - 10;
  const el = createChar("!!", bulletX, bulletY);
  bullets.push({ el, x: bulletX, y: bulletY });
}

function spawnEnemy() {
  const x = Math.random() * (gameArea.clientWidth - 20);
  const speed = 0.25 + Math.random() * 1.75;
  const el = createChar("@", x, 0);
  enemies.push({ el, x, y: 0, speed });
}

function explodeParts(x, y) {
  const parts = ["<", "(", "^", ")", ">"];
  parts.forEach((char, i) => {
    const angle = (Math.PI * 2 * i) / parts.length;
    const dx = Math.cos(angle) * 100;
    const dy = Math.sin(angle) * 100;
    const part = createChar(char, x, y, "part");
    part.style.setProperty("--x", `${dx}px`);
    part.style.setProperty("--y", `${dy}px`);
    setTimeout(() => part.remove(), 600);
  });
}

function updateGame() {
  if (!gameRunning) return;

  const left = parseFloat(player.style.left || "180");
  if (keysPressed["ArrowLeft"]) player.style.left = `${Math.max(0, left - 2.5)}px`;
  if (keysPressed["ArrowRight"]) player.style.left = `${Math.min(360, left + 2.5)}px`;

  bullets.forEach(b => {
    b.y -= 5;
    b.el.style.top = `${b.y}px`;
  });

  bullets = bullets.filter(b => {
    if (b.y <= 0) {
      b.el.remove();
      return false;
    }
    return true;
  });

  enemies.forEach(e => {
    e.y += e.speed;
    e.el.style.top = `${e.y}px`;
  });

  allies.forEach(a => {
    a.x += 0.5 * a.dir;
    if (a.x <= 0 || a.x >= 376) a.dir *= -1;
    a.el.style.left = `${a.x}px`;
  });

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        e.el.classList.add("explode");
        b.el.classList.add("explode");
        setTimeout(() => e.el.remove(), 300);
        setTimeout(() => b.el.remove(), 300);
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
      }
    });
  });

  enemies.forEach((e, ei) => {
    const eRect = e.el.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    if (
      eRect.left < playerRect.right &&
      eRect.right > playerRect.left &&
      eRect.top < playerRect.bottom &&
      eRect.bottom > playerRect.top
    ) {
      const px = parseFloat(player.style.left);
      const py = parseFloat(player.style.top);
      explodeParts(px, py);
      player.style.display = "none";
      gameOver();
    }

    allies.forEach((a, ai) => {
      const aRect = a.el.getBoundingClientRect();
      if (
        eRect.left < aRect.right &&
        eRect.right > aRect.left &&
        eRect.top < aRect.bottom &&
        eRect.bottom > aRect.top
      ) {
        a.el.classList.add("explode");
        e.el.classList.add("explode");
        setTimeout(() => a.el.remove(), 300);
        setTimeout(() => e.el.remove(), 300);
        allies.splice(ai, 1);
        enemies.splice(ei, 1);
      }
    });
  });

  if (allies.length === 0) gameOver();

  requestAnimationFrame(updateGame);
}

function startGame() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("player").style.display = "block";
  document.getElementById("overlay").style.display = "none";
  startTime = performance.now();
  timerInterval = setInterval(updateTimer, 10);
  gameRunning = true;
  const playerX = parseFloat(player.style.left || "180");
  [playerX - 60, playerX - 20, playerX + 20, playerX + 60].forEach(x => createAlly(x));
  spawnLoop(1);
  requestAnimationFrame(updateGame);
}

function spawnLoop(rate) {
  if (!gameRunning) return;
  for (let i = 0; i < rate; i++) spawnEnemy();
  setTimeout(() => spawnLoop(rate + 1), 1000);
}

function gameOver() {
  gameRunning = false;
  clearInterval(timerInterval);
  document.getElementById("overlay").style.display = "flex";
  const now = performance.now();
  const elapsed = ((now - startTime) / 1000).toFixed(2);
  document.getElementById("survivalTime").textContent = `生存時間 ${elapsed}秒`;
  enemies.forEach(e => e.el.remove());
  bullets.forEach(b => b.el.remove());
}

function restartGame() {
  location.reload();
}

document.getElementById("startButton").addEventListener("click", startGame);
document.addEventListener("keydown", e => {
  keysPressed[e.key] = true;
  if (!gameRunning) return;
  if (e.key === " ") shootBullet();
});

document.addEventListener("keyup", e => {
  keysPressed[e.key] = false;
});