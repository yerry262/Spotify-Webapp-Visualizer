// --- RAIN TETRIS STATE ---
// Define classic Tetris pieces (tetrominoes)
const TETROMINO_SHAPES = {
    I: [[1,1,1,1]], // Line
    O: [[1,1],[1,1]], // Square
    T: [[0,1,0],[1,1,1]], // T-shape
    S: [[0,1,1],[1,1,0]], // S-shape
    Z: [[1,1,0],[0,1,1]], // Z-shape
    J: [[1,0,0],[1,1,1]], // J-shape
    L: [[0,0,1],[1,1,1]]  // L-shape
};

const TETROMINO_COLORS = {
    I: 180, // Cyan
    O: 60,  // Yellow
    T: 280, // Purple
    S: 120, // Green
    Z: 0,   // Red
    J: 240, // Blue
    L: 30   // Orange
};

let rainTetrisState = {
    pieces: [],        // Active falling pieces
    settledGrid: {},   // Grid of settled blocks: key = "x,y", value = {hue, glow}
    lastBeat: 0,
    bpmInterval: 0.5,
    gridCols: 40,      // Doubled to make blocks half the size
    gridRows: 40,
    blockSize: 0,
    pieceCount: 0,     // Track total pieces dropped
    lastWaveform: 'rain_tetris'
};

// Helper function to reset Rain Tetris state
export function resetRainTetrisState() {
    rainTetrisState.pieces = [];
    rainTetrisState.settledGrid = {};
    rainTetrisState.pieceCount = 0;
    rainTetrisState.lastBeat = 0;
}

// Helper function to rotate tetromino shape
function rotateTetromino(shape, rotations) {
    let rotated = shape;
    for (let i = 0; i < rotations; i++) {
        const rows = rotated.length;
        const cols = rotated[0].length;
        const newShape = [];
        
        for (let c = 0; c < cols; c++) {
            const newRow = [];
            for (let r = rows - 1; r >= 0; r--) {
                newRow.push(rotated[r][c]);
            }
            newShape.push(newRow);
        }
        rotated = newShape;
    }
    return rotated;
}

export function drawRainTetrisWave(ctx, width, height, chroma, mel, beatPulse, time) {
    // Calculate block size to fill entire canvas
    const cols = rainTetrisState.gridCols;
    const blockSize = width / cols; // Use full width
    const rows = Math.floor(height / blockSize);
    rainTetrisState.blockSize = blockSize;
    rainTetrisState.gridRows = rows;
    
    // Check if we need to reset (60 pieces dropped or waveform changed)
    if (rainTetrisState.pieceCount >= 60) {
        rainTetrisState.pieces = [];
        rainTetrisState.settledGrid = {};
        rainTetrisState.pieceCount = 0;
    }
    
    // Detect dominant chroma for color selection
    let maxChroma = 0;
    let maxVal = 0;
    chroma.forEach((v, i) => { 
        if(v > maxVal) { 
            maxVal = v; 
            maxChroma = i; 
        } 
    });
    
    // Spawn new tetromino on beat (only if under 60 pieces)
    if (beatPulse > 0.7 && time - rainTetrisState.lastBeat > 0.4 && rainTetrisState.pieceCount < 60) {
        rainTetrisState.lastBeat = time;
        
        // Choose random tetromino type
        const types = Object.keys(TETROMINO_SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const baseShape = TETROMINO_SHAPES[type];
        
        // Random rotation: 0, 90, 180, or 270 degrees (0, 1, 2, or 3 rotations)
        const rotations = Math.floor(Math.random() * 4);
        const shape = rotateTetromino(baseShape, rotations);
        
        // Random spawn position across the X axis
        const pieceWidth = shape[0].length;
        const maxStartCol = cols - pieceWidth;
        const startCol = Math.floor(Math.random() * (maxStartCol + 1));
        
        // Add chroma influence to color
        const baseHue = TETROMINO_COLORS[type];
        const hue = (baseHue + maxChroma * 15) % 360;
        
        rainTetrisState.pieces.push({
            type: type,
            shape: shape,
            col: startCol,
            row: -shape.length, // Start above screen
            targetRow: -shape.length,
            hue: hue,
            glow: beatPulse,
            spawnTime: time,
            rotation: rotations
        });
        
        rainTetrisState.pieceCount++;
    }
    
    // Update pieces - slower fall speed
    const moveInterval = 1.5; 
    
    rainTetrisState.pieces = rainTetrisState.pieces.filter(piece => {
        const timeSinceSpawn = time - piece.spawnTime;
        const expectedRow = Math.floor(timeSinceSpawn / moveInterval) + piece.row;
        
        // Check if piece can move down
        if (canMovePiece(piece, piece.col, expectedRow + 1, cols, rows)) {
            // Smooth interpolation
            const moveFraction = (timeSinceSpawn % moveInterval) / moveInterval;
            const eased = moveFraction < 0.5 ? 2 * moveFraction * moveFraction : 1 - Math.pow(-2 * moveFraction + 2, 2) / 2;
            piece.row = expectedRow + eased;
            piece.targetRow = expectedRow + 1;
            
            // Decay glow
            piece.glow *= 0.95;
            return true; // Keep piece
        } else {
            // Lock piece in place
            lockPiece(piece, expectedRow, time);
            return false; // Remove piece
        }
    });
    
    // Clear completed lines
    clearCompletedLines(cols, rows);
    
    // Clean old settled blocks (fade out after 20 seconds)
    Object.keys(rainTetrisState.settledGrid).forEach(key => {
        const block = rainTetrisState.settledGrid[key];
        const timeSinceSettled = time - block.settleTime;
        
        // Only start fading after 20 seconds
        if (timeSinceSettled > 20) {
            block.glow *= 0.98;
            if (block.glow < 0.05) {
                delete rainTetrisState.settledGrid[key];
            }
        }
    });
    
    // Update last waveform
    rainTetrisState.lastWaveform = 'rain_tetris';
    
    // Draw settled blocks first
    Object.keys(rainTetrisState.settledGrid).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const block = rainTetrisState.settledGrid[key];
        
        const posX = x * blockSize;
        const posY = y * blockSize;
        
        // Glow effect
        const glowIntensity = Math.max(0.2, block.glow);
        ctx.shadowBlur = 10 + glowIntensity * 15;
        ctx.shadowColor = `hsl(${block.hue}, 100%, 50%)`;
        
        // Block color
        const saturation = 90;
        const lightness = 35 + block.glow * 25;
        ctx.fillStyle = `hsl(${block.hue}, ${saturation}%, ${lightness}%)`;
        
        // Draw block with slight padding
        const padding = 2;
        ctx.fillRect(
            posX + padding, 
            posY + padding, 
            blockSize - padding * 2, 
            blockSize - padding * 2
        );
        
        // Inner highlight
        ctx.fillStyle = `hsla(${block.hue}, 100%, 70%, ${0.2 + block.glow * 0.3})`;
        ctx.fillRect(
            posX + blockSize * 0.25, 
            posY + blockSize * 0.25, 
            blockSize * 0.3, 
            blockSize * 0.3
        );
    });
    
    // Draw active falling pieces
    rainTetrisState.pieces.forEach(piece => {
        const shape = piece.shape;
        
        // Glow effect (like Rhythm Snake)
        const glowIntensity = Math.max(0.4, piece.glow);
        ctx.shadowBlur = 20 + glowIntensity * 30;
        ctx.shadowColor = `hsl(${piece.hue}, 100%, 50%)`;
        
        // Draw each block of the tetromino
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const x = (piece.col + c) * blockSize;
                    const y = (piece.row + r) * blockSize;
                    
                    // Skip if off-screen top
                    if (y < -blockSize) continue;
                    
                    // Block color
                    const saturation = 95;
                    const lightness = 45 + piece.glow * 35;
                    ctx.fillStyle = `hsl(${piece.hue}, ${saturation}%, ${lightness}%)`;
                    
                    // Draw block with slight padding
                    const padding = 2;
                    ctx.fillRect(
                        x + padding, 
                        y + padding, 
                        blockSize - padding * 2, 
                        blockSize - padding * 2
                    );
                    
                    // Inner highlight for depth
                    ctx.fillStyle = `hsla(${piece.hue}, 100%, 75%, ${0.4 + piece.glow * 0.5})`;
                    ctx.fillRect(
                        x + blockSize * 0.25, 
                        y + blockSize * 0.25, 
                        blockSize * 0.3, 
                        blockSize * 0.3
                    );
                }
            }
        }
    });
    
    ctx.shadowBlur = 0;
}

// Helper function: Check if piece can move to new position
function canMovePiece(piece, newCol, newRow, gridCols, gridRows) {
    const shape = piece.shape;
    const floorRow = Math.floor(newRow);
    
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const x = newCol + c;
                const y = floorRow + r;
                
                // Check boundaries
                if (x < 0 || x >= gridCols || y >= gridRows) {
                    return false;
                }
                
                // Check collision with settled blocks
                const key = `${x},${y}`;
                if (rainTetrisState.settledGrid[key]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Helper function: Lock piece into settled grid
function lockPiece(piece, row, time) {
    const shape = piece.shape;
    const floorRow = Math.floor(row);
    
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const x = piece.col + c;
                const y = floorRow + r;
                
                // Add to settled grid
                if (y >= 0) {
                    const key = `${x},${y}`;
                    rainTetrisState.settledGrid[key] = {
                        hue: piece.hue,
                        glow: Math.max(0.5, piece.glow),
                        settleTime: time
                    };
                }
            }
        }
    }
}

// Helper function: Clear completed lines
function clearCompletedLines(gridCols, gridRows) {
    const linesToClear = [];
    
    // Check each row
    for (let y = 0; y < gridRows; y++) {
        let isComplete = true;
        for (let x = 0; x < gridCols; x++) {
            const key = `${x},${y}`;
            if (!rainTetrisState.settledGrid[key]) {
                isComplete = false;
                break;
            }
        }
        if (isComplete) {
            linesToClear.push(y);
        }
    }
    
    // Clear completed lines and shift blocks down
    linesToClear.forEach(lineY => {
        // Remove the line
        for (let x = 0; x < gridCols; x++) {
            const key = `${x},${lineY}`;
            delete rainTetrisState.settledGrid[key];
        }
        
        // Shift all blocks above down by one
        const newGrid = {};
        Object.keys(rainTetrisState.settledGrid).forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (y < lineY) {
                // Move block down
                const newKey = `${x},${y + 1}`;
                newGrid[newKey] = rainTetrisState.settledGrid[key];
            } else {
                // Keep block where it is
                newGrid[key] = rainTetrisState.settledGrid[key];
            }
        });
        rainTetrisState.settledGrid = newGrid;
    });
}
