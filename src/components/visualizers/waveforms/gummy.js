// --- GUMMY STATE ---
let gummyState = {
    hexagons: [],
    initialized: false
};

export function drawGummyWave(ctx, width, height, chroma, mel, beatPulse, time) {
    // Dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Initialize honeycomb grid structure (store relative positions only)
    if (!gummyState.initialized) {
        gummyState.hexagons = [];
        
        // Create honeycomb grid with relative positions
        for (let row = -7; row <= 7; row++) {
            for (let col = -7; col <= 7; col++) {
                gummyState.hexagons.push({ row, col });
            }
        }
        gummyState.initialized = true;
    }
    
    // Check window dimensions to determine number of hexagons
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isLandscape = windowWidth > windowHeight;
    const numHexagons = isLandscape ? 3 : 2;
    
    // Calculate spacing and size for multiple hexagons
    const mainRadius = Math.min(width / numHexagons, height) * 0.35 * (1 + beatPulse * 0.05);
    const spacing = width / numHexagons;
    
    // Draw each main hexagon
    for (let hexIndex = 0; hexIndex < numHexagons; hexIndex++) {
        const centerX = spacing * (hexIndex + 0.5);
        const centerY = height / 2;
        
        const hexSize = mainRadius / 6;
        const hexHeight = hexSize * Math.sqrt(3);
        const hexWidth = hexSize * 2;
        
        // Draw all honeycomb hexagons with rainbow gradient
        gummyState.hexagons.forEach((hex) => {
            // Calculate absolute position based on current dimensions
            const x = centerX + hex.col * hexWidth * 0.75;
            const y = centerY + hex.row * hexHeight + (hex.col % 2) * hexHeight * 0.5;
            
            // Check if hexagon is inside the main hexagon boundary
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist >= mainRadius * 0.9) return; // Skip hexagons outside boundary
            
            // Calculate position-based hue for rainbow effect
            const angle = Math.atan2(dy, dx);
            
            // Rainbow hue based on angle and distance, offset by hexagon index
            const baseHue = ((angle + Math.PI) / (Math.PI * 2)) * 360 + time * 20 + hexIndex * 120;
            const distFactor = (dist / mainRadius);
            const hue = (baseHue + distFactor * 120) % 360;
            
            // Get chroma value for this hue
            const chromaIndex = Math.floor((hue / 360) * 12) % 12;
            const chromaValue = chroma[chromaIndex] || 0;
            
            // Get mel value based on position and hexagon index
            const melIndex = Math.floor((distFactor + hexIndex / numHexagons) * (mel?.length - 1 || 0)) % mel?.length;
            const melValue = mel && mel[melIndex] ? mel[melIndex] : 0;
            
            // Color intensity reacts to music
            const saturation = 75 + chromaValue * 25;
            const lightness = 60 + melValue * 15 + beatPulse * 10;
            const scale = 1 + melValue * 0.1 + beatPulse * 0.08;
            
            // Draw hexagon
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const hexAngle = (Math.PI / 3) * i;
                const px = Math.cos(hexAngle) * hexSize;
                const py = Math.sin(hexAngle) * hexSize;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            // Gradient fill
            const gradient = ctx.createRadialGradient(
                -hexSize * 0.3, -hexSize * 0.3, 0,
                0, 0, hexSize
            );
            gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 15}%)`);
            gradient.addColorStop(0.7, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
            gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`);
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Black outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Glossy highlight
            const highlightGrad = ctx.createRadialGradient(
                -hexSize * 0.35, -hexSize * 0.35, 0,
                -hexSize * 0.35, -hexSize * 0.35, hexSize * 0.5
            );
            highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            ctx.arc(-hexSize * 0.25, -hexSize * 0.25, hexSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Draw large hexagon border (tan/beige outline)
        ctx.save();
        ctx.translate(centerX, centerY);
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = Math.cos(angle) * mainRadius;
            const y = Math.sin(angle) * mainRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Tan border with gradient
        const borderGradient = ctx.createLinearGradient(-mainRadius, -mainRadius, mainRadius, mainRadius);
        borderGradient.addColorStop(0, '#a08060');
        borderGradient.addColorStop(0.5, '#c0a080');
        borderGradient.addColorStop(1, '#806040');
        
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 25 + beatPulse * 5;
        ctx.stroke();
        
        // Inner shadow on border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.restore();
    }
}
