import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { TenantConfig, TenantTheme } from '@config/tenant.types';
import { getActiveTenant } from '@config/active-tenant';

interface TenantThemeContextValue {
  tenant: TenantConfig;
  theme: TenantTheme;
  terminology: NonNullable<TenantTheme['terminology']>;
}

const defaultTenant = getActiveTenant();
const defaultTerminology: NonNullable<TenantTheme['terminology']> = defaultTenant.theme.terminology || {
  itemSingular: 'Platillo',
  itemPlural: 'Platillos',
  customizationTitle: 'Personalizar platillo',
  combosLabel: 'Paquetes',
  cartCtaLabel: 'Realizar Pedido',
  searchPlaceholder: 'Buscar platillos...',
  heroHeadline: '¡Bienvenidos!',
  heroSubtitle: 'Ordena en línea.',
};

const TenantThemeContext = createContext<TenantThemeContextValue>({
  tenant: defaultTenant,
  theme: defaultTenant.theme,
  terminology: defaultTerminology,
});

export interface TenantThemeProviderProps {
  children: React.ReactNode;
  tenant?: TenantConfig;
}

export function TenantThemeProvider({ children, tenant: customTenant }: TenantThemeProviderProps) {
  const tenant = useMemo(() => customTenant || getActiveTenant(), [customTenant]);
  const theme = tenant.theme;

  const terminology = useMemo(() => {
    return theme.terminology || defaultTerminology;
  }, [theme.terminology]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Apply data attribute for CSS scoped selectors
    root.setAttribute('data-tenant', tenant.id);
    root.setAttribute('data-radius-style', theme.radiusStyle || 'modern');

    // Dynamic Color Tokens
    if (theme.accentColor) root.style.setProperty('--color-accent', theme.accentColor);
    if (theme.accentColorDark) root.style.setProperty('--color-accent-dark', theme.accentColorDark);
    if (theme.accentColorSoft) root.style.setProperty('--color-accent-soft', theme.accentColorSoft);
    if (theme.surfaceColor) root.style.setProperty('--color-surface', theme.surfaceColor);
    if (theme.surfaceCardColor) root.style.setProperty('--color-surface-card', theme.surfaceCardColor);
    if (theme.surfaceRaisedColor) root.style.setProperty('--color-surface-raised', theme.surfaceRaisedColor);
    if (theme.surfaceAltColor) root.style.setProperty('--color-surface-alt', theme.surfaceAltColor);
    if (theme.lineColor) root.style.setProperty('--color-line', theme.lineColor);
    if (theme.shadowCta) root.style.setProperty('--shadow-cta', theme.shadowCta);

    // Dynamic Radius & Shape Tokens
    if (theme.radiusCard) root.style.setProperty('--radius-card', theme.radiusCard);
    if (theme.radiusButton) root.style.setProperty('--radius-btn', theme.radiusButton);
    if (theme.radiusBadge) root.style.setProperty('--radius-badge', theme.radiusBadge);
    if (theme.radiusInput) root.style.setProperty('--radius-input', theme.radiusInput);

    // Update document title if present
    if (tenant.brandName && tenant.tagline) {
      document.title = `${tenant.brandName} — ${tenant.tagline}`;
    }
  }, [tenant, theme]);

  const value = useMemo(() => ({
    tenant,
    theme,
    terminology,
  }), [tenant, theme, terminology]);

  return (
    <TenantThemeContext.Provider value={value}>
      {children}
    </TenantThemeContext.Provider>
  );
}

export function useTenantTheme(): TenantThemeContextValue {
  return useContext(TenantThemeContext);
}

export function useTenantTerminology(): NonNullable<TenantTheme['terminology']> {
  const { terminology } = useContext(TenantThemeContext);
  return terminology;
}
