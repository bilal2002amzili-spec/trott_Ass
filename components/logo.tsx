'use client';

import { motion } from 'framer-motion';

export function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: size, height: size }}
        className="relative"
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
          {/* Shield */}
          <path
            d="M24 2L6 8V24C6 34 14 42 24 46C34 42 42 34 42 24V8L24 2Z"
            fill="url(#shieldGrad)"
            stroke="hsl(221 83% 53%)"
            strokeWidth="1.5"
          />
          {/* Scooter icon inside shield */}
          <circle cx="15" cy="32" r="3" fill="white" />
          <circle cx="33" cy="32" r="3" fill="white" />
          <path d="M15 32L20 22H28L33 32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 22L18 18H22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 22V18" stroke="white" strokeWidth="2" strokeLinecap="round" />
          {/* Red accent */}
          <circle cx="24" cy="14" r="2" fill="hsl(0 84% 60%)" />
          <defs>
            <linearGradient id="shieldGrad" x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(221 83% 53%)" />
              <stop offset="1" stopColor="hsl(199 89% 48%)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight">
            Trot<span className="text-primary">Assur</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
            Assurance Trottinettes
          </span>
        </div>
      )}
    </div>
  );
}
