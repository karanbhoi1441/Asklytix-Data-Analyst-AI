import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface StarPoint {
  id: number;
  x: number; // percentage relative to container
  y: number;
  size: number;
  color: string;
  glowColor: string;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
}

interface ConstellationLine {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  color: string;
  dash?: string;
}

export const StarfieldConstellation: React.FC = () => {
  // Compact constellation cluster closely bounded around the brand logo
  const { stars, lines } = useMemo(() => {
    const rawStars: StarPoint[] = [
      { id: 1, x: 18, y: 22, size: 2.4, color: '#38bdf8', glowColor: '#06b6d4', delay: 0.2, duration: 3.5, driftX: 12, driftY: -8 },
      { id: 2, x: 26, y: 15, size: 2.8, color: '#c084fc', glowColor: '#a855f7', delay: 0.8, duration: 4.2, driftX: -10, driftY: 10 },
      { id: 3, x: 35, y: 22, size: 2.0, color: '#ffffff', glowColor: '#38bdf8', delay: 1.5, duration: 3.2, driftX: 8, driftY: 12 },
      { id: 4, x: 16, y: 38, size: 2.6, color: '#818cf8', glowColor: '#6366f1', delay: 0.5, duration: 3.8, driftX: -12, driftY: -10 },
      { id: 5, x: 28, y: 32, size: 3.2, color: '#38bdf8', glowColor: '#06b6d4', delay: 1.2, duration: 4.5, driftX: 14, driftY: 8 },
      { id: 6, x: 39, y: 34, size: 2.0, color: '#ffffff', glowColor: '#c084fc', delay: 2.1, duration: 3.4, driftX: -8, driftY: -12 },
      { id: 7, x: 14, y: 55, size: 2.2, color: '#a855f7', glowColor: '#ec4899', delay: 0.7, duration: 4.0, driftX: 10, driftY: -14 },
      { id: 8, x: 25, y: 50, size: 3.0, color: '#38bdf8', glowColor: '#06b6d4', delay: 1.6, duration: 4.8, driftX: -14, driftY: 8 },
      { id: 9, x: 36, y: 52, size: 2.4, color: '#818cf8', glowColor: '#6366f1', delay: 1.0, duration: 3.6, driftX: 12, driftY: 10 },
      { id: 10, x: 20, y: 68, size: 2.6, color: '#c084fc', glowColor: '#a855f7', delay: 2.2, duration: 4.1, driftX: -10, driftY: -8 },
      { id: 11, x: 32, y: 66, size: 2.2, color: '#38bdf8', glowColor: '#06b6d4', delay: 0.4, duration: 4.4, driftX: 8, driftY: 12 },
      { id: 12, x: 26, y: 78, size: 2.0, color: '#ffffff', glowColor: '#c084fc', delay: 1.4, duration: 3.5, driftX: -12, driftY: -6 },

      // Subtle right border nodes (compact boundary)
      { id: 13, x: 44, y: 22, size: 2.2, color: '#818cf8', glowColor: '#6366f1', delay: 0.9, duration: 4.0, driftX: 8, driftY: -10 },
      { id: 14, x: 48, y: 36, size: 2.0, color: '#38bdf8', glowColor: '#06b6d4', delay: 1.8, duration: 3.7, driftX: -10, driftY: 8 },
      { id: 15, x: 44, y: 58, size: 2.2, color: '#c084fc', glowColor: '#a855f7', delay: 0.6, duration: 4.3, driftX: 10, driftY: -8 },
      { id: 16, x: 50, y: 70, size: 1.8, color: '#ffffff', glowColor: '#818cf8', delay: 1.3, duration: 3.8, driftX: -8, driftY: 10 }
    ];

    // Compact constellation lines connecting cluster coordinates
    const rawLines: ConstellationLine[] = [
      { id: 1, x1: 18, y1: 22, x2: 26, y2: 15, opacity: 0.18, color: '#38bdf8' },
      { id: 2, x1: 26, y1: 15, x2: 35, y2: 22, opacity: 0.15, color: '#818cf8', dash: '3 3' },
      { id: 3, x1: 18, y1: 22, x2: 16, y2: 38, opacity: 0.16, color: '#06b6d4' },
      { id: 4, x1: 26, y1: 15, x2: 28, y2: 32, opacity: 0.20, color: '#c084fc' },
      { id: 5, x1: 16, y1: 38, x2: 28, y2: 32, opacity: 0.22, color: '#38bdf8' },
      { id: 6, x1: 28, y1: 32, x2: 39, y2: 34, opacity: 0.17, color: '#818cf8', dash: '3 3' },
      { id: 7, x1: 16, y1: 38, x2: 14, y2: 55, opacity: 0.15, color: '#a855f7' },
      { id: 8, x1: 28, y1: 32, x2: 25, y2: 50, opacity: 0.21, color: '#06b6d4' },
      { id: 9, x1: 14, y1: 55, x2: 25, y2: 50, opacity: 0.18, color: '#38bdf8' },
      { id: 10, x1: 25, y1: 50, x2: 36, y2: 52, opacity: 0.20, color: '#818cf8' },
      { id: 11, x1: 25, y1: 50, x2: 20, y2: 68, opacity: 0.19, color: '#c084fc', dash: '3 3' },
      { id: 12, x1: 36, y1: 52, x2: 32, y2: 66, opacity: 0.16, color: '#38bdf8' },
      { id: 13, x1: 20, y1: 68, x2: 32, y2: 66, opacity: 0.20, color: '#06b6d4' },
      { id: 14, x1: 20, y1: 68, x2: 26, y2: 78, opacity: 0.15, color: '#818cf8' },
      { id: 15, x1: 32, y1: 66, x2: 26, y2: 78, opacity: 0.18, color: '#c084fc', dash: '4 4' },

      // Bridge Lines
      { id: 16, x1: 35, y1: 22, x2: 44, y2: 22, opacity: 0.13, color: '#818cf8', dash: '3 3' },
      { id: 17, x1: 39, y1: 34, x2: 48, y2: 36, opacity: 0.15, color: '#38bdf8' },
      { id: 18, x1: 36, y1: 52, x2: 44, y2: 58, opacity: 0.14, color: '#c084fc', dash: '3 3' },
      { id: 19, x1: 32, y1: 66, x2: 50, y2: 70, opacity: 0.13, color: '#818cf8', dash: '4 4' }
    ];

    return { stars: rawStars, lines: rawLines };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* ── 1. CONTINUOUSLY FLOATING & DRIFTING CONSTELLATION MESH ── */}
      <motion.div
        animate={{
          x: [-16, 16, -16],
          y: [-12, 12, -12],
          rotate: [-1.2, 1.2, -1.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-full h-full absolute inset-0"
      >
        <svg className="w-full h-full absolute inset-0">
          {/* Low-Visible Constellation Connecting Lines */}
          {lines.map((line) => (
            <line
              key={line.id}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              stroke={line.color}
              strokeWidth="1.1"
              strokeDasharray={line.dash}
              opacity={line.opacity}
            />
          ))}

          {/* Starlight Dots with Halo */}
          {stars.map((star) => (
            <g key={star.id}>
              {/* Outer Glowing Starlight Halo */}
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.size * 3.0}
                fill={star.glowColor}
                opacity="0.18"
              />
              {/* Bright Star Node */}
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.size}
                fill={star.color}
                opacity="0.9"
              />
            </g>
          ))}
        </svg>

        {/* ── 2. ACTIVE CONTINUOUS FLOATING & TWINKLING STAR PARTICLES ── */}
        {stars.map((star) => (
          <motion.div
            key={`twinkle_${star.id}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size * 2}px`,
              height: `${star.size * 2}px`,
              boxShadow: `0 0 10px ${star.glowColor}`
            }}
            animate={{
              x: [-star.driftX, star.driftX, -star.driftX],
              y: [-star.driftY, star.driftY, -star.driftY],
              opacity: [0.2, 0.95, 0.2],
              scale: [0.8, 1.3, 0.8]
            }}
            transition={{
              x: { duration: star.duration * 1.5, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: star.duration * 1.8, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: star.duration, repeat: Infinity, delay: star.delay, ease: 'easeInOut' },
              scale: { duration: star.duration, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }
            }}
            className="absolute rounded-full bg-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
          />
        ))}
      </motion.div>

      {/* ── 3. LOW VISIBLE LIGHT HORIZONTAL ACCENT BEAMS ── */}
      <motion.div
        animate={{
          opacity: [0.12, 0.28, 0.12],
          y: [-8, 8, -8],
          x: [-12, 12, -12]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-1/3 -left-1/4 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent rotate-[-10deg] pointer-events-none"
      />
      <motion.div
        animate={{
          opacity: [0.08, 0.22, 0.08],
          y: [8, -8, 8],
          x: [12, -12, 12]
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-2/3 -left-1/4 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent rotate-[6deg] pointer-events-none"
      />
    </div>
  );
};
