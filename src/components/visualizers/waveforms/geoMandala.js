import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

let geoMandalaState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0,
  rotation: 0
};

/**
 * Geometric Mandala 🔮 - Sacred geometry that rotates with music
 * Each chroma note adds geometric elements that scale and rotate
 */
export function drawGeoMandalaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('geo_mandala');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100);
  
  // Initialize state
  if (!geoMandalaState.sMel || (mel && geoMandalaState.sMel.length !== mel.length)) {
    geoMandalaState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }

  // Smooth values
  const lerp = 0.08;
  geoMandalaState.sBeat += (beatPulse - geoMandalaState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    geoMandalaState.sChroma[i] += (chroma[i] - geoMandalaState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      geoMandalaState.sMel[i] += (mel[i] - geoMandalaState.sMel[i]) * lerp;
    }
  }

  const sChroma = geoMandalaState.sChroma;
  const sBeat = geoMandalaState.sBeat;
  const sMel = geoMandalaState.sMel;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = 'lighter';
  
  // Update rotation with momentum
  geoMandalaState.rotation += 0.005 + sBeat * 0.015;

  const numLayers = 8;
  for (let layer = numLayers - 1; layer >= 0; layer--) {
    const layerT = layer / numLayers;
    const cIdx = (layer * 2) % 12;
    const hue = CHROMA_HUES[cIdx];
    const cVal = sChroma[cIdx];
    const mVal = (sMel[layer % sMel.length] + 15) / 15;
    
    // Smooth radius pulsing
    const baseR = maxRadius * (0.2 + layerT * 0.8);
    const layerRadius = baseR * (1 + sBeat * 0.15);
    
    ctx.save();
    const layerRot = geoMandalaState.rotation * (1 + layer * 0.2) * (layer % 2 === 0 ? 1 : -1);
    ctx.rotate(layerRot);
    
    ctx.shadowBlur = 10 + cVal * 20;
    ctx.shadowColor = `hsla(${hue}, 100%, 65%, ${0.2 + cVal * 0.4})`;

    const numPoints = 6 + (layer * 2);
    const angleStep = (Math.PI * 2) / numPoints;

    if (layer >= 6) {
      // OUTER: Spirograph Curves
      ctx.beginPath();
      const curvePoints = 120;
      for (let i = 0; i <= curvePoints; i++) {
        const theta = (i / curvePoints) * Math.PI * 2;
        const r1 = layerRadius * 0.7;
        const r2 = layerRadius * 0.3 * mVal;
        const x = (r1 + r2) * Math.cos(theta) - r2 * Math.cos(((r1 + r2) / r2) * theta);
        const y = (r1 + r2) * Math.sin(theta) - r2 * Math.sin(((r1 + r2) / r2) * theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${0.1 + cVal * 0.5})`;
      ctx.lineWidth = 1 + cVal * 2;
      ctx.stroke();
    } 
    else if (layer >= 3) {
      // MID: Blooming Petals/Clovers
      for (let p = 0; p < numPoints; p++) {
        const angle = p * angleStep;
        ctx.save();
        ctx.rotate(angle);
        
        const pLen = layerRadius * 0.4 * mVal;
        const pWid = pLen * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(layerRadius - pLen, 0);
        ctx.bezierCurveTo(
          layerRadius - pLen / 2, -pWid,
          layerRadius + pWid / 2, -pWid / 2,
          layerRadius, 0
        );
        ctx.bezierCurveTo(
          layerRadius + pWid / 2, pWid / 2,
          layerRadius - pLen / 2, pWid,
          layerRadius - pLen, 0
        );
        
        const grad = ctx.createLinearGradient(layerRadius - pLen, 0, layerRadius, 0);
        grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0)`);
        grad.addColorStop(0.5, `hsla(${(hue + 30) % 360}, 100%, 75%, ${0.2 + cVal * 0.5})`);
        grad.addColorStop(1, `hsla(${hue}, 100%, 90%, 0)`);
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Glowing veins
        ctx.strokeStyle = `hsla(${hue}, 100%, 95%, ${0.1 + cVal * 0.2})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(layerRadius - pLen, 0);
        ctx.lineTo(layerRadius, 0);
        ctx.stroke();
        
        ctx.restore();
      }
    } 
    else {
      // INNER: Pulsing Crystalline Stars
      ctx.beginPath();
      for (let p = 0; p < numPoints * 2; p++) {
        const r = (p % 2 === 0) ? layerRadius : (layerRadius * 0.3 * mVal);
        const a = p * (angleStep / 2);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      
      const starAlpha = 0.1 + cVal * 0.4;
      const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius);
      starGrad.addColorStop(0, `hsla(${hue}, 100%, 90%, ${starAlpha})`);
      starGrad.addColorStop(1, `hsla(${(hue + 40) % 360}, 100%, 50%, 0)`);
      
      ctx.fillStyle = starGrad;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 100%, 95%, ${0.5 + cVal * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // Divine Core
  const coreRad = 40 + sBeat * 50;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRad);
  coreGrad.addColorStop(0, '#fff');
  coreGrad.addColorStop(0.2, `hsla(${time * 40 % 360}, 100%, 85%, 0.9)`);
  coreGrad.addColorStop(0.5, `hsla(${time * 40 % 360}, 100%, 60%, 0.3)`);
  coreGrad.addColorStop(1, 'transparent');
  
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreRad, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  
  drawWaveLabels(ctx, width, height, chroma);
}
