---
name: shadcn-ui
description: Guía y patrones de composición de componentes de interfaz basados en shadcn/ui y primitivas headless de Radix UI para Burgers.exe (packages/ui).
---

# 🎨 Skill: shadcn/ui & Radix UI Component Composition (Burgers.exe)

Usa esta habilidad al crear, extender o refactorizar componentes de interfaz de usuario en `packages/ui` o en las aplicaciones `public-order-v3` e `internal-chekeo-v3`.

---

## 1. 🏗️ Arquitectura de Componentes en `packages/ui`

En Burgers.exe, los componentes de interfaz no se instalan como cajas negras de NPM, sino como **código fuente desacoplado y reutilizable** en `packages/ui/src/`.

### Estructura Canónica
```text
packages/ui/src/
├── button.tsx         # Variantes cva (default, destructive, outline, secondary, ghost, link)
├── badge.tsx          # Estados visuales y contadores
├── dialog.tsx         # Modales accesibles sobre @radix-ui/react-dialog
├── drawer.tsx         # Drawers móviles sobre Vaul / Radix
├── input.tsx          # Campos de texto con foco accesible
├── popover.tsx        # Menús flotantes anclados
├── skeleton.tsx       # Placeholders de carga animados
├── tabs.tsx           # Pestañas accesibles sobre @radix-ui/react-tabs
└── utils.ts           # Helper cn() (clsx + tailwind-merge)
```

---

## 2. 🧩 Patrones Obligatorios de Composición

### A. Uso del helper `cn()`
Siempre combina clases base con clases pasadas por `className` mediante `cn`:
```tsx
import { cn } from '@burgers-exe/ui';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-line bg-surface-card p-4 shadow-card', className)}
      {...props}
    />
  );
}
```

### B. Variantes con `class-variance-authority` (cva)
Define variantes visuales y tamaños de forma declarativa y tipada:
```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent-hover shadow-xs',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-line bg-surface-card hover:bg-surface-raised text-text-primary',
        secondary: 'bg-surface-raised text-text-primary hover:bg-surface-raised/80',
        ghost: 'hover:bg-surface-raised text-text-secondary hover:text-text-primary',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-11 rounded-xl px-8 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

### C. Patrón Polimórfico con `Slot` / `asChild`
Permite que un componente herede el comportamiento de un enlace `<a>` o botón sin anidar elementos inválidos:
```tsx
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

---

## 3. 🛑 Reglas de Oro
1. **Accesibilidad Nativa:** Todo modal o drawer debe contar con `DialogTitle` (visible o con clase `sr-only`) para cumplir con los estándares de Radix UI.
2. **Iconografía SVG Lucide:** Usar siempre iconos de `lucide-react` con tamaños explícitos (`w-4 h-4`), nunca emojis en componentes interactivos.
3. **Cero Dependencias Pesadas:** No agregar bibliotecas de UI externas adicionales (MUI, Chakra, AntDesign).
