import React from 'react';

/**
 * Single Slow-Spinning Half-Rangoli Design on the Right Side of the Website.
 * Uses the user-uploaded ornamental mandala line art, sized and positioned so that
 * a balanced, non-obtrusive half-rangoli extends gracefully from the right edge with
 * a slow, hypnotic 60s rotation.
 */
export const RotatingHalfRangoliRight: React.FC<{
  opacity?: number;
  size?: number;
}> = ({ opacity = 0.32, size = 420 }) => {
  return (
    <div
      className="fixed top-0 right-0 bottom-0 pointer-events-none select-none z-[1] overflow-hidden hidden sm:flex items-center justify-end"
      style={{
        width: '35vw',
        maxWidth: '35vw'
      }}
      aria-hidden="true"
    >
      {/* 
        Slow-spinning circular mandala anchored at the right screen edge so that
        a perfectly-sized half-rangoli extends into the right side of the platform.
      */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          width: `min(48vh, ${size}px)`,
          height: `min(48vh, ${size}px)`,
          marginRight: `calc(-1 * min(24vh, ${size / 2}px))`, // Anchors rotation center precisely at the right screen edge
          opacity
        }}
      >
        <img
          src="/assets/full_rangoli_terracotta.png"
          alt="South Indian Traditional Half Rangoli"
          className="w-full h-full object-contain animate-slow-spin select-none pointer-events-none filter drop-shadow-xs"
          style={{
            animationDuration: '60s'
          }}
        />
      </div>
    </div>
  );
};

export default RotatingHalfRangoliRight;

