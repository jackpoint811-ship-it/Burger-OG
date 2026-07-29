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
        backgroundColor: "#00FF66",
        color: "#000000",
        borderRadius: "16px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 8px 32px rgba(0, 255, 102, 0.35)",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
      onClick={onOpenCart}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#000000",
            color: "#00FF66",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: "14px",
          }}
          aria-label={`${count} ${count === 1 ? "producto" : "productos"}`}
        >
          {count}
        </div>
        <div>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
            }}
          >
            MI PEDIDO
          </span>
          <span
            style={{
              fontSize: "14px",
              fontFamily: "monospace",
              fontWeight: 900,
              color: "#000000",
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
          gap: "8px",
          fontSize: "12px",
          fontFamily: "monospace",
          fontWeight: 900,
          textTransform: "uppercase",
          backgroundColor: "#000000",
          color: "#00FF66",
          padding: "8px 16px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
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
