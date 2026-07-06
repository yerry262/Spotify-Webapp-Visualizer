import { CHROMA_HUES } from '../waveformCore';

// --- FRACTAL VOID STATE ---
let fractalState = {
    rotation: 0,
    smoothedEnergy: 0,
    hueOffset: 0
};

// --- FRACTAL VOID ---
export function drawFractalVoidWave(ctx, width, height, chroma, mel, beatPulse, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    // Smoother visual: Constant depth
    const maxDepth = 4;
    
    // Get average energy
    let energy = 0;
    if (mel && mel.length) energy = mel.reduce((a,b)=>a+b,0) / mel.length;
    // Normalize -20 to -5 db range roughly
    energy = Math.max(0, (energy + 15) / 20); 

    // Smooth the energy value (Linear Interpolation)
    fractalState.smoothedEnergy += (energy - fractalState.smoothedEnergy) * 0.08;
    const smoothE = fractalState.smoothedEnergy;
    
    // Smooth rotation - accumulate speed based on energy
    fractalState.rotation += 0.002 + smoothE * 0.01 + beatPulse * 0.005;

    // Get Dominant Pitch for Color only (not geometry popping)
    let maxChroma = 0; let maxVal = -1;
    chroma.forEach((v, i) => { if(v > maxVal) { maxVal = v; maxChroma = i; } });
    
    // Smooth hue transition
    const targetHue = maxChroma * 30;
    // Shortest path interpolation for angles (0-360)
    let diff = targetHue - fractalState.hueOffset;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    fractalState.hueOffset += diff * 0.05;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Recursive Function
    const drawFractal = (x, y, radius, angle, depth) => {
        if (depth <= 0 || radius < 3) return;
        
        // Use fixed sides (Hexagon) for stability + smooth morphing
        // We can morph the shape by drawing curves or varying vertices
        const sides = 6; 
        
        // Color based on depth and smooth hue
        const hue = (fractalState.hueOffset + time * 10 + depth * 30) % 360;
        const opacity = 0.5 + smoothE * 0.5; // Pulse opacity
        
        // Add Glow
        ctx.shadowBlur = beatPulse * 15 * (depth === maxDepth ? 1 : 0);
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.8)`;
        
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${opacity * (depth/maxDepth)})`;
        ctx.lineWidth = 1 + depth * 0.5 + smoothE * 2;
        
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
            const theta = angle + (i / sides) * Math.PI * 2;
            // Each vertex rides its own mel band: treble spikes the shape,
            // quiet passages relax it back to a smooth hexagon
            let melSpike = 0;
            if (mel && mel.length) {
                const mIdx = Math.floor(((i % sides) / sides) * mel.length);
                melSpike = Math.max(0, (mel[mIdx] + 10) / 10) * 0.35;
            }
            const r = radius * (1 + 0.08 * Math.sin(time * 2 + i + beatPulse) + melSpike);
            const px = x + Math.cos(theta) * r;
            const py = y + Math.sin(theta) * r;
            if (i===0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset for performance in deep recursion
        
        // Recursion - FIXED number of children (3) for smoothness
        const children = 3; 
        const nextRadius = radius * 0.55;
        // The distance of children expands with energy (Zoom/Explosion effect)
        const expansion = 1 + smoothE * 0.6 + beatPulse * 0.1;
        
        for(let c=0; c<children; c++) {
            const childOffset = (c / children) * Math.PI * 2 + fractalState.rotation;
            const dist = radius * 0.85 * expansion;
            
            const nx = x + Math.cos(childOffset) * dist;
            const ny = y + Math.sin(childOffset) * dist;
            
            // Twist angle for children
            drawFractal(nx, ny, nextRadius, angle + childOffset + Math.PI/3, depth - 1);
        }
    };
    
    // Draw Main Fractal + a counter-rotating mirror twin in the opposite hue —
    // the two interlock and separate with the energy, way trippier in motion
    const startRadius = Math.min(width, height) * 0.22;
    drawFractal(centerX, centerY, startRadius, fractalState.rotation, maxDepth);
    const mirrorHueSave = fractalState.hueOffset;
    fractalState.hueOffset = (fractalState.hueOffset + 180) % 360;
    drawFractal(centerX, centerY, startRadius * (0.5 + smoothE * 0.3), -fractalState.rotation * 1.3, maxDepth - 1);
    fractalState.hueOffset = mirrorHueSave;
    
    // Background Tunnel - Smoother and separate from fractal logic
    const tunnelDepth = 8;
    for(let i=0; i<tunnelDepth; i++) {
        // Logarithmic scale for tunnel feeling
        const scale = 1.0 + (i * 0.5) + (time*0.5 % 0.5); // Infinite zoom feeling
        const tSize = startRadius * 3 / scale; 
        if (tSize < 5) continue;
        
        const alpha = Math.max(0, (1 - (scale/4))); // Fade out as it gets bigger
        if (alpha <= 0) continue;

        const rot = -fractalState.rotation * (0.5 + i*0.1);
        // Tunnel rings take each note's own color and thump with the bass
        const chromaIdx = i % 12;
        const hue = (CHROMA_HUES[chromaIdx] + fractalState.hueOffset - time*20) % 360;
        let bass = 0;
        if (mel && mel.length) bass = Math.max(0, (mel[0] + 10) / 10);

        ctx.strokeStyle = `hsla(${hue}, 70%, ${35 + (chroma[chromaIdx] || 0) * 25}%, ${alpha * (0.3 + (chroma[chromaIdx] || 0) * 0.4)})`;
        ctx.lineWidth = 1 + bass * 2.5 + beatPulse * 1.5;
        ctx.beginPath();
        const sides = 6;
        for (let j = 0; j <= sides; j++) {
            const theta = rot + (j / sides) * Math.PI * 2;
            const px = centerX + Math.cos(theta) * tSize;
            const py = centerY + Math.sin(theta) * tSize;
            if (j===0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
}
/**
 * Quantum Flux 🌊⚛️ - Advanced 3D morphing waveform with quantum particle effects
 * Combines terrain-style 3D rendering with morphing geometry, particle trails, and energy fields
 * Features: Dynamic mesh deformation, chromatic aberration, depth-of-field blur, holographic shimmer
 */
