import React, { useRef, useEffect } from 'react';
import './IdleAnimation.css';

const IdleAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles for ambient effect
    const particles = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    // Sound wave circles
    const waves = [];
    
    const addWave = () => {
      waves.push({
        x: canvas.offsetWidth / 2,
        y: canvas.offsetHeight / 2,
        radius: 0,
        maxRadius: Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.8,
        opacity: 0.8,
        speed: 1.5
      });
    };

    let waveTimer = 0;

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Bounce off edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29, 185, 84, ${p.opacity})`;
        ctx.fill();
      });

      // Add new wave periodically
      waveTimer++;
      if (waveTimer > 120) {
        addWave();
        waveTimer = 0;
      }

      // Update and draw waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i];
        wave.radius += wave.speed;
        wave.opacity -= 0.005;
        
        if (wave.opacity <= 0) {
          waves.splice(i, 1);
          continue;
        }
        
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(29, 185, 84, ${wave.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw center icon (music note silhouette)
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Pulsing glow
      const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
      const glowSize = 60 * pulseScale;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
      gradient.addColorStop(0, 'rgba(29, 185, 84, 0.3)');
      gradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Music note icon
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(pulseScale, pulseScale);
      
      // Draw pause icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(-15, -20, 8, 40);
      ctx.fillRect(7, -20, 8, 40);
      
      ctx.restore();

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="idle-animation">
      <canvas ref={canvasRef} className="idle-canvas" />
      
      <div className="idle-content">
        <div className="idle-icon">
          <div className="idle-circle">
            <div className="idle-pause">
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="orbit-ring ring-1"></div>
          <div className="orbit-ring ring-2"></div>
          <div className="orbit-ring ring-3"></div>
        </div>
        
        <h2 className="idle-title">NOTHING PLAYING</h2>
        <p className="idle-subtitle">Start playing something on Spotify to see it here</p>
        
        <div className="sound-bars">
          <span style={{'--delay': '0s'}}></span>
          <span style={{'--delay': '0.2s'}}></span>
          <span style={{'--delay': '0.4s'}}></span>
          <span style={{'--delay': '0.6s'}}></span>
          <span style={{'--delay': '0.8s'}}></span>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="floating-particles">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="float-particle"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 5}s`,
              '--duration': `${10 + Math.random() * 20}s`,
              '--size': `${2 + Math.random() * 4}px`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default IdleAnimation;
