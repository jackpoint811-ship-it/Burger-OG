import React from 'react';

export type ProductTypeKind = 'burger' | 'torta' | 'chilaquiles' | 'combo' | 'side' | 'garnish' | 'drink' | 'extra' | 'other';

export interface ProductFallbackSvgProps {
  type?: ProductTypeKind | string;
  className?: string;
}

export function ProductFallbackSvg({ type = 'other', className = 'w-full h-full' }: ProductFallbackSvgProps) {
  const normalizedType = type.toLowerCase();

  const isCombo = normalizedType.includes('combo') || normalizedType.includes('paquete');
  const isDrink = normalizedType.includes('drink') || normalizedType.includes('bebida') || normalizedType.includes('refresco') || normalizedType.includes('jugo') || normalizedType.includes('cafe') || normalizedType.includes('café');
  const isSide = normalizedType.includes('side') || normalizedType.includes('guarnici') || normalizedType.includes('papa') || normalizedType.includes('aro');
  const isTorta = normalizedType.includes('torta') || normalizedType.includes('telera') || normalizedType.includes('bolillo') || normalizedType.includes('lonche');
  const isChilaquiles = normalizedType.includes('chilaquil') || normalizedType.includes('totopo') || normalizedType.includes('caja');
  const isBurger = normalizedType.includes('burger') || normalizedType.includes('hamburguesa');

  // 1. Combo
  if (isCombo) {
    return (
      <div className={`flex flex-col items-center justify-center bg-accent/5 p-4 text-accent ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          {/* Main Dish */}
          <path d="M18 52C18 36 30 26 48 26S78 36 78 52H18Z" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="2.5" />
          <rect x="16" y="58" width="64" height="8" rx="4" fill="#EF4444" fillOpacity="0.8" stroke="#EF4444" strokeWidth="1.5" />
          <path d="M18 74H78V82C78 86 74 90 70 90H26C22 90 18 86 18 82V74Z" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2.5" />
          {/* Drink */}
          <path d="M82 44L86 94H106L110 44H82Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M96 44V26L104 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="80" y="40" width="32" height="6" rx="3" fill="currentColor" stroke="currentColor" />
        </svg>
        <span className="text-xs font-bold text-accent mt-2 tracking-wide uppercase">Combo Completo</span>
      </div>
    );
  }

  // 2. Torta de Chilaquiles / Torta Artesanal
  if (isTorta) {
    return (
      <div className={`flex flex-col items-center justify-center bg-accent/5 p-4 text-accent ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
          {/* Telera Top (Oblong/Oval Bread with 2 grooves) */}
          <path d="M16 54C16 34 32 24 60 24C88 24 104 34 104 54H16Z" fill="#F59E0B" fillOpacity="0.28" stroke="#D97706" strokeWidth="2.5" />
          {/* Telera top indentation lines */}
          <path d="M42 27V48" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <path d="M78 27V48" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          {/* Chilaquiles / Filling layer */}
          <path d="M18 58L28 53L38 58L48 53L58 58L68 53L78 58L88 53L98 58L102 62H18Z" fill="#EA580C" fillOpacity="0.85" stroke="#C2410C" strokeWidth="1.5" />
          {/* Crema & Queso layer */}
          <path d="M22 64C30 60 42 66 54 62C66 58 78 65 98 62" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          {/* Frijoles refritos / Milanesa base */}
          <rect x="18" y="68" width="84" height="10" rx="4" fill="#78350F" fillOpacity="0.75" stroke="#451A03" strokeWidth="1.5" />
          {/* Telera Bottom Bread */}
          <path d="M18 80H102C102 88 92 94 60 94C28 94 18 88 18 80Z" fill="#F59E0B" fillOpacity="0.22" stroke="#D97706" strokeWidth="2.5" />
        </svg>
        <span className="text-xs font-bold text-accent mt-2 tracking-wide uppercase">Torta Artesanal</span>
      </div>
    );
  }

  // 3. Chilaquiles en Caja / Totopos
  if (isChilaquiles) {
    return (
      <div className={`flex flex-col items-center justify-center bg-orange-500/5 p-4 text-orange-600 dark:text-orange-400 ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
          {/* Box container */}
          <path d="M24 50L32 94H88L96 50H24Z" fill="#D97706" fillOpacity="0.2" stroke="#D97706" strokeWidth="2.5" />
          <path d="M20 50H100" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
          {/* Totopos Triangles */}
          <path d="M35 44L48 24L58 44Z" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          <path d="M52 48L65 20L78 48Z" fill="#EA580C" fillOpacity="0.9" stroke="#C2410C" strokeWidth="2" />
          <path d="M72 46L82 28L92 46Z" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          {/* Crema zig-zag */}
          <path d="M32 64C45 56 55 72 68 62C78 54 86 66 90 60" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-2 tracking-wide uppercase">Chilaquiles</span>
      </div>
    );
  }

  // 4. Bebidas
  if (isDrink) {
    return (
      <div className={`flex flex-col items-center justify-center bg-blue-500/5 p-4 text-blue-500 ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
          <path d="M40 96L34 34H86L80 96H40Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="30" y="26" width="60" height="10" rx="5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
          <path d="M48 64C56 70 64 70 72 64" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.7" />
          <path d="M60 26V14L70 8" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-bold text-blue-500 mt-2 tracking-wide uppercase">Bebida / Jugo</span>
      </div>
    );
  }

  // 5. Guarnición / Side
  if (isSide) {
    return (
      <div className={`flex flex-col items-center justify-center bg-amber-500/5 p-4 text-amber-500 ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
          <path d="M38 52L44 98H76L82 52H38Z" fill="#EF4444" fillOpacity="0.8" stroke="#EF4444" strokeWidth="2.5" />
          <rect x="44" y="20" width="6" height="34" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" transform="rotate(-6 47 37)" />
          <rect x="52" y="14" width="6" height="40" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
          <rect x="60" y="16" width="6" height="38" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" transform="rotate(4 63 35)" />
          <rect x="68" y="22" width="6" height="32" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" transform="rotate(12 71 38)" />
        </svg>
        <span className="text-xs font-bold text-amber-600 mt-2 tracking-wide uppercase">Complemento</span>
      </div>
    );
  }

  // 6. Burger
  if (isBurger) {
    return (
      <div className={`flex flex-col items-center justify-center bg-accent/5 p-4 text-accent ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
          <path d="M24 52C24 32 40 20 60 20C80 20 96 32 96 52H24Z" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="45" cy="34" r="1.5" fill="#F59E0B" />
          <circle cx="60" cy="30" r="1.5" fill="#F59E0B" />
          <circle cx="75" cy="34" r="1.5" fill="#F59E0B" />
          <path d="M22 62C26 58 30 66 34 62C38 58 42 66 46 62C50 58 54 66 58 62C62 58 66 66 70 62C74 58 78 66 82 62C86 58 90 66 94 62C98 58 100 62 100 62" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="20" y="70" width="80" height="12" rx="6" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          <path d="M24 90C24 95 28 98 33 98H87C92 98 96 95 96 90H24Z" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2.5" />
        </svg>
        <span className="text-xs font-bold text-accent mt-2 tracking-wide uppercase">Hamburguesa Artesanal</span>
      </div>
    );
  }

  // 7. General Food / Default
  return (
    <div className={`flex flex-col items-center justify-center bg-accent/5 p-4 text-accent ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
        <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        {/* Cloche / Plate icon */}
        <path d="M22 76H98" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M28 72C28 48 42 36 60 36C78 36 92 48 92 72H28Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="60" cy="30" r="4" fill="currentColor" />
        <rect x="34" y="82" width="52" height="6" rx="3" fill="currentColor" fillOpacity="0.3" />
      </svg>
      <span className="text-xs font-bold text-accent mt-2 tracking-wide uppercase">Platillo Especial</span>
    </div>
  );
}
