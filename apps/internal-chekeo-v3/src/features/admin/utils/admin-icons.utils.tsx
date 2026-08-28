/**
 * admin-icons.utils.tsx — Chekeo V3
 *
 * Mapeo y renderizado consistente de iconos SVG Lucide para el Panel de Control de Admin.
 */

import React from 'react';
import {
  UtensilsCrossed,
  Building2,
  Image as ImageIcon,
  Gift,
  Calculator,
  Wheat,
  Layers,
  Zap,
  Sparkles,
  Plus,
  Clock,
  Calendar,
  ArrowUpRight,
  Trophy,
  Users,
  Share2,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  ChefHat,
  TrendingUp,
  Search,
  Star,
  ArrowLeft,
  Home,
  Lock,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UtensilsCrossed,
  Building2,
  Image: ImageIcon,
  Gift,
  Calculator,
  Wheat,
  Layers,
  Zap,
  Sparkles,
  Plus,
  Clock,
  Calendar,
  ArrowUpRight,
  Trophy,
  Users,
  Share2,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  ChefHat,
  TrendingUp,
  Search,
  Star,
  ArrowLeft,
  Home,
  Lock,
  ChevronRight,
  LayoutGrid,
};

export function getAdminIcon(name: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[name] || LayoutGrid;
}
