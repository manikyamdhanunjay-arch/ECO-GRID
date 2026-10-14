import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps, SVGMotionProps } from 'framer-motion';

export { AnimatePresence, motion };

/**
 * Fluid Page / Tab Transition Component
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
  tabKey?: string;
}> = ({ children, className = '', tabKey }) => (
  <motion.div
    key={tabKey}
    initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Fluid Spring Interactive Card
 */
export const MotionCard: React.FC<
  HTMLMotionProps<'div'> & { children: React.ReactNode; className?: string }
> = ({ children, className = '', ...props }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98, y: -10 }}
    whileHover={{ y: -3, scale: 1.012 }}
    whileTap={{ scale: 0.985 }}
    transition={{
      type: 'spring',
      stiffness: 380,
      damping: 26,
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Stagger Container for lists and card grids
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    initial="hidden"
    animate="show"
    exit="hidden"
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.06,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Item inside Stagger Container
 */
export const StaggerItem: React.FC<
  HTMLMotionProps<'div'> & { children: React.ReactNode; className?: string }
> = ({ children, className = '', ...props }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 12 },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 350,
          damping: 24,
        },
      },
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Fluid Scanning Laser Beam (Motion powered replacement for CSS keyframe)
 */
export const MotionScanningLaser: React.FC<{ active?: boolean }> = ({ active = true }) => {
  if (!active) return null;
  return (
    <motion.div
      initial={{ top: '0%', opacity: 0.8 }}
      animate={{
        top: ['2%', '94%', '2%'],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2.4,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_18px_#22d3ee] pointer-events-none z-20"
    />
  );
};

/**
 * Fluid Radar Sweep (Motion powered replacement for CSS keyframe)
 */
export const MotionRadarSweep: React.FC = () => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] pointer-events-none opacity-25">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
      className="w-full h-full rounded-full border border-emerald-500/25 relative"
    >
      <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-transparent origin-left" />
    </motion.div>
  </div>
);

/**
 * Pulsing Glow Badge
 */
export const MotionPulsingBadge: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <motion.div
    animate={{
      scale: [1, 1.025, 1],
      opacity: [0.92, 1, 0.92],
    }}
    transition={{
      duration: 2.8,
      ease: 'easeInOut',
      repeat: Infinity,
    }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Reusable Motion SVG Path with animated dynamic dash flow (replaces manual CSS keyframes)
 */
export const MotionAnimatedPath: React.FC<
  SVGMotionProps<SVGPathElement> & {
    d: string;
    strokeColor?: string;
    strokeWidth?: number;
    dashArray?: string;
    speedSeconds?: number;
    glow?: boolean;
    reverse?: boolean;
  }
> = ({
  d,
  strokeColor = '#06b6d4',
  strokeWidth = 2.5,
  dashArray = '6,4',
  speedSeconds = 1.8,
  glow = true,
  reverse = false,
  className = '',
  ...props
}) => {
  return (
    <g>
      {/* Background Soft Glow Tube */}
      {glow && (
        <path
          d={d}
          stroke={strokeColor}
          strokeWidth={strokeWidth + 3}
          strokeOpacity={0.25}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* Main Flowing Dash Motion Path */}
      <motion.path
        d={d}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        fill="none"
        strokeLinecap="round"
        animate={{
          strokeDashoffset: reverse ? [0, 40] : [0, -40],
        }}
        transition={{
          duration: speedSeconds,
          ease: 'linear',
          repeat: Infinity,
        }}
        className={className}
        {...props}
      />
    </g>
  );
};

/**
 * Animated Destination Beacon Pulse
 */
export const MotionBeacon: React.FC<{ cx: number; cy: number; color?: string }> = ({
  cx,
  cy,
  color = '#f59e0b',
}) => (
  <g>
    <motion.circle
      cx={cx}
      cy={cy}
      r={6}
      fill={color}
      animate={{
        r: [6, 18, 6],
        opacity: [0.9, 0, 0.9],
      }}
      transition={{
        duration: 2,
        ease: 'easeOut',
        repeat: Infinity,
      }}
    />
    <circle cx={cx} cy={cy} r={4} fill={color} stroke="#ffffff" strokeWidth={1.5} />
  </g>
);
