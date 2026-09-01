import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

const PARTICLE_THEMES = [
  { color: '#38bdf8', glow: '#06b6d4' },
  { color: '#818cf8', glow: '#6366f1' },
  { color: '#c084fc', glow: '#a855f7' },
  { color: '#ffffff', glow: '#38bdf8' },
  { color: '#22d3ee', glow: '#0ea5e9' }
];

export const InteractiveParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates and interaction physics
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 155 // Interactive displacement radius
    };

    // Denser particle count covering the full screen with rich constellations
    const particleCount = Math.floor(Math.min(Math.max((width * height) / 5000, 160), 250));
    const maxLineDistance = 135; // Maximum distance to draw connecting lines

    // Initialize rich particle field
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const theme = PARTICLE_THEMES[Math.floor(Math.random() * PARTICLE_THEMES.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        size: Math.random() * 1.8 + 1.2,
        color: theme.color,
        glowColor: theme.glow,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    // Pointer events
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update and draw connecting lines between all nearby nodes
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLineDistance) {
            // Line opacity based on proximity
            const alpha = (1 - dist / maxLineDistance) * 0.28;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#38bdf8';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.95;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 2. Update and render all particle star dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Continuous natural drift
        p.x += p.vx;
        p.y += p.vy;

        // Screen boundary wrapping
        if (p.x < -15) p.x = width + 15;
        else if (p.x > width + 15) p.x = -15;
        if (p.y < -15) p.y = height + 15;
        else if (p.y > height + 15) p.y = -15;

        // Interactive mouse repulsion physics
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * 8.5;
          const nx = dx / dist;
          const ny = dy / dist;
          p.x += nx * force;
          p.y += ny * force;
        }

        // Twinkle luminance calculation
        p.twinklePhase += p.twinkleSpeed;
        const twinkleAlpha = 0.6 + 0.4 * Math.sin(p.twinklePhase);

        // Render glowing star dot
        ctx.save();
        ctx.globalAlpha = twinkleAlpha;

        // Outer soft glowing aura
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.glowColor;
        ctx.globalAlpha = twinkleAlpha * 0.18;
        ctx.fill();

        // Core bright star dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = twinkleAlpha * 0.95;
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
};
