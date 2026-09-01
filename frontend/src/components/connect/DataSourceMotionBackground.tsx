import React, { useEffect, useRef } from 'react';

interface GlowDot {
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

// Exactly 3 curated harmonious colors for Data Source
const THREE_THEMES = [
  { color: '#38bdf8', glow: '#06b6d4' }, // 1. Electric Cyan
  { color: '#818cf8', glow: '#6366f1' }, // 2. Radiant Indigo
  { color: '#c084fc', glow: '#a855f7' }  // 3. Vibrant Purple
];

export const DataSourceMotionBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse coordinates for interactive repulsion & ripple
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 145
    };

    // Extra quantity of dots across full background
    const dotCount = Math.floor(Math.min(Math.max((width * height) / 4200, 180), 320));
    const dots: GlowDot[] = [];

    for (let i = 0; i < dotCount; i++) {
      const theme = THREE_THEMES[i % THREE_THEMES.length];
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 2.0 + 1.2,
        color: theme.color,
        glowColor: theme.glow,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', handleResize);

    // Render loop (Only dots with 3 colors, NO lines)
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // ── 1. AMBIENT RADIAL LIGHT CORE BEHIND DROPZONE ──
      const centerX = width / 2;
      const centerY = height * 0.45;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, width * 0.45);
      coreGrad.addColorStop(0, 'rgba(6, 182, 212, 0.07)');
      coreGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. RENDER ONLY GLOWING DOTS (3 COLORS) ──
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Continuous natural drift
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Screen edge wrapping
        if (dot.x < -10) dot.x = width + 10;
        else if (dot.x > width + 10) dot.x = -10;
        if (dot.y < -10) dot.y = height + 10;
        else if (dot.y > height + 10) dot.y = -10;

        // Mouse displacement physics
        const dx = dot.x - mouse.x;
        const dy = dot.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * 7.0;
          const nx = dx / dist;
          const ny = dy / dist;
          dot.x += nx * force;
          dot.y += ny * force;
        }

        // Twinkle phase
        dot.twinklePhase += dot.twinkleSpeed;
        const twinkle = 0.55 + 0.45 * Math.sin(dot.twinklePhase);

        ctx.save();
        ctx.globalAlpha = twinkle;

        // Outer soft radiant halo
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = dot.glowColor;
        ctx.globalAlpha = twinkle * 0.18;
        ctx.fill();

        // Core bright star dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.shadowColor = dot.glowColor;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = twinkle * 0.92;
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
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
};
