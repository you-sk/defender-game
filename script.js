let startTime = 0;
let timerInterval;
let gameRunning = false;
let bullets = [];
let enemies = [];
let allies = [];
let gameArea = document.getElementById("game");
let player = document.getElementById("player");
let alliesContainer = document.getElementById("allies");
let keysPressed = {};
let lastShotTime = 0;
let score = 0;
let lastAllyScore = 0;
let lastBombScore = 0;

function updateTimer() {
  if (!gameRunning) return;
  const now = performance.now();
  const elapsed = ((now - startTime) / 1000).toFixed(2);
  document.getElementById("timer").innerHTML = `${elapsed}秒 <span style="color: yellow;">Score: ${score}</span>`;
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
  allies.push({ 
    el, 
    x, 
    dir: Math.random() < 0.5 ? -1 : 1,
    speed: 0.3 + Math.random() * 0.7,
    nextDirChange: Date.now() + 1000 + Math.random() * 3000
  });
}

function shootBullet() {
  if (!gameRunning) return;
  const now = Date.now();
  if (now - lastShotTime < 150) return;
  lastShotTime = now;
  const rect = player.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect();
  const bulletX = rect.left - gameRect.left + rect.width / 2 - 10;
  const bulletY = rect.top - gameRect.top - 10;
  const el = createChar("!!", bulletX, bulletY);
  bullets.push({ el, x: bulletX, y: bulletY });
}

function spawnEnemy() {
  const x = Math.random() * (gameArea.clientWidth - 20);
  const enemyType = Math.random();
  
  if (enemyType < 0.7) {
    const speed = 0.25 + Math.random() * 1.75;
    const el = createChar("@", x, 0);
    enemies.push({ el, x, y: 0, speed, type: "normal", points: 10 });
  } else if (enemyType < 0.9) {
    const speed = 2.5 + Math.random() * 1.5;
    const el = createChar("*", x, 0);
    el.style.color = "yellow";
    enemies.push({ el, x, y: 0, speed, type: "fast", points: 30 });
  } else {
    const speed = 0.15 + Math.random() * 0.35;
    const el = createChar("■", x, 0);
    el.style.color = "red";
    el.style.fontSize = "32px";
    enemies.push({ el, x, y: 0, speed, type: "heavy", health: 3, points: 50 });
  }
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

function showScore(x, y, points) {
  const scoreEl = createChar(`+${points}`, x, y, "char");
  scoreEl.style.color = points >= 50 ? "gold" : points >= 30 ? "yellow" : "white";
  scoreEl.style.fontSize = "16px";
  scoreEl.style.zIndex = "1000";
  scoreEl.style.animation = "scoreFloat 1s ease-out forwards";
  setTimeout(() => scoreEl.remove(), 1000);
}

function checkScoreEvents() {
  if (Math.floor(score / 500) > Math.floor(lastBombScore / 500)) {
    clearAllEnemies();
    showMessage("全敵撃破！", "gold");
    lastBombScore = score;
    lastAllyScore = score;
  } else if (Math.floor(score / 100) > Math.floor(lastAllyScore / 100)) {
    const playerX = parseFloat(player.style.left || "180");
    const newAllyX = playerX + (Math.random() - 0.5) * 200;
    createAlly(Math.max(0, Math.min(376, newAllyX)));
    showMessage("味方追加！", "lightgreen");
    lastAllyScore = score;
  }
}

function showMessage(text, color) {
  const messageEl = createChar(text, 200, 250, "char");
  messageEl.style.color = color;
  messageEl.style.fontSize = "32px";
  messageEl.style.fontWeight = "bold";
  messageEl.style.width = "100%";
  messageEl.style.textAlign = "center";
  messageEl.style.left = "0";
  messageEl.style.zIndex = "2000";
  messageEl.style.animation = "messageFlash 1.5s ease-out forwards";
  setTimeout(() => messageEl.remove(), 1500);
}

function clearAllEnemies() {
  enemies.forEach(e => {
    e.el.classList.add("explode");
    setTimeout(() => e.el.remove(), 300);
    const bombParts = ["*", "*", "*", "*"];
    bombParts.forEach((char, i) => {
      const angle = (Math.PI * 2 * i) / bombParts.length;
      const dx = Math.cos(angle) * 150;
      const dy = Math.sin(angle) * 150;
      const part = createChar(char, e.x, e.y, "part");
      part.style.color = "gold";
      part.style.setProperty("--x", `${dx}px`);
      part.style.setProperty("--y", `${dy}px`);
      setTimeout(() => part.remove(), 600);
    });
  });
  enemies = [];
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

  enemies = enemies.filter(e => {
    e.y += e.speed;
    e.el.style.top = `${e.y}px`;
    if (e.y > gameArea.clientHeight) {
      e.el.remove();
      return false;
    }
    return true;
  });

  allies.forEach(a => {
    const now = Date.now();
    if (now > a.nextDirChange) {
      if (Math.random() < 0.3) {
        a.dir *= -1;
      }
      a.speed = 0.3 + Math.random() * 0.7;
      a.nextDirChange = now + 1000 + Math.random() * 3000;
    }
    
    a.x += a.speed * a.dir;
    if (a.x <= 0 || a.x >= 376) {
      a.dir *= -1;
      a.x = Math.max(0, Math.min(376, a.x));
    }
    a.el.style.left = `${a.x}px`;
  });

  let bulletsToRemove = [];
  let enemiesToRemove = [];
  
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        if (e.type === "heavy" && e.health > 1) {
          e.health--;
          e.el.style.opacity = e.health / 3;
          b.el.classList.add("explode");
          setTimeout(() => b.el.remove(), 300);
          bulletsToRemove.push(bi);
        } else {
          e.el.classList.add("explode");
          b.el.classList.add("explode");
          setTimeout(() => e.el.remove(), 300);
          setTimeout(() => b.el.remove(), 300);
          enemiesToRemove.push(ei);
          bulletsToRemove.push(bi);
          score += e.points || 10;
          showScore(e.x, e.y, e.points || 10);
          checkScoreEvents();
        }
      }
    });
  });
  
  enemiesToRemove = [...new Set(enemiesToRemove)].sort((a, b) => b - a);
  bulletsToRemove = [...new Set(bulletsToRemove)].sort((a, b) => b - a);
  
  enemiesToRemove.forEach(i => enemies.splice(i, 1));
  bulletsToRemove.forEach(i => bullets.splice(i, 1));

  let enemyRemovalList = [];
  let allyRemovalList = [];
  
  enemies.forEach((e, ei) => {
    const eRect = e.el.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    if (
      eRect.left < playerRect.right &&
      eRect.right > playerRect.left &&
      eRect.top < playerRect.bottom &&
      eRect.bottom > playerRect.top
    ) {
      e.el.classList.add("explode");
      setTimeout(() => e.el.remove(), 300);
      enemyRemovalList.push(ei);
      score += e.points || 10;
      showScore(e.x, e.y, e.points || 10);
      checkScoreEvents();
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
        allyRemovalList.push(ai);
        enemyRemovalList.push(ei);
      }
    });
  });
  
  enemyRemovalList = [...new Set(enemyRemovalList)].sort((a, b) => b - a);
  allyRemovalList = [...new Set(allyRemovalList)].sort((a, b) => b - a);
  
  enemyRemovalList.forEach(i => enemies.splice(i, 1));
  allyRemovalList.forEach(i => allies.splice(i, 1));

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
  score = 0;
  lastShotTime = 0;
  lastAllyScore = 0;
  lastBombScore = 0;
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
  
  if (startTime === 0) {
    document.getElementById("survivalTime").innerHTML = `生存時間 0.00秒`;
    return;
  }
  
  const now = performance.now();
  const elapsed = ((now - startTime) / 1000).toFixed(2);
  const elapsedFloat = parseFloat(elapsed);
  
  const highScore = localStorage.getItem("highScore") || "0";
  const highScoreFloat = parseFloat(highScore);
  
  if (elapsedFloat > highScoreFloat) {
    localStorage.setItem("highScore", elapsed);
    document.getElementById("survivalTime").innerHTML = `生存時間 ${elapsed}秒<br><span style="color: yellow;">新記録！</span><br>最長生存時間: ${elapsed}秒<br>スコア: ${score}`;
  } else {
    document.getElementById("survivalTime").innerHTML = `生存時間 ${elapsed}秒<br>最長生存時間: ${highScore}秒<br>スコア: ${score}`;
  }
  
  enemies.forEach(e => e.el.remove());
  bullets.forEach(b => b.el.remove());
}

function restartGame() {
  location.reload();
}

document.getElementById("startButton").addEventListener("click", startGame);
document.addEventListener("keydown", e => {
  keysPressed[e.key] = true;
  
  if (document.getElementById("titleScreen").style.display !== "none" && e.key === "Enter") {
    startGame();
    return;
  }
  
  if (document.getElementById("overlay").style.display === "flex" && e.key === "Enter") {
    restartGame();
    return;
  }
  
  if (!gameRunning) return;
  if (e.key === " ") shootBullet();
});

document.addEventListener("keyup", e => {
  keysPressed[e.key] = false;
});