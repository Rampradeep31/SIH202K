import React from 'react';

interface MotifProps {
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
}

/**
 * Elegant slow-spinning traditional South Indian geometric Kolam / Mandala Rosette.
 * Placed at the bottom-right corner of the website.
 */
export const RotatingCornerMandala: React.FC<{
  size?: number;
  className?: string;
  opacity?: number;
}> = ({
  size = 110,
  className = '',
  opacity = 0.55
}) => {
  return (
    <div
      className={`fixed bottom-4 right-4 z-20 pointer-events-none select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size, opacity }}
      title="South Indian Traditional Mandala"
      aria-hidden="true"
    >
      {/* Outer slow-spinning decorative ring (48s rotation) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full animate-slow-spin"
      >
        {/* Outer dotted orbit */}
        <circle cx="50" cy="50" r="47" stroke="#D49B28" strokeWidth="0.8" strokeDasharray="2.5 3.5" opacity="0.8" />
        <circle cx="50" cy="50" r="43" stroke="#C04A26" strokeWidth="1" opacity="0.6" />

        {/* 16 Sacred Lotus Petals */}
        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle, i) => (
          <g key={i} transform={`rotate(${angle} 50 50)`}>
            <path
              d="M50 7 C53 20 57 28 50 38 C43 28 47 20 50 7 Z"
              stroke={i % 2 === 0 ? '#C04A26' : '#D49B28'}
              strokeWidth="1.1"
              fill={i % 2 === 0 ? '#C04A26' : '#D49B28'}
              fillOpacity="0.12"
            />
            <circle cx="50" cy="9" r="1.3" fill="#D49B28" />
            <circle cx="50" cy="46" r="1.1" fill="#C04A26" />
          </g>
        ))}

        {/* Middle Ring with Interlaced Kolam Arcs */}
        <circle cx="50" cy="50" r="28" stroke="#D49B28" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="24" stroke="#C04A26" strokeWidth="0.9" />
      </svg>

      {/* Inner counter-spinning 8-point Kolam Star (60s reverse rotation) */}
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[58%] h-[58%] animate-slow-spin-reverse"
      >
        {/* 8-point geometric star */}
        {[0, 45, 90, 135].map((angle, i) => (
          <g key={i} transform={`rotate(${angle} 30 30)`}>
            <rect
              x="13"
              y="13"
              width="34"
              height="34"
              stroke={i % 2 === 0 ? '#C04A26' : '#D49B28'}
              strokeWidth="1.2"
              fill={i % 2 === 0 ? '#C04A26' : '#D49B28'}
              fillOpacity="0.1"
            />
          </g>
        ))}

        {/* Inner Flower & Bindu */}
        <circle cx="30" cy="30" r="9" stroke="#1E6B48" strokeWidth="1" fill="#FAF9F5" fillOpacity="0.8" />
        <circle cx="30" cy="30" r="4.5" fill="#C04A26" fillOpacity="0.85" />
        <circle cx="30" cy="30" r="2" fill="#D49B28" />
      </svg>
    </div>
  );
};

/**
 * Symmetrical thin-line geometric Kolam corner flourish.
 */
export const KolamCorner: React.FC<MotifProps & { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = ({
  className = '',
  color = '#C04A26',
  size = 40,
  opacity = 0.45,
  position = 'top-right'
}) => {
  const getTransform = () => {
    switch (position) {
      case 'top-left':
        return '';
      case 'top-right':
        return 'scale(-1, 1)';
      case 'bottom-left':
        return 'scale(1, -1)';
      case 'bottom-right':
        return 'scale(-1, -1)';
      default:
        return '';
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none shrink-0 ${className}`}
      style={{ opacity, transform: getTransform(), transformOrigin: 'center' }}
    >
      <path
        d="M2 2H20C24 2 28 6 28 10C28 14 24 18 20 18H10C6 18 2 22 2 26V38"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 10H14C18 10 20 12 20 15C20 18 18 20 15 20H10C6 20 2 24 2 28"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="6" cy="6" r="1.5" fill={color} />
      <circle cx="14" cy="6" r="1.2" fill={color} />
      <circle cx="6" cy="14" r="1.2" fill={color} />
      <circle cx="14" cy="14" r="1" fill={color} />
      <circle cx="22" cy="10" r="1" fill={color} />
      <circle cx="10" cy="22" r="1" fill={color} />
      <circle cx="6" cy="30" r="1" fill={color} />
      <circle cx="30" cy="6" r="1" fill={color} />
    </svg>
  );
};

/**
 * Subtle horizontal geometric motif divider for section separators.
 */
export const TamilGeometricDivider: React.FC<MotifProps & { label?: string }> = ({
  className = '',
  color = '#C04A26',
  opacity = 0.4,
  label
}) => {
  return (
    <div className={`flex items-center justify-center space-x-3 my-3 ${className}`} style={{ opacity }}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2DDD5] to-[#C04A26]/40" />
      
      <div className="flex items-center space-x-1.5 shrink-0">
        <svg width="28" height="14" viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14 1L19 7L14 13L9 7L14 1Z"
            stroke={color}
            strokeWidth="1.1"
            fill="none"
          />
          <circle cx="14" cy="7" r="1.5" fill={color} />
          <path d="M2 7H9M19 7H26" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <circle cx="4" cy="7" r="1" fill={color} />
          <circle cx="24" cy="7" r="1" fill={color} />
        </svg>
        {label && (
          <span className="text-[10px] font-bold tracking-widest uppercase text-tn-charcoal/70 px-1 font-serif">
            {label}
          </span>
        )}
      </div>

      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2DDD5] to-[#C04A26]/40" />
    </div>
  );
};

/**
 * Official Platform Emblem / Logo Badge using the uploaded South Indian Heritage Crest.
 */
export const TamilEmblemBadge: React.FC<{ size?: number; className?: string }> = ({
  size = 42,
  className = ''
}) => {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-white/95 border border-[#E2DDD5] shadow-xs shrink-0 overflow-hidden p-0.5 hover:scale-105 transition-transform duration-200 ${className}`}
      style={{ width: size, height: size }}
      title="Land Governance Intelligence Platform"
    >
      <img
        src="/assets/app_logo.png"
        alt="Land Governance Intelligence Platform Logo"
        className="w-full h-full object-contain filter drop-shadow-xs rounded-full"
      />
    </div>
  );
};

/**
 * Palm leaf manuscript corner detail flourish.
 */
export const PalmLeafDetail: React.FC<MotifProps> = ({
  className = '',
  color = '#1E6B48',
  size = 36,
  opacity = 0.35
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none shrink-0 ${className}`}
      style={{ opacity }}
    >
      <path
        d="M4 32C8 20 20 8 32 4M32 4C28 12 24 20 20 24M32 4C20 8 12 12 4 16M4 32C12 28 20 24 24 20"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="4" r="1.5" fill={color} />
      <circle cx="20" cy="24" r="1" fill={color} />
      <circle cx="4" cy="16" r="1" fill={color} />
    </svg>
  );
};

/* ========================================================================= */
/* TRADITIONAL ACTIVITY SCENES & TEMPLE ART (LIGHT THEMED VECTOR ILLUSTRATIONS) */
/* ========================================================================= */

/**
 * Majestic Dravidian Temple Gopuram and Mandapam Panoramic Skyline Scene.
 * Designed for light-themed hero banners, card watermarks, and empty states.
 */
export const TempleSkylineIllustration: React.FC<{
  className?: string;
  opacity?: number;
  height?: number;
}> = ({ className = '', opacity = 0.15, height = 120 }) => {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ opacity, height }}>
      <svg
        viewBox="0 0 1200 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover object-bottom"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="templeGoldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D49B28" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C04A26" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Base ground line */}
        <line x1="0" y1="135" x2="1200" y2="135" stroke="#C04A26" strokeWidth="1.5" />
        <line x1="0" y1="138" x2="1200" y2="138" stroke="#D49B28" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* Left Mandapam & Pillars */}
        <path d="M40 135V105H120V135M55 105V135M75 105V135M95 105V135M105 105V135" stroke="#C04A26" strokeWidth="1" />
        <path d="M30 105H130L125 95H35L30 105Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1" />
        <circle cx="80" cy="90" r="3" fill="#D49B28" />

        {/* Small Left Gopuram */}
        <path d="M180 135V90H260V135" stroke="#C04A26" strokeWidth="1.2" />
        <path d="M175 90H265L255 70H185L175 90Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1.2" />
        <path d="M190 70H250L245 52H195L190 70Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1" />
        <path d="M200 52H240L235 38H205L200 52Z" stroke="#C04A26" strokeWidth="1" />
        <path d="M210 38H230L225 25H215L210 38Z" stroke="#C04A26" strokeWidth="1" />
        <circle cx="220" cy="20" r="2.5" fill="#D49B28" />

        {/* Central Grand Raja Gopuram (Thanjavur/Madurai style) */}
        <g transform="translate(480, 0)">
          {/* Main Entrance Archway */}
          <path d="M60 135V95C60 78 140 78 140 95V135" fill="#FAF9F5" stroke="#C04A26" strokeWidth="1.5" />
          <path d="M80 135V105C80 92 120 92 120 105V135" stroke="#D49B28" strokeWidth="1" />
          <path d="M20 135V95H180V135" stroke="#C04A26" strokeWidth="1.5" />

          {/* Stepped Tiers 1-7 */}
          <path d="M15 95H185L175 80H25L15 95Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M30 80H170L162 66H38L30 80Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M42 66H158L152 53H48L42 66Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M52 53H148L142 41H58L52 53Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M62 41H138L132 30H68L62 41Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M72 30H128L122 20H78L72 30Z" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M80 20H120L115 12H85L80 20Z" stroke="#C04A26" strokeWidth="1.2" />

          {/* Crown Finials / Kalasams (5 traditional finials) */}
          <circle cx="88" cy="8" r="2" fill="#D49B28" stroke="#C04A26" strokeWidth="0.5" />
          <circle cx="94" cy="7" r="2.2" fill="#D49B28" stroke="#C04A26" strokeWidth="0.5" />
          <circle cx="100" cy="5" r="3" fill="#D49B28" stroke="#C04A26" strokeWidth="0.8" />
          <circle cx="106" cy="7" r="2.2" fill="#D49B28" stroke="#C04A26" strokeWidth="0.5" />
          <circle cx="112" cy="8" r="2" fill="#D49B28" stroke="#C04A26" strokeWidth="0.5" />
        </g>

        {/* Right Mandapam & Flagstaff (Dwajasthambam) */}
        <g transform="translate(820, 0)">
          {/* Flagstaff */}
          <line x1="30" y1="135" x2="30" y2="35" stroke="#D49B28" strokeWidth="2" />
          <circle cx="30" cy="32" r="3" fill="#D49B28" />
          <path d="M30 38L50 45L30 52V38Z" fill="#C04A26" />

          {/* Right Sub-shrine / Vimana */}
          <path d="M70 135V95H150V135" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M65 95H155L145 75H75L65 95Z" fill="url(#templeGoldGrad)" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M80 75H140L135 55H85L80 75Z" stroke="#C04A26" strokeWidth="1.2" />
          <path d="M90 55H130L125 38H95L90 55Z" stroke="#C04A26" strokeWidth="1" />
          <circle cx="110" cy="32" r="3" fill="#D49B28" />

          {/* Stepped Temple Tank / Kulam Ghats */}
          <path d="M190 135L220 120H320L350 135" stroke="#254E7A" strokeWidth="1.2" />
          <path d="M200 135L225 125H315L340 135" stroke="#254E7A" strokeWidth="0.8" />
          <path d="M210 135L230 130H310L330 135" stroke="#254E7A" strokeWidth="0.8" />
          {/* Water ripples */}
          <path d="M240 132C260 130 280 134 300 132" stroke="#254E7A" strokeWidth="1" strokeDasharray="2 2" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Traditional Tamil Agricultural & Water Tank ('Eri') Scene.
 * Features cascading irrigation channels, lush paddy fields, coconut palms, and agrarian activity.
 */
export const AgriculturalEriScene: React.FC<{
  className?: string;
  opacity?: number;
}> = ({ className = '', opacity = 0.2 }) => {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ opacity }}>
      <svg
        viewBox="0 0 500 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="paddyGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E6B48" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1E6B48" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="waterBlue" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#254E7A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1E6B48" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Distant Hills / Western Ghats silhouette */}
        <path d="M0 70C60 45 130 65 190 40C260 15 340 50 420 30C460 20 480 35 500 25V90H0V70Z" fill="#1E6B48" fillOpacity="0.06" />

        {/* Sun rising with radiating beams */}
        <circle cx="210" cy="45" r="16" stroke="#D49B28" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="210" cy="45" r="8" fill="#D49B28" fillOpacity="0.3" />

        {/* Traditional Irrigation Tank (Eri) Bund & Sluice Gate (Madagu) */}
        <path d="M0 90C80 85 160 88 240 82C320 76 400 85 500 80" stroke="#C04A26" strokeWidth="1.5" />
        {/* Sluice Gate Stones */}
        <rect x="180" y="75" width="25" height="15" fill="#FAF9F5" stroke="#C04A26" strokeWidth="1" rx="2" />
        <line x1="188" y1="75" x2="188" y2="90" stroke="#C04A26" strokeWidth="1" />
        <line x1="197" y1="75" x2="197" y2="90" stroke="#C04A26" strokeWidth="1" />

        {/* Water Stream flowing from sluice */}
        <path d="M192 90C190 115 170 130 150 145C130 160 90 165 40 180" stroke="#254E7A" strokeWidth="2.5" fill="none" />
        <path d="M195 90C195 115 220 135 250 150C280 165 320 170 380 180" stroke="#254E7A" strokeWidth="2" strokeDasharray="4 2" fill="none" />

        {/* Terraced Paddy Fields (Pachai Vayal) */}
        <polygon points="10,105 160,98 140,140 0,145" fill="url(#paddyGreen)" stroke="#1E6B48" strokeWidth="1" />
        <polygon points="175,102 330,95 310,135 160,138" fill="url(#paddyGreen)" stroke="#1E6B48" strokeWidth="1" />
        <polygon points="345,98 490,92 480,130 325,133" fill="url(#paddyGreen)" stroke="#1E6B48" strokeWidth="1" />

        {/* Lower Fields with Furrows */}
        <polygon points="0,150 130,145 100,180 0,180" fill="url(#paddyGreen)" stroke="#1E6B48" strokeWidth="1" />
        <polygon points="155,145 300,140 280,180 120,180" fill="url(#paddyGreen)" stroke="#1E6B48" strokeWidth="1" />
        <polygon points="325,140 480,135 460,180 300,180" fill="url(#paddyGreen)" stroke="#1E6B48" strokeWidth="1" />

        {/* Coconut Palms on the field bunds */}
        <g transform="translate(70, 45)">
          <path d="M15 50C16 35 18 20 20 0" stroke="#C04A26" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20 0C10 -5 0 0 -10 10M20 0C15 -10 5 -15 -5 -15M20 0C25 -12 35 -15 45 -10M20 0C30 -5 40 2 50 12M20 0C22 -8 30 -12 38 -8" stroke="#1E6B48" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <g transform="translate(420, 35) scale(0.85)">
          <path d="M15 50C14 35 12 20 10 0" stroke="#C04A26" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 0C0 -5 -10 0 -20 10M10 0C5 -10 -5 -15 -15 -15M10 0C15 -12 25 -15 35 -10M10 0C20 -5 30 2 40 12" stroke="#1E6B48" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Agrarian Activity: Bullock Cart / Oxen silhouette vector */}
        <g transform="translate(250, 105) scale(0.65)">
          {/* Cart Wheels */}
          <circle cx="20" cy="20" r="10" stroke="#C04A26" strokeWidth="1.5" />
          <line x1="20" y1="10" x2="20" y2="30" stroke="#C04A26" strokeWidth="1" />
          <line x1="10" y1="20" x2="30" y2="20" stroke="#C04A26" strokeWidth="1" />
          <rect x="5" y="5" width="28" height="12" fill="#FAF9F5" stroke="#C04A26" strokeWidth="1" rx="1" />
          {/* Cart Shaft & Ox */}
          <line x1="33" y1="14" x2="52" y2="12" stroke="#C04A26" strokeWidth="1.5" />
          <path d="M52 14C55 8 62 8 68 12L72 24H68L66 18H56L54 24H50L52 14Z" stroke="#C04A26" strokeWidth="1.2" fill="#FAF9F5" />
          <path d="M68 8C70 4 72 2 74 3" stroke="#C04A26" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Traditional Textile Weaving & Handloom Scene.
 * Celebrates Tiruppur / Kongu textile craft heritage with shuttle, warp/weft loom, and spinning wheel.
 */
export const TextileWeavingScene: React.FC<{
  className?: string;
  opacity?: number;
}> = ({ className = '', opacity = 0.2 }) => {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ opacity }}>
      <svg
        viewBox="0 0 360 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Handloom Frame Structure */}
        <rect x="30" y="20" width="180" height="100" stroke="#C04A26" strokeWidth="1.8" rx="3" />
        <line x1="30" y1="40" x2="210" y2="40" stroke="#C04A26" strokeWidth="1" />
        <line x1="30" y1="95" x2="210" y2="95" stroke="#C04A26" strokeWidth="1" />

        {/* Warp vertical threads */}
        {[50, 65, 80, 95, 110, 125, 140, 155, 170, 185].map((x) => (
          <line key={x} x1={x} y1="40" x2={x} y2="95" stroke="#D49B28" strokeWidth="0.8" strokeDasharray="2 1" />
        ))}

        {/* Weft shuttle in center */}
        <g transform="translate(100, 60)">
          <path d="M0 6C10 0 30 0 40 6C30 12 10 12 0 6Z" fill="#FAF9F5" stroke="#C04A26" strokeWidth="1.2" />
          <ellipse cx="20" cy="6" rx="8" ry="3" fill="#D49B28" />
          <circle cx="20" cy="6" r="1.5" fill="#C04A26" />
        </g>

        {/* Traditional Spinning Wheel (Charkha) */}
        <g transform="translate(240, 35)">
          <circle cx="50" cy="50" r="32" stroke="#C04A26" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="4" fill="#C04A26" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="50"
              x2={50 + 30 * Math.cos((deg * Math.PI) / 180)}
              y2={50 + 30 * Math.sin((deg * Math.PI) / 180)}
              stroke="#D49B28"
              strokeWidth="0.9"
            />
          ))}
          {/* Spindle & Base */}
          <line x1="10" y1="82" x2="90" y2="82" stroke="#C04A26" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="82" x2="20" y2="55" stroke="#C04A26" strokeWidth="1.5" />
          <line x1="50" y1="82" x2="50" y2="50" stroke="#C04A26" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Palm-Leaf Manuscript & Ancient Land Survey Cartography Scene.
 */
export const PalmLeafCartographyScene: React.FC<{
  className?: string;
  opacity?: number;
}> = ({ className = '', opacity = 0.2 }) => {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ opacity }}>
      <svg
        viewBox="0 0 340 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Palm Leaf Manuscript Stack (Olaichuvadi) */}
        <g transform="translate(20, 20)">
          {/* Bottom leaf */}
          <rect x="5" y="10" width="280" height="35" rx="4" fill="#FAF9F5" stroke="#E2DDD5" strokeWidth="1" />
          {/* Middle leaf */}
          <rect x="2" y="5" width="285" height="35" rx="4" fill="#FDFBF7" stroke="#D49B28" strokeWidth="1" />
          {/* Top leaf */}
          <rect x="0" y="0" width="290" height="35" rx="4" fill="#FFFFFF" stroke="#C04A26" strokeWidth="1.2" />

          {/* Binding Holes & Thread */}
          <circle cx="45" cy="17.5" r="3" fill="#FAF9F5" stroke="#C04A26" strokeWidth="1.2" />
          <circle cx="245" cy="17.5" r="3" fill="#FAF9F5" stroke="#C04A26" strokeWidth="1.2" />
          <line x1="45" y1="0" x2="45" y2="35" stroke="#C04A26" strokeWidth="0.8" />
          <line x1="245" y1="0" x2="245" y2="35" stroke="#C04A26" strokeWidth="0.8" />

          {/* Ancient Survey Grid & Inscriptions */}
          <line x1="70" y1="10" x2="220" y2="10" stroke="#D49B28" strokeWidth="0.8" strokeDasharray="3 2" />
          <line x1="70" y1="18" x2="220" y2="18" stroke="#D49B28" strokeWidth="0.8" strokeDasharray="4 2" />
          <line x1="70" y1="26" x2="220" y2="26" stroke="#D49B28" strokeWidth="0.8" strokeDasharray="3 2" />

          {/* Micro Compass Star on leaf */}
          <g transform="translate(145, 17.5)">
            <path d="M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z" fill="#C04A26" />
          </g>
        </g>
      </svg>
    </div>
  );
};

/* ========================================================================= */
/* INTERACTIVE CHART & GAUGE COMPONENTS */
/* ========================================================================= */

/**
 * Animated SVG Circular Progress Ring Gauge.
 */
export const RadialProgressRing: React.FC<{
  value: number; // 0 to 100
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  unit?: string;
  className?: string;
}> = ({
  value,
  max = 100,
  size = 72,
  strokeWidth = 6,
  color = '#C04A26',
  trackColor = '#EFECE6',
  label,
  sublabel,
  unit = '%',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - pct * circumference;

  return (
    <div className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-mono font-bold text-tn-charcoal leading-none">
          {value}{unit}
        </span>
        {sublabel && (
          <span className="text-[9px] font-sans text-tn-charcoal/60 mt-0.5 leading-none">
            {sublabel}
          </span>
        )}
      </div>
      {label && (
        <span className="text-[10px] font-bold text-tn-charcoal/80 mt-1 uppercase tracking-wider text-center">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Micro SVG Sparkline Area Chart with smooth gradient fill.
 */
export const MiniSparklineArea: React.FC<{
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}> = ({
  data = [10, 25, 18, 30, 45, 38, 55],
  width = 120,
  height = 36,
  color = '#C04A26',
  className = ''
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 8) + 4;
    const y = height - 6 - ((val - min) / range) * (height - 12);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${width - 4},${height} L 4,${height} Z`;
  const lastPoint = points[points.length - 1].split(',');

  return (
    <div className={`inline-block shrink-0 ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#sparkGrad-${color.replace('#', '')})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Pulsing endpoint */}
        <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill={color} stroke="#FFFFFF" strokeWidth="1.2" />
      </svg>
    </div>
  );
};

/**
 * Proportional Dual Segment Split Bar Meter (e.g. Agricultural vs Built-up %).
 */
export const DualSegmentBarMeter: React.FC<{
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
  leftColor?: string;
  rightColor?: string;
  height?: number;
  className?: string;
}> = ({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  leftColor = '#1E6B48',
  rightColor = '#C04A26',
  height = 8,
  className = ''
}) => {
  const total = leftValue + rightValue || 100;
  const leftPct = (leftValue / total) * 100;
  const rightPct = (rightValue / total) * 100;

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      <div className="flex justify-between items-center text-[10px] font-sans">
        <span className="font-bold flex items-center gap-1" style={{ color: leftColor }}>
          <span className="w-2 h-2 rounded-xs inline-block" style={{ backgroundColor: leftColor }} />
          {leftLabel}: {leftValue}%
        </span>
        <span className="font-bold flex items-center gap-1" style={{ color: rightColor }}>
          <span className="w-2 h-2 rounded-xs inline-block" style={{ backgroundColor: rightColor }} />
          {rightLabel}: {rightValue}%
        </span>
      </div>
      <div className="w-full bg-[#EFECE6] rounded-full overflow-hidden flex" style={{ height }}>
        <div
          className="transition-all duration-700 ease-out"
          style={{ width: `${leftPct}%`, backgroundColor: leftColor }}
        />
        <div
          className="transition-all duration-700 ease-out"
          style={{ width: `${rightPct}%`, backgroundColor: rightColor }}
        />
      </div>
    </div>
  );
};

/**
 * Semicircular Metric Gauge Dial for Risk Scores & Quality Indexes.
 */
export const MetricGaugeDial: React.FC<{
  value: number; // 0 to 100
  size?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  className?: string;
}> = ({
  value,
  size = 110,
  label,
  sublabel,
  color = '#C04A26',
  className = ''
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // semicircle
  const pct = Math.min(Math.max(value / 100, 0), 1);
  const strokeDashoffset = circumference - pct * circumference;

  return (
    <div className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
        <svg width={size} height={size / 2 + strokeWidth} className="overflow-visible">
          {/* Background track arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#EFECE6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Colored progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-center">
          <span className="text-base font-mono font-extrabold text-tn-charcoal leading-none">
            {value}
          </span>
          {sublabel && (
            <span className="text-[9px] font-sans text-tn-charcoal/60 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-bold text-tn-charcoal/80 uppercase tracking-wider mt-1 text-center">
          {label}
        </span>
      )}
    </div>
  );
};

/* ========================================================================= */
/* ROTATING ORNATE MANDALA MEDALLION (USER-PROVIDED TRADITIONAL ROSETTE)    */
/* ========================================================================= */

/**
 * High-fidelity vector reproduction of the traditional ornate South Indian mandala rosette.
 * Renders an 8-fold symmetrical mandala with concentric lotus petals, fish-scale peacock textures,
 * fluted sunburst rays, and pointed outer crests with delicate beaded trim.
 */
export const MandalaRosetteVector: React.FC<{
  color?: string;
  secondaryColor?: string;
  size?: number;
  className?: string;
}> = ({
  color = '#C04A26',
  secondaryColor = '#D49B28',
  size = 400,
  className = ''
}) => {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible ${className}`}
    >
      <defs>
        {/* Core 45-degree sector containing concentric tiers */}
        <g id="mandala-tier-sector">
          {/* TIER 1: Center Spoke Teeth & Radiating Rings */}
          <g>
            {[-18, -12, -6, 0, 6, 12, 18].map((a) => (
              <line
                key={`spoke-${a}`}
                x1={250 + 26 * Math.sin((a * Math.PI) / 180)}
                y1={250 - 26 * Math.cos((a * Math.PI) / 180)}
                x2={250 + 38 * Math.sin((a * Math.PI) / 180)}
                y2={250 - 38 * Math.cos((a * Math.PI) / 180)}
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* TIER 2: Inner Pointed Lotus Petal (At 0 deg) */}
          <g>
            {/* Outer Petal Silhouette */}
            <path
              d="M 236 210 C 232 175, 250 148, 250 148 C 250 148, 268 175, 264 210 Z"
              fill="#FAF9F5"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Inner Petal Crease & Veining */}
            <line x1="250" y1="208" x2="250" y2="154" stroke={color} strokeWidth="1.5" />
            <path
              d="M 250 190 C 244 186, 240 180, 239 175M 250 190 C 256 186, 260 180, 261 175"
              stroke={secondaryColor}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 250 175 C 246 170, 243 166, 243 162M 250 175 C 254 170, 257 166, 257 162"
              stroke={secondaryColor}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>

          {/* TIER 3: Scalloped Fish-Scale / Peacock Feather Cluster (Offset at 22.5 deg) */}
          <g transform="rotate(22.5 250 250)">
            {/* Base Arch Container */}
            <path
              d="M 230 175 C 238 145, 262 145, 270 175"
              fill="#FAF9F5"
              stroke={color}
              strokeWidth="1.8"
            />
            {/* Concentric Fish-Scale Arcs */}
            <path
              d="M 234 168 C 242 152, 258 152, 266 168"
              fill="none"
              stroke={color}
              strokeWidth="1.4"
            />
            <path
              d="M 238 162 C 244 150, 256 150, 262 162"
              fill={color}
              fillOpacity="0.15"
              stroke={color}
              strokeWidth="1.2"
            />
            {/* Peacock Eye / Drop in Center */}
            <ellipse cx="250" cy="155" rx="4" ry="6" fill={color} />
            <circle cx="250" cy="153" r="1.8" fill="#FAF9F5" />

            {/* Nested lower scale rows */}
            <path
              d="M 238 178 C 242 172, 248 172, 250 178 C 252 172, 258 172, 262 178"
              stroke={color}
              strokeWidth="1.2"
              fill="none"
            />
          </g>

          {/* TIER 4: Fluted Sunburst Rays & Heavy Concentric Arch Band */}
          <g>
            {/* Inner Fan Boundary Arc */}
            <path
              d="M 218 135 C 234 122, 266 122, 282 135"
              fill="none"
              stroke={color}
              strokeWidth="1.6"
            />
            {/* Fluted Vertical Sunburst Bars */}
            {[-18, -14, -10, -6, -2, 2, 6, 10, 14, 18].map((a) => (
              <line
                key={`fan-${a}`}
                x1={250 + 128 * Math.sin((a * Math.PI) / 180)}
                y1={250 - 128 * Math.cos((a * Math.PI) / 180)}
                x2={250 + 152 * Math.sin((a * Math.PI) / 180)}
                y2={250 - 152 * Math.cos((a * Math.PI) / 180)}
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ))}

            {/* Heavy Solid Arc Band */}
            <path
              d="M 206 108 C 230 92, 270 92, 294 108 L 297 98 C 270 82, 230 82, 203 98 Z"
              fill={color}
              stroke={color}
              strokeWidth="1"
            />

            {/* Row of Delicate Circular Beads along the Arc */}
            {[-18, -12, -6, 0, 6, 12, 18].map((a) => (
              <circle
                key={`bead-${a}`}
                cx={250 + 160 * Math.sin((a * Math.PI) / 180)}
                cy={250 - 160 * Math.cos((a * Math.PI) / 180)}
                r="2.2"
                fill={secondaryColor}
                stroke={color}
                strokeWidth="0.8"
              />
            ))}
          </g>

          {/* TIER 5: Outer Majestic Pointed Lotus Crest Petal */}
          <g>
            {/* Outer Pointed Lotus Crest with Curving Shoulders */}
            <path
              d="M 194 104 C 196 68, 240 42, 250 18 C 260 42, 304 68, 306 104 C 290 88, 270 78, 250 78 C 230 78, 210 88, 194 104 Z"
              fill="#FAF9F5"
              stroke={color}
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Secondary Inner Contour Echo */}
            <path
              d="M 206 95 C 212 72, 240 54, 250 36 C 260 54, 288 72, 294 95"
              fill="none"
              stroke={color}
              strokeWidth="1.4"
            />
            {/* Outer Peak Bead Accent */}
            <circle cx="250" cy="20" r="2.5" fill={secondaryColor} />
            <circle cx="250" cy="52" r="2" fill={color} />
          </g>
        </g>
      </defs>

      {/* Central Dividing Concentric Circles */}
      <circle cx="250" cy="250" r="16" fill="#FAF9F5" stroke={color} strokeWidth="2" />
      <circle cx="250" cy="250" r="24" stroke={color} strokeWidth="1.5" />
      <circle cx="250" cy="250" r="40" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="250" cy="250" r="44" stroke={color} strokeWidth="2" />

      {/* 8-Sector Rotated Mandala Geometry */}
      {angles.map((ang) => (
        <use
          key={`mandala-sector-${ang}`}
          href="#mandala-tier-sector"
          transform={`rotate(${ang} 250 250)`}
        />
      ))}

      {/* Complete Outer Rangoli Boundary Ring with Connecting Dots */}
      <circle
        cx="250"
        cy="250"
        r="246"
        stroke={secondaryColor}
        strokeWidth="1.2"
        strokeDasharray="4 4"
        fill="none"
      />
      {angles.map((ang) => (
        <circle
          key={`outer-dot-${ang}`}
          cx={250 + 246 * Math.sin(((ang + 22.5) * Math.PI) / 180)}
          cy={250 - 246 * Math.cos(((ang + 22.5) * Math.PI) / 180)}
          r="3"
          fill={color}
        />
      ))}
    </svg>
  );
};

/**
 * Animated Continuous Rotating Rangoli / Mandala.
 * Positioned in the middle of the website as an ambient centerpiece or along borders/corners with slow, continuous rotation.
 */
export const RotatingBorderMandala: React.FC<{
  position?: 'center' | 'right-edge' | 'top-right' | 'bottom-right' | 'left-edge' | 'custom';
  color?: string;
  secondaryColor?: string;
  size?: number;
  opacity?: number;
  duration?: number; // in seconds
  reverse?: boolean;
  className?: string;
}> = ({
  position = 'center',
  color = '#C04A26',
  secondaryColor = '#D49B28',
  size = 580,
  opacity = 0.12,
  duration = 60,
  reverse = false,
  className = ''
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'center':
        return 'fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden';
      case 'right-edge':
        return 'fixed -right-[230px] top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none';
      case 'top-right':
        return 'fixed -right-[160px] -top-[160px] z-20 pointer-events-none select-none';
      case 'bottom-right':
        return 'fixed -right-[160px] -bottom-[160px] z-20 pointer-events-none select-none';
      case 'left-edge':
        return 'fixed -left-[230px] top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none';
      case 'custom':
      default:
        return 'pointer-events-none select-none';
    }
  };

  return (
    <div
      className={`${getPositionClasses()} ${className}`}
      style={{ opacity }}
      title="TN Heritage Center Rotating Rangoli"
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          animation: `slowSpin ${duration}s linear infinite ${reverse ? 'reverse' : 'normal'}`
        }}
      >
        <MandalaRosetteVector
          color={color}
          secondaryColor={secondaryColor}
          size={size}
        />
      </div>
    </div>
  );
};

// Re-export alias for semantic clarity
export const RotatingCenterRangoli = RotatingBorderMandala;


