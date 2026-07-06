import { CHROMA_HUES } from '../waveformCore';

// --- DVD BOUNCER STATE ---
let dvdBouncerState = {
    x: 100,
    y: 100,
    vx: 2,
    vy: 1.5,
    hue: 0,
    cornerHitTime: 0,
    lastBounce: 0,
    initialized: false
};

export function drawDVDBouncerWave(ctx, width, height, chroma, mel, beatPulse, time) {
    // Initialize position if first time
    if (!dvdBouncerState.initialized) {
        dvdBouncerState.x = width / 2;
        dvdBouncerState.y = height / 2;
        dvdBouncerState.initialized = true;
    }
    
    // DVD logo size
    const logoWidth = Math.min(width, height) * 0.2;
    const logoHeight = logoWidth * 0.6;
    
    // Get dominant chroma for base color
    let maxChroma = 0;
    let maxVal = 0;
    chroma.forEach((v, i) => { 
        if(v > maxVal) { 
            maxVal = v; 
            maxChroma = i; 
        } 
    });
    
    // Calculate average energy for speed boost
    let avgEnergy = 0;
    if (mel && mel.length) {
        avgEnergy = mel.reduce((a,b) => a+b, 0) / mel.length;
    }
    
    // Speed multiplier based on energy and beat
    const speedMultiplier = 1 + avgEnergy * 2 + beatPulse * 1.5;
    
    // Update position
    dvdBouncerState.x += dvdBouncerState.vx * speedMultiplier;
    dvdBouncerState.y += dvdBouncerState.vy * speedMultiplier;
    
    // Check for corner hit (within small threshold)
    const cornerThreshold = 20;
    let hitCorner = false;
    
    // Check boundaries and bounce
    if (dvdBouncerState.x <= 0 || dvdBouncerState.x + logoWidth >= width) {
        dvdBouncerState.vx *= -1;
        dvdBouncerState.x = Math.max(0, Math.min(width - logoWidth, dvdBouncerState.x));
        dvdBouncerState.hue = (dvdBouncerState.hue + 60) % 360;
        dvdBouncerState.lastBounce = time;
        
        // Check if near top or bottom corner
        if (dvdBouncerState.y <= cornerThreshold || dvdBouncerState.y + logoHeight >= height - cornerThreshold) {
            hitCorner = true;
        }
    }
    
    if (dvdBouncerState.y <= 0 || dvdBouncerState.y + logoHeight >= height) {
        dvdBouncerState.vy *= -1;
        dvdBouncerState.y = Math.max(0, Math.min(height - logoHeight, dvdBouncerState.y));
        dvdBouncerState.hue = (dvdBouncerState.hue + 60) % 360;
        dvdBouncerState.lastBounce = time;
        
        // Check if near left or right corner
        if (dvdBouncerState.x <= cornerThreshold || dvdBouncerState.x + logoWidth >= width - cornerThreshold) {
            hitCorner = true;
        }
    }
    
    // Corner hit celebration!
    if (hitCorner) {
        dvdBouncerState.cornerHitTime = time;
    }
    
    // Draw background trail
    const trailLength = 10;
    const timeSinceBounce = time - dvdBouncerState.lastBounce;
    for (let i = trailLength; i > 0; i--) {
        const alpha = (i / trailLength) * 0.1 * Math.max(0, 1 - timeSinceBounce);
        // Trail glows in the dominant note's color (logo keeps classic bounce hues)
        ctx.fillStyle = `hsla(${CHROMA_HUES[maxChroma]}, 100%, 50%, ${alpha})`;
        const offsetX = -dvdBouncerState.vx * i * 3;
        const offsetY = -dvdBouncerState.vy * i * 3;
        ctx.fillRect(
            dvdBouncerState.x + offsetX,
            dvdBouncerState.y + offsetY,
            logoWidth,
            logoHeight
        );
    }
    
    // Corner hit celebration effect
    const timeSinceCorner = time - dvdBouncerState.cornerHitTime;
    if (timeSinceCorner < 2) {
        // Explosion particles
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = timeSinceCorner * 200 * (1 - timeSinceCorner / 2);
            const px = dvdBouncerState.x + logoWidth / 2 + Math.cos(angle) * distance;
            const py = dvdBouncerState.y + logoHeight / 2 + Math.sin(angle) * distance;
            const particleAlpha = Math.max(0, 1 - timeSinceCorner / 2);
            
            ctx.fillStyle = `hsla(${(dvdBouncerState.hue + i * 10) % 360}, 100%, 50%, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Screen flash
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 0.3 * (1 - timeSinceCorner / 2))})`;
        ctx.fillRect(0, 0, width, height);
    }
    
    // Draw the DVD logo
    const glowIntensity = 20 + beatPulse * 30 + (timeSinceCorner < 2 ? 50 : 0);
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = `hsl(${dvdBouncerState.hue}, 100%, 50%)`;
    
    // Logo background
    ctx.fillStyle = `hsl(${dvdBouncerState.hue}, 100%, ${40 + beatPulse * 20}%)`;
    ctx.fillRect(dvdBouncerState.x, dvdBouncerState.y, logoWidth, logoHeight);
    
    // DVD text
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = `bold ${logoHeight * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DVD', dvdBouncerState.x + logoWidth / 2, dvdBouncerState.y + logoHeight / 2);
    
    // Inner glow effect
    ctx.fillStyle = `hsla(${dvdBouncerState.hue}, 100%, 70%, 0.3)`;
    ctx.fillRect(
        dvdBouncerState.x + logoWidth * 0.1,
        dvdBouncerState.y + logoHeight * 0.1,
        logoWidth * 0.3,
        logoHeight * 0.3
    );
    
    ctx.shadowBlur = 0;
    
    // Draw audio visualization bars at edges
    if (chroma && chroma.length) {
        const barWidth = width / chroma.length;
        ctx.globalAlpha = 0.3;
        
        chroma.forEach((value, i) => {
            const hue = (i / chroma.length) * 360;
            const barHeight = value * height * 0.2;
            
            // Bottom bars
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        });
        
        ctx.globalAlpha = 1;
    }
}
