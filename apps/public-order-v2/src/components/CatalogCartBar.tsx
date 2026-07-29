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
        bottom: "12px",
        left: "12px",
        right: "12px",
        maxWidth: "430px",
        margin: "0 auto",
        zIndex: 40,
        backgroundColor: "var(--color-accent, #16A34A)",
        color: "#FFFFFF",
        borderRadius: "9999px",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 8px 28px rgba(22, 163, 74, 0.35)",
        cursor: "pointer",
        boxSizing: "border-box",
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
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            color: "var(--color-accent, #16A34A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "13px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
          aria-label={`${count} ${count === 1 ? "producto" : "productos"}`}
        >
          {count}
        </motion.div>
        <div>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              opacity: 0.9,
            }}
          >
            MI PEDIDO
          </span>
          <span
            style={{
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              color: "#FFFFFF",
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
          fontSize: "12px",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          textTransform: "uppercase",
          backgroundColor: "#FFFFFF",
          color: "var(--color-accent, #16A34A)",
          padding: "8px 16px",
          borderRadius: "9999px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
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
