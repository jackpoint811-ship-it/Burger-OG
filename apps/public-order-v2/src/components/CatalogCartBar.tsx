import { formatCurrency } from "../lib/order";
import { useCatalogCart } from "./CatalogCartContext";
import { motion, useReducedMotion } from "framer-motion";

type CatalogCartBarProps = {
  onOpenCart: () => void;
};

export function CatalogCartBar({ onOpenCart }: CatalogCartBarProps) {
  const { count, total } = useCatalogCart();
  const shouldReduceMotion = useReducedMotion();

  if (count === 0) return null;

  return (
    <motion.aside
      className="catalog-cart-bar"
      aria-label="Resumen del carrito"
      initial={shouldReduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "calc(var(--catalog-max-width, 768px) - 32px)",
        margin: "0 auto",
        zIndex: "var(--z-floating, 24)",
        backgroundColor: "var(--color-accent)",
        color: "var(--color-text-on-accent)",
        borderRadius: "var(--radius-pill)",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "var(--shadow-cta)",
        cursor: "pointer",
        minHeight: "var(--touch-target-min, 44px)",
      }}
      onClick={onOpenCart}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <motion.div
          key={count}
          initial={shouldReduceMotion ? false : { scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "var(--color-text-on-accent)",
            color: "var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "14px",
            boxShadow: "var(--shadow-card)",
          }}
          aria-label={`${count} ${count === 1 ? "producto" : "productos"}`}
        >
          {count}
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              opacity: 0.9,
              lineHeight: 1,
              marginBottom: "2px",
            }}
          >
            MI PEDIDO
          </span>
          <span
            style={{
              fontSize: "15px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          textTransform: "uppercase",
          backgroundColor: "var(--color-text-on-accent)",
          color: "var(--color-accent)",
          padding: "0 16px",
          borderRadius: "var(--radius-pill)",
          border: "none",
          cursor: "pointer",
          boxShadow: "var(--shadow-card)",
          minHeight: "36px", /* Botón interno un poco más pequeño visualmente pero... */
          margin: "4px 0",   /* ... con margen asegura que el contenedor principal alcance los 44px de target táctil */
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenCart();
        }}
        aria-haspopup="dialog"
      >
        <span>Checkout</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </motion.aside>
  );
}
