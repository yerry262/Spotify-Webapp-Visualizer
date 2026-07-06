import { getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- SACRED GEOMETRY ---
// --- SACRED GEOMETRY STATE ---
let sacredGeometryState = {
    smoothedBeat: 0,
    rotation: 0,
    lastTime: 0
};

export function drawSacredGeometryWave(ctx, width, height, chroma, mel, beatPulse, time) {
    if (!sacredGeometryState.lastTime) sacredGeometryState.lastTime = time;
    const deltaTime = Math.max(0, Math.min(0.1, time - sacredGeometryState.lastTime));
    sacredGeometryState.lastTime = time;

    const settings = getEffectiveWaveformSettings('sacred_geometry');
    const centerX = width / 2;
    const centerY = height * (settings.basePosition / 100);
    const scale = settings.maxAmplitude / 100;
    
    // Smooth beat pulse for visual transitions
    sacredGeometryState.smoothedBeat += (beatPulse - sacredGeometryState.smoothedBeat) * 0.1;
    // Rotation speed tied to beat
    sacredGeometryState.rotation += deltaTime * (0.25 + sacredGeometryState.smoothedBeat * 0.6);

    // Calculate energy with proper normalization
    let energy = 0;
    if (mel && mel.length) {
        const rawEnergy = mel.reduce((a, b) => a + b, 0) / mel.length;
        energy = Math.max(0, Math.min(1, (rawEnergy + 10) / 10)); // Normalize dB
    }

    // Mathematical Sacred Geometry scaling
    // In a perfect Flower of Life, circle radius = distance between centers
    const R = Math.min(width, height) * 0.12 * scale;
    const circleSize = R * (0.9 + sacredGeometryState.smoothedBeat * 0.2);
    
    const maxLayers = 4;
    const activeLayers = 1.5 + energy * 1.5 + sacredGeometryState.smoothedBeat * 1.5;

    ctx.lineWidth = 1.2 + energy * 2;

    const rot = sacredGeometryState.rotation;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    // Draw from center outwards on a true hexagonal lattice (Flower of Life)
    for (let l = 0; l <= maxLayers; l++) {
        const layerActive = Math.max(0, Math.min(1, activeLayers - l));
        if (layerActive <= 0 && l > 0) continue; // Always draw center

        const circleCount = l === 0 ? 1 : 6 * l;
        const layerAlpha = layerActive * (0.2 + energy * 0.4 + sacredGeometryState.smoothedBeat * 0.3);
        const circleColor = `hsla(${(time * 15 + l * 40) % 360}, 75%, 65%, ${layerAlpha})`;
        const lineColor = `hsla(${(time * 15 + l * 40) % 360}, 75%, 65%, ${0.08 * Math.max(0, (sacredGeometryState.smoothedBeat - 0.3) * 1.5) * layerActive})`;

        for (let i = 0; i < circleCount; i++) {
            // Hex ring position: walk the six edges between corners so circles interlock
            let lx, ly;
            if (l === 0) {
                lx = 0; ly = 0;
            } else {
                const side = Math.floor(i / l);
                const step = i % l;
                const a1 = (side / 6) * Math.PI * 2;
                const a2 = ((side + 1) / 6) * Math.PI * 2;
                const t = step / l;
                lx = (Math.cos(a1) * (1 - t) + Math.cos(a2) * t) * l * R;
                ly = (Math.sin(a1) * (1 - t) + Math.sin(a2) * t) * l * R;
            }
            // Rotate the whole lattice together so layers stay aligned
            const cx = centerX + lx * cosR - ly * sinR;
            const cy = centerY + lx * sinR + ly * cosR;

            ctx.strokeStyle = circleColor;
            ctx.beginPath();
            ctx.arc(cx, cy, circleSize, 0, Math.PI * 2);
            ctx.stroke();

            // Connect to center with synchronized lines
            if (l > 0 && sacredGeometryState.smoothedBeat > 0.3) {
                ctx.strokeStyle = lineColor;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(cx, cy);
                ctx.stroke();
            }
        }
    }
    
    // Central Geometric Figure - Strictly locked to the 2nd layer radius
    const vertices = 6;
    const polyR = R * 2; 
    const polyAlpha = 0.3 + sacredGeometryState.smoothedBeat * 0.6;
    
    if (polyAlpha > 0.01) {
        ctx.strokeStyle = `hsla(${(time * 15) % 360}, 100%, 90%, ${polyAlpha})`;
        ctx.lineWidth = 2.0;
        
        // Use a single path for the hexagon to prevent cumulative brightness
        ctx.beginPath();
        for (let i = 0; i <= vertices; i++) {
            const angle = (i / vertices) * Math.PI * 2 + sacredGeometryState.rotation; 
            const x = centerX + Math.cos(angle) * polyR;
            const y = centerY + Math.sin(angle) * polyR;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Inner connections drawn once per vertex
        if (sacredGeometryState.smoothedBeat > 0.1) {
            ctx.save();
            ctx.globalAlpha = 0.2 * sacredGeometryState.smoothedBeat;
            for (let i = 0; i < vertices; i++) {
                const angle = (i / vertices) * Math.PI * 2 + sacredGeometryState.rotation; 
                const x = centerX + Math.cos(angle) * polyR;
                const y = centerY + Math.sin(angle) * polyR;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(centerX, centerY);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    
    drawWaveLabels(ctx, width, height, chroma);
}
