import { CHROMA_HUES, drawWaveLabels } from '../waveformCore';

// --- SNAKE STATE ---
let snakeState = {
    snake: [],
    dir: {x:1, y:0},
    food: null,
    foodCount: 0,
    growPending: 0,
    lastStep: 0,
    eatFlash: 0,   // time of last meal, for the chomp burst
    eatX: 0,
    eatY: 0
};

// Grid size
const SNAKE_GRID = 30;

export function resetSnakeState() {
    snakeState.snake = [];
    snakeState.dir = {x:1, y:0};
    snakeState.food = null;
    snakeState.foodCount = 0;
    snakeState.growPending = 0;
    snakeState.lastStep = 0;
    snakeState.eatFlash = 0;
}

export function drawSnakeWave(ctx, width, height, chroma, mel, beatPulse, time) {
    const cellSize = width / SNAKE_GRID;
    const gridH = Math.max(4, Math.floor(height / cellSize));

    const rand = (seed) => {
        const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return v - Math.floor(v);
    };

    let melEnergy = 0.5;
    if (mel && mel.length > 0) {
        const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
        melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
    }

    let dominantIdx = 0;
    for (let i = 1; i < 12; i++) {
        if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
    }

    // Initialize snake
    if (snakeState.snake.length === 0) {
        const midY = Math.floor(gridH / 2);
        snakeState.snake = [{x: 15, y: midY}, {x: 14, y: midY}, {x: 13, y: midY}, {x: 12, y: midY}];
        snakeState.dir = {x: 1, y: 0};
    }

    const isBody = (x, y) => snakeState.snake.some(seg => seg.x === x && seg.y === y);

    // Spawn food deterministically, colored by the dominant note at spawn time
    if (!snakeState.food || snakeState.food.y >= gridH) {
        let fx, fy, tries = 0;
        do {
            fx = Math.floor(rand(snakeState.foodCount * 7.3 + tries) * SNAKE_GRID);
            fy = Math.floor(rand(snakeState.foodCount * 13.7 + tries + 50) * gridH);
            tries++;
        } while (isBody(fx, fy) && tries < 40);
        snakeState.food = { x: fx, y: fy, hue: CHROMA_HUES[dominantIdx] };
    }

    // Step interval rides the music: faster when loud, burst on beats
    const stepInterval = Math.max(0.045, 0.16 - melEnergy * 0.08 - beatPulse * 0.05);

    // Survive seeks: playback time can jump backwards
    if (time < snakeState.lastStep) snakeState.lastStep = time;

    if (time - snakeState.lastStep > stepInterval) {
        snakeState.lastStep = time;

        const head = snakeState.snake[0];
        const food = snakeState.food;

        // Auto-player AI: head toward the food, wrap-aware, avoid own body
        const wrapDelta = (a, b, size) => {
            let d = b - a;
            if (d > size / 2) d -= size;
            if (d < -size / 2) d += size;
            return d;
        };
        const dx = wrapDelta(head.x, food.x, SNAKE_GRID);
        const dy = wrapDelta(head.y, food.y, gridH);

        // Preference order: primary axis toward food, then secondary, then anything safe
        const candidates = [];
        if (Math.abs(dx) >= Math.abs(dy)) {
            if (dx !== 0) candidates.push({x: Math.sign(dx), y: 0});
            if (dy !== 0) candidates.push({x: 0, y: Math.sign(dy)});
        } else {
            if (dy !== 0) candidates.push({x: 0, y: Math.sign(dy)});
            if (dx !== 0) candidates.push({x: Math.sign(dx), y: 0});
        }
        candidates.push({x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0});

        let moved = false;
        for (const c of candidates) {
            // No 180-degree turns
            if (c.x === -snakeState.dir.x && c.y === -snakeState.dir.y) continue;
            const tx = (head.x + c.x + SNAKE_GRID) % SNAKE_GRID;
            const ty = (head.y + c.y + gridH) % gridH;
            if (isBody(tx, ty)) continue;
            snakeState.dir = c;
            snakeState.snake.unshift({x: tx, y: ty});
            moved = true;
            break;
        }
        if (!moved) {
            // Completely boxed in (rare): shed the tail to free a cell
            snakeState.snake.pop();
        } else {
            // Eat check
            const newHead = snakeState.snake[0];
            if (newHead.x === food.x && newHead.y === food.y) {
                snakeState.growPending += 3;
                snakeState.foodCount++;
                snakeState.eatFlash = time;
                snakeState.eatX = food.x;
                snakeState.eatY = food.y;
                snakeState.food = null;
            }

            if (snakeState.growPending > 0) {
                snakeState.growPending--;
            } else {
                snakeState.snake.pop();
            }
            // Cap length so the board never chokes
            while (snakeState.snake.length > 40) snakeState.snake.pop();
        }
    }

    // Faint grid
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + beatPulse * 0.03})`;
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= SNAKE_GRID; gx += 3) {
        ctx.beginPath();
        ctx.moveTo(gx * cellSize, 0);
        ctx.lineTo(gx * cellSize, gridH * cellSize);
        ctx.stroke();
    }
    for (let gy = 0; gy <= gridH; gy += 3) {
        ctx.beginPath();
        ctx.moveTo(0, gy * cellSize);
        ctx.lineTo(SNAKE_GRID * cellSize, gy * cellSize);
        ctx.stroke();
    }

    // Food: pulsing glowing pellet in its note's color
    if (snakeState.food) {
        const f = snakeState.food;
        const pulse = 1 + Math.sin(time * 6) * 0.25 + beatPulse * 0.4;
        ctx.fillStyle = `hsl(${f.hue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${f.hue}, 100%, 55%)`;
        ctx.shadowBlur = 12 + beatPulse * 12;
        ctx.beginPath();
        ctx.arc((f.x + 0.5) * cellSize, (f.y + 0.5) * cellSize, cellSize * 0.32 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Chomp burst where the last meal happened
    const sinceEat = time - snakeState.eatFlash;
    if (snakeState.eatFlash > 0 && sinceEat >= 0 && sinceEat < 0.45) {
        const p = sinceEat / 0.45;
        ctx.strokeStyle = `hsla(${CHROMA_HUES[dominantIdx]}, 100%, 65%, ${(1 - p) * 0.8})`;
        ctx.lineWidth = 2 + (1 - p) * 3;
        ctx.beginPath();
        ctx.arc((snakeState.eatX + 0.5) * cellSize, (snakeState.eatY + 0.5) * cellSize, cellSize * (0.4 + p * 2.2), 0, Math.PI * 2);
        ctx.stroke();
    }

    // Snake body: chroma rainbow flowing along the segments, brighter on beat
    const len = snakeState.snake.length;
    ctx.shadowColor = `hsl(${CHROMA_HUES[dominantIdx]}, 100%, 50%)`;
    ctx.shadowBlur = 8 + beatPulse * 14;
    for (let i = len - 1; i >= 0; i--) {
        const p = snakeState.snake[i];
        const hue = (CHROMA_HUES[dominantIdx] + i * 12 + time * 40) % 360;
        const light = 50 + beatPulse * 15 - (i / len) * 15;
        const inset = 1 + (i / len) * cellSize * 0.15;
        ctx.fillStyle = `hsl(${hue}, 95%, ${light}%)`;
        ctx.beginPath();
        const rr = Math.max(2, (cellSize - inset * 2) * 0.3);
        ctx.roundRect(p.x * cellSize + inset, p.y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2, rr);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Head with eyes looking where it's going
    const head = snakeState.snake[0];
    const hx = (head.x + 0.5) * cellSize;
    const hy = (head.y + 0.5) * cellSize;
    const eyeOff = cellSize * 0.18;
    const px = snakeState.dir.x, py = snakeState.dir.y;
    // Perpendicular for eye separation
    const ex = -py * eyeOff, ey = px * eyeOff;
    const lookX = px * cellSize * 0.12, lookY = py * cellSize * 0.12;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(hx + ex + lookX, hy + ey + lookY, cellSize * 0.13, 0, Math.PI * 2);
    ctx.arc(hx - ex + lookX, hy - ey + lookY, cellSize * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(hx + ex + lookX * 1.6, hy + ey + lookY * 1.6, cellSize * 0.06, 0, Math.PI * 2);
    ctx.arc(hx - ex + lookX * 1.6, hy - ey + lookY * 1.6, cellSize * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Tongue flicks on beats
    if (beatPulse > 0.5) {
        ctx.strokeStyle = `hsla(0, 90%, 60%, ${beatPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx + px * cellSize * 0.4, hy + py * cellSize * 0.4);
        ctx.lineTo(hx + px * cellSize * (0.4 + beatPulse * 0.5), hy + py * cellSize * (0.4 + beatPulse * 0.5));
        ctx.stroke();
    }

    // Score: pellets eaten this run
    ctx.font = `bold ${Math.floor(cellSize * 0.8)}px monospace`;
    ctx.fillStyle = `hsla(${CHROMA_HUES[dominantIdx]}, 80%, 65%, 0.7)`;
    ctx.fillText(`${snakeState.foodCount}`, cellSize * 0.5, cellSize * 1.2);

    drawWaveLabels(ctx, width, height, chroma);
}
