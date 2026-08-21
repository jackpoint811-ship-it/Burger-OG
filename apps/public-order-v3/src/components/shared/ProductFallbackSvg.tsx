import React from 'react';

export type ProductTypeKind = 'burger' | 'combo' | 'side' | 'garnish' | 'drink' | 'extra' | 'other';

export interface ProductFallbackSvgProps {
  type?: ProductTypeKind | string;
  className?: string;
}

export function ProductFallbackSvg({ type = 'burger', className = 'w-full h-full' }: ProductFallbackSvgProps) {
  const normalizedType = type.toLowerCase();

  const isCombo = normalizedType.includes('combo');
  const isDrink = normalizedType.includes('drink') || normalizedType.includes('bebida') || normalizedType.includes('refresco');
  const isSide = normalizedType.includes('side') || normalizedType.includes('guarnici') || normalizedType.includes('papa') || normalizedType.includes('aro');

  if (isCombo) {
    return (
      <div className={`flex flex-col items-center justify-center bg-accent/5 p-4 text-accent ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          {/* Burger */}
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
        <span className="text-xs font-bold text-blue-500 mt-2 tracking-wide uppercase">Bebida Fría</span>
      </div>
    );
  }

  if (isSide) {
    return (
      <div className={`flex flex-col items-center justify-center bg-amber-500/5 p-4 text-amber-500 ${className}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
          <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
          {/* Fries Box */}
          <path d="M38 52L44 98H76L82 52H38Z" fill="#EF4444" fillOpacity="0.8" stroke="#EF4444" strokeWidth="2.5" />
          <rect x="44" y="20" width="6" height="34" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" transform="rotate(-6 47 37)" />
          <rect x="52" y="14" width="6" height="40" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
          <rect x="60" y="16" width="6" height="38" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" transform="rotate(4 63 35)" />
          <rect x="68" y="22" width="6" height="32" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" transform="rotate(12 71 38)" />
        </svg>
        <span className="text-xs font-bold text-amber-600 mt-2 tracking-wide uppercase">Guarnición</span>
      </div>
    );
  }

  // Default: Burger
  return (
    <div className={`flex flex-col items-center justify-center bg-accent/5 p-4 text-accent ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 max-w-full">
        <circle cx="60" cy="60" r="56" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        {/* Top Bun */}
        <path d="M24 52C24 32 40 20 60 20C80 20 96 32 96 52H24Z" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="2.5" />
        {/* Seeds */}
        <circle cx="45" cy="34" r="1.5" fill="#F59E0B" />
        <circle cx="60" cy="30" r="1.5" fill="#F59E0B" />
        <circle cx="75" cy="34" r="1.5" fill="#F59E0B" />
        {/* Lettuce wave */}
        <path d="M22 62C26 58 30 66 34 62C38 58 42 66 46 62C50 58 54 66 58 62C62 58 66 66 70 62C74 58 78 66 82 62C86 58 90 66 94 62C98 58 100 62 100 62" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Meat Patty */}
        <rect x="20" y="70" width="80" height="12" rx="6" fill="#78350F" stroke="#451A03" strokeWidth="2" />
        {/* Bottom Bun */}
        <path d="M24 90C24 95 28 98 33 98H87C92 98 96 95 96 90H24Z" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2.5" />
      </svg>
      <span className="text-xs font-bold text-accent mt-2 tracking-wide uppercase">Hamburguesa Artesanal</span>
    </div>
  );
}
