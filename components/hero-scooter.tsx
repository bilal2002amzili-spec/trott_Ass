'use client';

import { motion } from 'framer-motion';

export function HeroScooter({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Background gradient blob */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-blue-500/20 via-cyan-400/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* 3D Scooter illustration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
          {/* Ground shadow */}
          <ellipse cx="250" cy="360" rx="180" ry="20" fill="rgba(0,0,0,0.08)" />

          {/* Scooter body */}
          {/* Deck */}
          <motion.path
            d="M120 280 L380 280 L370 300 L130 300 Z"
            fill="url(#deckGrad)"
            stroke="#1e40af"
            strokeWidth="2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ transformOrigin: '250px 290px' }}
          />

          {/* Main tube (stem) */}
          <motion.path
            d="M280 280 L290 160"
            stroke="url(#stemGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          />

          {/* Handlebar */}
          <motion.path
            d="M270 155 L310 155"
            stroke="#1e40af"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            style={{ transformOrigin: '290px 155px' }}
          />

          {/* Handle grips */}
          <circle cx="268" cy="155" r="6" fill="#dc2626" />
          <circle cx="312" cy="155" r="6" fill="#dc2626" />

          {/* Front wheel */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <circle cx="350" cy="320" r="35" fill="#1e293b" />
            <circle cx="350" cy="320" r="28" fill="#334155" />
            <circle cx="350" cy="320" r="8" fill="#64748b" />
            {/* Spokes */}
            {[0, 45, 90, 135].map((angle) => (
              <line
                key={angle}
                x1="350"
                y1="320"
                x2={350 + 26 * Math.cos((angle * Math.PI) / 180)}
                y2={320 + 26 * Math.sin((angle * Math.PI) / 180)}
                stroke="#475569"
                strokeWidth="2"
              />
            ))}
          </motion.g>

          {/* Back wheel */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <circle cx="150" cy="320" r="35" fill="#1e293b" />
            <circle cx="150" cy="320" r="28" fill="#334155" />
            <circle cx="150" cy="320" r="8" fill="#64748b" />
            {[0, 45, 90, 135].map((angle) => (
              <line
                key={angle}
                x1="150"
                y1="320"
                x2={150 + 26 * Math.cos((angle * Math.PI) / 180)}
                y2={320 + 26 * Math.sin((angle * Math.PI) / 180)}
                stroke="#475569"
                strokeWidth="2"
              />
            ))}
          </motion.g>

          {/* Battery/center box */}
          <motion.rect
            x="200"
            y="265"
            width="80"
            height="20"
            rx="4"
            fill="url(#batteryGrad)"
            stroke="#1e40af"
            strokeWidth="1.5"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ transformOrigin: '240px 275px' }}
          />

          {/* LED light */}
          <motion.circle
            cx="375"
            cy="275"
            r="5"
            fill="#fbbf24"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1] }}
            transition={{ duration: 2, delay: 1, repeat: Infinity }}
          />
          <circle cx="375" cy="275" r="12" fill="#fbbf24" opacity="0.2" />

          {/* Shield badge */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1, type: 'spring' }}
            style={{ transformOrigin: '250px 120px' }}
          >
            <path
              d="M250 95 L235 100 V115 C235 125 242 132 250 135 C258 132 265 125 265 115 V100 L250 95 Z"
              fill="url(#shieldGrad2)"
              stroke="white"
              strokeWidth="1.5"
            />
            <path d="M244 116L248 120L256 110" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.g>

          {/* Floating particles */}
          {[
            { x: 80, y: 100, delay: 0 },
            { x: 420, y: 120, delay: 0.5 },
            { x: 100, y: 200, delay: 1 },
            { x: 400, y: 220, delay: 1.5 },
            { x: 60, y: 280, delay: 0.3 },
          ].map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="hsl(221 83% 53%)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 0.6, 0], y: [-10, -30, -10] }}
              transition={{ duration: 3, delay: p.delay, repeat: Infinity }}
            />
          ))}

          {/* Red accent dots */}
          <circle cx="120" cy="140" r="3" fill="#dc2626" opacity="0.6" />
          <circle cx="430" cy="180" r="3" fill="#dc2626" opacity="0.6" />

          <defs>
            <linearGradient id="deckGrad" x1="120" y1="280" x2="380" y2="300" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="stemGrad" x1="280" y1="280" x2="290" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="batteryGrad" x1="200" y1="265" x2="280" y2="285" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="shieldGrad2" x1="235" y1="95" x2="265" y2="135" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563eb" />
              <stop offset="1" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
