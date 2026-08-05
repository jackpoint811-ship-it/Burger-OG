import { parseOrderCustomerDetails, type StandardizedOrderDetails } from "./order-parser";
import type { OrderV2PaymentStatus, OrderV2Status } from "@config/index";

export type MinimalOrderForV3 = {
  id: string;
  folio: string;
  customer?: string;
  notes?: string;
  createdAtIso?: string;
  createdAtMs?: number;
  deliveryLocation?: string;
  scheduledDeliveryDate?: string;
  scheduledDeliveryTime?: string;
  paymentState?: OrderV2PaymentStatus;
  status?: OrderV2Status;
};

export type V3PaymentStateBadge = {
  label: string;
  tone: "neutral" | "success" | "warning" | "critical" | "info";
};

export type V3StatusBadge = {
  label: string;
  tone: "neutral" | "success" | "warning" | "critical" | "info";
};

/**
 * Standardized customer details and delivery metadata for V3 UI cards.
 */
export function getV3OrderDetails(order: MinimalOrderForV3): StandardizedOrderDetails {
  return parseOrderCustomerDetails(
    order.customer,
    order.notes,
    order.createdAtIso
  );
}

/**
 * Extracts normalized YYYY-MM-DD string from order's scheduled delivery date or creation date.
 */
export function getOrderDeliveryDateKey(order: MinimalOrderForV3): string {
  const details = getV3OrderDetails(order);
  if (details.scheduledDeliveryDate) {
    return details.scheduledDeliveryDate;
  }

  // Fallback to creation date (YYYY-MM-DD in local/Mexico time)
  if (order.createdAtIso) {
    const d = new Date(order.createdAtIso);
    if (!Number.isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  if (order.createdAtMs) {
    const d = new Date(order.createdAtMs);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns user-friendly status badge properties for OrderV2Status or legacy OrderStatus.
 */
export function getV3StatusBadge(status?: string): V3StatusBadge {
  switch (status) {
    case "new":
    case "placed":
      return { label: "Recibido", tone: "info" };
    case "preparing":
    case "kitchen_preparing":
      return { label: "En Preparación", tone: "warning" };
    case "ready":
    case "kitchen_ready":
      return { label: "Listo en Cocina", tone: "success" };
    case "delivered":
      return { label: "Entregado", tone: "neutral" };
    case "cancelled":
      return { label: "Cancelado", tone: "critical" };
    default:
      return { label: "Pendiente", tone: "info" };
  }
}

/**
 * Returns user-friendly payment status badge properties for OrderV2PaymentStatus.
 */
export function getV3PaymentBadge(paymentState?: string): V3PaymentStateBadge {
  switch (paymentState) {
    case "paid":
      return { label: "Pagado", tone: "success" };
    case "failed":
    case "cancelled":
      return { label: "Cancelado/Fallido", tone: "critical" };
    case "refunded":
      return { label: "Reembolsado", tone: "neutral" };
    case "pending":
    default:
      return { label: "Pendiente de Pago", tone: "warning" };
  }
}

/**
 * Calculates count of active/pending orders per delivery date key (YYYY-MM-DD).
 * Excludes cancelled and delivered orders from active counts.
 */
export function getActiveOrderCountsByDate(orders: MinimalOrderForV3[]): Record<string, number> {
  const counts: Record<string, number> = {};
  orders.forEach((order) => {
    if (order.status === "delivered" || order.status === "cancelled") {
      return;
    }
    const dateKey = getOrderDeliveryDateKey(order);
    counts[dateKey] = (counts[dateKey] ?? 0) + 1;
  });
  return counts;
}
