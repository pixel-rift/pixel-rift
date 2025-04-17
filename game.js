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

function exchangeGoldForHealing() {
    if (gold >= 50) {
        gold -= 50;
        updateGoldDisplay();
        updatePVBar(currentPV + 50);
    } else alert("Pas assez d'or pour se soigner !");
}

document.getElementById('shopButton').addEventListener('click', () => {
    document.getElementById('shopInterface').style.display = 'block';
});
document.getElementById('closeShopButton').addEventListener('click', () => {
    document.getElementById('shopInterface').style.display = 'none';
});
document.getElementById('goldButton').addEventListener('click', exchangePointsForGold);

// Ajout du bouton de soin
const healingBox = document.createElement('div');
healingBox.style.width = '100px';
healingBox.style.height = '100px';
healingBox.style.backgroundColor = 'green';
healingBox.style.margin = '20px auto';

const healingButton = document.createElement('button');
healingButton.textContent = 'Soin (50 gold)';
healingButton.onclick = exchangeGoldForHealing;

const shopInterface = document.getElementById('shopInterface');
shopInterface.appendChild(healingBox);
shopInterface.appendChild(healingButton);

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

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    movePlayer();
    ctx.drawImage(squareImage, square.x, square.y, square.size, square.size);

    blocks.forEach(b => {
        if (!shopOpen) {
            b.x += b.dx; b.y += b.dy;
            if (b.x <= 0 || b.x + b.size >= canvas.width) b.dx *= -1;
            if (b.y <= 0 || b.y + b.size >= canvas.height) b.dy *= -1;
        }
        ctx.drawImage(blockImage, b.x, b.y, b.size, b.size);
    });

    rareBlocks.forEach(b => {
        if (!shopOpen) {
            b.x += b.dx; b.y += b.dy;
            if (b.x <= 0 || b.x + b.size >= canvas.width) b.dx *= -1;
            if (b.y <= 0 || b.y + b.size >= canvas.height) b.dy *= -1;
            if (Math.random() < 0.02) createFireball(b.x, b.y);
        }
        ctx.drawImage(rareBlockImage, b.x, b.y, b.size, b.size);
    });

    healingSquares.forEach(h => ctx.drawImage(healingSquareImage, h.x, h.y, h.size, h.size));
    goldCoins.forEach(c => ctx.drawImage(goldCoinImage, c.x, c.y, c.size, c.size));
    projectiles.forEach(p => { p.x += p.dx; p.y += p.dy; ctx.drawImage(projectileImage, p.x, p.y, p.size, p.size); });

    drawScore();
    checkProjectileCollisions();
    checkBlockCollisionWithSquare();
    checkFireballCollisions();
    updateFireballs();
    checkHealingSquareCollision();
    checkGoldCoinCollision();
    if (Math.random() < 0.01) createBlock();
    requestAnimationFrame(gameLoop);
}

gameLoop();

canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('click', () => shootProjectile());
