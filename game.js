// Ton canvas et contexte
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Chargement des images
const backgroundImage = new Image(); backgroundImage.src = './images/fond.png';
const squareImage = new Image(); squareImage.src = './images/personnage.png';
const projectileImage = new Image(); projectileImage.src = './images/fireball.png';
const bosseProjectileImage = new Image(); bosseProjectileImage.src = './images/fireball-boss.png';
const blockImage = new Image(); blockImage.src = './images/monstre.png';
const goldCoinImage = new Image(); goldCoinImage.src = './images/or.png';
const rareBlockImage = new Image(); rareBlockImage.src = './images/boss.png';
const healingSquareImage = new Image(); healingSquareImage.src = './images/soin.png';

// Joueur
const square = { x: canvas.width / 2 - 32, y: canvas.height / 2 - 32, size: 64, speed: 4 };

const blocks = [], rareBlocks = [], goldCoins = [], projectiles = [], fireballs = [], healingSquares = [];
const blockSize = 85, safeDistance = 100, minExchangeScore = 10, projectileSpeed = 5;
let shopOpen = false, score = 0, availableProjectiles = 100, gold = 0;
let showHitboxes = false; // Ajout pour afficher les hitboxes

const goldDisplay = document.getElementById('goldDisplay');
const maxPV = 100; let currentPV = 100;

function updatePVBar(pv) {
    currentPV = Math.max(0, Math.min(maxPV, pv));
    const pvBar = document.getElementById("pv-bar");
    const percent = (currentPV / maxPV) * 100;
    pvBar.style.width = percent + "%";
    pvBar.style.backgroundColor = percent > 60 ? "green" : percent > 30 ? "orange" : "red";
    if (percent <= 0) window.location.reload();
}

function updateGoldDisplay() {
    goldDisplay.textContent = 'Gold : ' + gold;
}

function createHealingSquare(x, y) {
    healingSquares.push({
        x: x + blockSize / 2,
        y: y + blockSize / 2,
        size: 40
    });
}

function exchangePointsForGold() {
    if (score >= minExchangeScore) {
        score -= minExchangeScore;
        gold += 5;
        updateGoldDisplay();
    } else alert("Vous n'avez pas assez de points!");
}

document.getElementById('shopButton').addEventListener('click', () => {
    document.getElementById('shopInterface').style.display = 'block';
});
document.getElementById('closeShopButton').addEventListener('click', () => {
    document.getElementById('shopInterface').style.display = 'none';
});
document.getElementById('goldButton').addEventListener('click', exchangePointsForGold);

const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

function createBlock() {
    let block, isValid = false;
    while (!isValid) {
        block = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: blockSize,
            dx: Math.random() * 4 - 2,
            dy: Math.random() * 4 - 2
        };
        if (Math.abs(block.x - square.x) > square.size + safeDistance && Math.abs(block.y - square.y) > square.size + safeDistance) isValid = true;
    }
    (Math.random() < 1.5 / 20 ? rareBlocks : blocks).push(block);
}

function createGoldCoin(x, y) {
    goldCoins.push({ x: x + blockSize / 2, y: y + blockSize / 2, size: 40 });
}

function checkGoldCoinCollision() {
    goldCoins.forEach((coin, i) => {
        if (coin.x < square.x + square.size && coin.x + coin.size > square.x && coin.y < square.y + square.size && coin.y + coin.size > square.y) {
            gold++; goldCoins.splice(i, 1); updateGoldDisplay();
        }
    });
}

function createFireball(x, y) {
    const dx = square.x - x, dy = square.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 4;
    fireballs.push({
        x: x + blockSize / 1.2,
        y: y + blockSize / 1.2,
        size: 20,
        dx: (dx / distance) * speed,
        dy: (dy / distance) * speed
    });
}

function updateFireballs() {
    fireballs.forEach((f, i) => {
        f.x += f.dx; f.y += f.dy;
        ctx.drawImage(bosseProjectileImage, f.x, f.y, f.size, f.size);
        if (f.x < 0 || f.x > canvas.width || f.y < 0 || f.y > canvas.height) fireballs.splice(i, 1);
    });
}

function checkFireballCollisions() {
    fireballs.forEach((f, i) => {
        if (f.x < square.x + square.size && f.x + f.size > square.x && f.y < square.y + square.size && f.y + f.size > square.y) {
            fireballs.splice(i, 1);
            currentPV -= 20; updatePVBar(currentPV);
        }
    });
}

function shootProjectile() {
    if (availableProjectiles > 0 && !shopOpen) {
        const dx = (mouse.x - square.x), dy = (mouse.y - square.y);
        const dist = distance(mouse.x, mouse.y, square.x, square.y);
        projectiles.push({
            x: square.x + square.size / 2,
            y: square.y + square.size / 2,
            size: 30,
            dx: dx * projectileSpeed / dist,
            dy: dy * projectileSpeed / dist
        });
        availableProjectiles--;
    }
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function drawScore() {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 20, 40);
    ctx.fillText('Projectiles: ' + availableProjectiles, 20, 80);
}

function checkProjectileCollisions() {
    projectiles.forEach((p, pIndex) => {
        blocks.forEach((b, bIndex) => {
            if (p.x > b.x && p.x < b.x + b.size && p.y > b.y && p.y < b.y + b.size) {
                blocks.splice(bIndex, 1); projectiles.splice(pIndex, 1);
                score += 1; availableProjectiles += 2;
                if (Math.random() < 0.1) createGoldCoin(b.x, b.y);
                if (Math.random() < 1 / 20) createHealingSquare(b.x, b.y);
            }
        });
        rareBlocks.forEach((b, rbIndex) => {
            if (p.x > b.x && p.x < b.x + b.size && p.y > b.y && p.y < b.y + b.size) {
                rareBlocks.splice(rbIndex, 1); projectiles.splice(pIndex, 1);
                score += 5; availableProjectiles += 10;
                if (Math.random() < 0.1) createGoldCoin(b.x, b.y);
                if (Math.random() < 1 / 20) createHealingSquare(b.x, b.y);
            }
        });
    });
}

function checkHealingSquareCollision() {
    healingSquares.forEach((heal, i) => {
        if (
            heal.x < square.x + square.size &&
            heal.x + heal.size > square.x &&
            heal.y < square.y + square.size &&
            heal.y + heal.size > square.y
        ) {
            healingSquares.splice(i, 1);
            updatePVBar(currentPV + 30);
        }
    });
}

function checkBlockCollisionWithSquare() {
    blocks.forEach((b, i) => {
        if (b.x < square.x + square.size && b.x + b.size > square.x && b.y < square.y + square.size && b.y + b.size > square.y) {
            blocks.splice(i, 1); availableProjectiles = 100;
            currentPV -= 20; updatePVBar(currentPV);
        }
    });
    rareBlocks.forEach((b, i) => {
        if (b.x < square.x + square.size && b.x + b.size > square.x && b.y < square.y + square.size && b.y + b.size > square.y) {
            rareBlocks.splice(i, 1); availableProjectiles = 100;
            currentPV -= 20; updatePVBar(currentPV);
        }
    });
}

function movePlayer() {
    if (joystickActive) {
        square.x += joystickDir.x * square.speed;
        square.y += joystickDir.y * square.speed;
    } else {
        if (keys['w'] && square.y > 0) square.y -= square.speed;
        if (keys['s'] && square.y + square.size < canvas.height) square.y += square.speed;
        if (keys['a'] && square.x > 0) square.x -= square.speed;
        if (keys['d'] && square.x + square.size < canvas.width) square.x += square.speed;
    }

    square.x = Math.max(0, Math.min(canvas.width - square.size, square.x));
    square.y = Math.max(0, Math.min(canvas.height - square.size, square.y));
}

let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickDir = { x: 0, y: 0 };

const joystick = document.getElementById("joystick");
const joystickContainer = document.getElementById("joystickContainer");

joystickContainer.addEventListener("touchstart", (e) => {
    joystickActive = true;
    const touch = e.touches[0];
    joystickCenter = { x: touch.clientX, y: touch.clientY };
});

joystickContainer.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenter.x;
    const dy = touch.clientY - joystickCenter.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
    const angle = Math.atan2(dy, dx);

    joystickDir.x = Math.cos(angle) * (distance / 40);
    joystickDir.y = Math.sin(angle) * (distance / 40);

    joystick.style.left = 30 + joystickDir.x * 30 + "px";
    joystick.style.top = 30 + joystickDir.y * 30 + "px";
}, { passive: false });

joystickContainer.addEventListener("touchend", () => {
    joystickActive = false;
    joystickDir = { x: 0, y: 0 };
    joystick.style.left = "30px";
    joystick.style.top = "30px";
});

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'k') showHitboxes = !showHitboxes;
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    movePlayer();

    ctx.drawImage(squareImage, square.x, square.y, square.size, square.size);
    if (showHitboxes) {
        ctx.strokeStyle = 'cyan';
        ctx.strokeRect(square.x, square.y, square.size, square.size);
    }

    blocks.forEach(b => {
        if (!shopOpen) {
            b.x += b.dx; b.y += b.dy;
            if (b.x <= 0 || b.x + b.size >= canvas.width) b.dx *= -1;
            if (b.y <= 0 || b.y + b.size >= canvas.height) b.dy *= -1;
        }
        ctx.drawImage(blockImage, b.x, b.y, b.size, b.size);
        if (showHitboxes) {
            ctx.strokeStyle = 'red';
            ctx.strokeRect(b.x, b.y, b.size, b.size);
        }
    });

    rareBlocks.forEach(b => {
        if (!shopOpen) {
            b.x += b.dx; b.y += b.dy;
            if (b.x <= 0 || b.x + b.size >= canvas.width) b.dx *= -1;
            if (b.y <= 0 || b.y + b.size >= canvas.height) b.dy *= -1;
            if (Math.random() < 0.02) createFireball(b.x, b.y);
        }
        ctx.drawImage(rareBlockImage, b.x, b.y, b.size, b.size);
        if (showHitboxes) {
            ctx.strokeStyle = 'purple';
            ctx.strokeRect(b.x, b.y, b.size, b.size);
        }
    });

    healingSquares.forEach(h => ctx.drawImage(healingSquareImage, h.x, h.y, h.size, h.size));
    goldCoins.forEach(c => ctx.drawImage(goldCoinImage, c.x, c.y, c.size, c.size));
    projectiles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        ctx.drawImage(projectileImage, p.x, p.y, p.size, p.size);
    });

    drawScore();
    checkProjectileCollisions();
    checkBlockCollisionWithSquare();
    checkFireballCollisions();ad
    updateFireballs();
    checkHealingSquareCollision();
    checkGoldCoinCollision();
    if (Math.random() < 0.01) createBlock();
    requestAnimationFrame(gameLoop);
}

gameLoop();

canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('click', () => shootProjectile());
//ca va vous ?    :)