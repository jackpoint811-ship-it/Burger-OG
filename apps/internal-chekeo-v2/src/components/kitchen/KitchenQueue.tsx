import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card } from "@ui/index";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
} from "lucide-react";
import type {
  OrderStatus,
  OrderV2Environment,
} from "@config/index";
import { HorizontalDateCalendarFilter } from "../HorizontalDateCalendarFilter";
import { parseOrderCustomerDetails } from "../../lib/order-parser";
import {
  buildKitchenLocalSummary,
  buildKitchenProductionItems,
  buildKitchenOrderQueueSummary,
  extractKitchenLocation,
  getComboBurgerNotes,
  getKitchenBurgerBreakdowns,
  getKitchenItemActionKind,
  getKitchenItemImage,
  getKitchenItemKind,
  getKitchenItemLabel,
  stripLocationFromNotes,
} from "./kitchen-helpers";
import type {
  KitchenLocalSummary,
  KitchenOrder,
  KitchenOrdersRuntime,
  KitchenProductionItem,
  KitchenView,
  MoveKitchenOrderStatus,
  ToggleKitchenItemDone,
} from "./kitchen-types";
import { KitchenSummaryK } from "./KitchenSummaryK";

const formatIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const aggregateSummaryRows = <T extends { name: string; quantity: number }>(items: T[]): T[] => {
  const map = new Map<string, T>();
  for (const item of items) {
    const existing = map.get(item.name);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(item.name, { ...item });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
};

const terminalStatuses = new Set<OrderStatus>(["delivered", "cancelled"]);

const orderEnvironmentLabel: Record<OrderV2Environment, string> = {
  production: "Producción",
  preview: "Preview",
};

const kitchenViews: Array<{
  key: KitchenView;
  label: string;
}> = [
  { key: "preparacion", label: "Preparación" },
  { key: "sideQuest", label: "Side Quest" },
  { key: "summaryK", label: "Resumen K" },
];

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

/* ------------------------------------------------------------------ */
/*  Grouped order type for production line                            */
/* ------------------------------------------------------------------ */

type OrderGroup = {
  orderId: string;
  order: KitchenOrder;
  items: KitchenProductionItem[];
  allDone: boolean;
  pendingCount: number;
  doneCount: number;
  summaryLabel: string;
};

const buildOrderGroups = (items: KitchenProductionItem[]): OrderGroup[] => {
  const map = new Map<string, KitchenProductionItem[]>();
  for (const item of items) {
    const existing = map.get(item.order.id);
    if (existing) existing.push(item);
    else map.set(item.order.id, [item]);
  }
  return [...map.entries()].map(([orderId, orderItems]) => {
    const pendingCount = orderItems.filter((i) => !i.done).length;
    const doneCount = orderItems.filter((i) => i.done).length;
    const summaryLabel = orderItems
      .map((i) => i.detailLabel || i.item.name)
      .join(" · ");
    return {
      orderId,
      order: orderItems[0]!.order,
      items: orderItems,
      allDone: pendingCount === 0,
      pendingCount,
      doneCount,
      summaryLabel,
    };
  });
};

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

const KitchenEmptyState = ({ title }: { title: string }) => (
  <Card className="border-dashed border-zinc-700/90 p-5 text-center">
    <p className="text-base font-black text-zinc-900 dark:text-zinc-100">{title}</p>
  </Card>
);

/* ------------------------------------------------------------------ */
/*  Item detail list (structured MOD and UPGRADE per burger)          */
/* ------------------------------------------------------------------ */

const ItemDetailList = ({ item }: { item: KitchenProductionItem }) => {
  const isPrep = item.lane === "prep";

  // BURGER block (Combo burgers)
  const comboNotes = isPrep ? getComboBurgerNotes(item.item) : [];

  // Note block — unified, shown as NOTA DEL PEDIDO
  const generalNote = stripLocationFromNotes(item.order.note);
  const itemNote = isPrep ? item.item.burgerNote : null;
  const noteText = [itemNote, generalNote].filter(Boolean).join(" · ");

  // Side Quest source indicator (De combo / Individual)
  const sideQuestSource: string | null = !isPrep
    ? item.item.parentItemName
      ? `De combo ${item.item.parentItemName}`
      : item.detailLabel?.includes("De combo")
        ? item.detailLabel.substring(item.detailLabel.indexOf("De combo"))
        : "Individual"
    : null;

  const breakdowns = isPrep ? getKitchenBurgerBreakdowns(item.item) : [];

  return (
    <div className="kitchen-item-details space-y-2">
      {comboNotes.length ? (
        <div className="kitchen-detail-block kitchen-detail-block--burger">
          <p className="kitchen-detail-label">Burgers del combo</p>
          <div className="mt-2 grid gap-2">
            {comboNotes.map((note: string) => (
              <span key={note} className="kitchen-note-chip kitchen-note-chip--combo">
                {note}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {isPrep && breakdowns.length ? (
        <div className="space-y-3 mt-2">
          {breakdowns.map((b, idx) => (
            <div key={`${b.burgerName}-${idx}`} className="kitchen-detail-block border-t border-zinc-800/40 pt-2 first:border-0 first:pt-0">
              {breakdowns.length > 1 ? (
                <p className="text-xs font-black uppercase text-lime-400 mb-1">
                  🍔 {b.burgerName}
                </p>
              ) : null}

              {!b.isOriginal ? (
                <div className="kitchen-detail-block--mod-upgrade grid gap-3 grid-cols-2">
                  <div className="kitchen-detail-block h-full">
                    <p className="kitchen-detail-label text-rose-400">MOD</p>
                    {b.mods.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {b.mods.map((mod) => (
                          <span key={mod} className="kitchen-note-chip kitchen-note-chip--mod">
                            {mod}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs text-zinc-500 italic">—</p>
                    )}
                  </div>
                  <div className="kitchen-detail-block h-full">
                    <p className="kitchen-detail-label text-lime-300">UPGRADE</p>
                    {b.upgrades.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {b.upgrades.map((up) => (
                          <span key={up} className="kitchen-note-chip kitchen-note-chip--upgrade">
                            {up}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs text-zinc-500 italic">—</p>
                    )}
                  </div>
                </div>
              ) : !comboNotes.length ? (
                <p className="kitchen-no-changes">Burger original · Sin cambios</p>
              ) : null}

              {b.note && !comboNotes.length ? (
                <p className="mt-1 text-xs text-amber-300 italic">Nota burger: {b.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {sideQuestSource ? (
        <div className="mt-2">
          <span className="kitchen-note-chip text-xs">{sideQuestSource}</span>
        </div>
      ) : null}

      {noteText ? (
        <div className="kitchen-order-note mt-3">
          <p className="kitchen-order-note__label">NOTA DEL PEDIDO</p>
          <p className="kitchen-order-note__text">{noteText}</p>
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Accordion item row within an order                                */
/* ------------------------------------------------------------------ */

const AccordionItemRow = ({
  entry,
  busy,
  expanded,
  glowing,
  onExpand,
  onToggle,
}: {
  entry: KitchenProductionItem;
  busy: boolean;
  expanded: boolean;
  glowing: boolean;
  onExpand: () => void;
  onToggle: (entry: KitchenProductionItem, done: boolean) => void;
}) => {
  const itemImage = getKitchenItemImage(entry.item.parentItemName || entry.item.name);
  return (
  <div
    className={`kitchen-accordion-item ${entry.done ? "kitchen-accordion-item--done" : ""} ${expanded ? "kitchen-accordion-item--open" : ""} ${glowing ? "kitchen-accordion-item--glow" : ""}`}
  >
    <button
      type="button"
      className="kitchen-accordion-item__header kitchen-production-card__item flex items-center gap-3"
      aria-expanded={expanded}
      onClick={onExpand}
    >
      {itemImage ? (
        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-800">
          <img src={itemImage} alt={entry.detailLabel || entry.item.name} className="w-full h-full object-cover opacity-90" loading="lazy" />
        </div>
      ) : null}
      <div className="flex-1 min-w-0 flex flex-col items-start">
        <span className="kitchen-item-kind">
          {entry.itemLabel || getKitchenItemLabel(entry.item)}
        </span>
        <h3 className="break-words text-base font-black text-zinc-50 text-left">
          {entry.detailLabel || entry.item.name}
        </h3>
      </div>
      <span
        className={
          entry.done ? "kitchen-dot kitchen-dot--done" : "kitchen-dot"
        }
      >
        {entry.done ? "Hecha" : "Por hacer"}
      </span>
    </button>

    {expanded ? (
      <>
        <ItemDetailList item={entry} />

        {!entry.item.lineKey ? (
          <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-100">
            No se puede marcar este item todavía. Revisa el detalle del pedido.
          </p>
        ) : null}

        <div className="kitchen-accordion-item__actions">
          {entry.done ? (
            <Button
              className="kitchen-item-action kitchen-item-action--done"
              disabled={busy || !entry.item.lineKey}
              onClick={() => onToggle(entry, false)}
            >
              Revertir hecha
            </Button>
          ) : (
            <Button
              className="kitchen-item-action"
              disabled={busy || !entry.item.lineKey}
              onClick={() => onToggle(entry, true)}
            >
              <>
                <CheckCircle2 size={16} aria-hidden="true" /> Hecha
              </>
            </Button>
          )}
        </div>
      </>
    ) : null}
  </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Category progress breakdown helper                                */
/* ------------------------------------------------------------------ */

const buildCategoryProgressBadge = (order: KitchenOrder) => {
  let totalBurgers = 0;
  let doneBurgers = 0;
  let totalSides = 0;
  let doneSides = 0;
  let totalDrinks = 0;
  let doneDrinks = 0;

  for (const item of order.items) {
    const kind = getKitchenItemKind(item);
    const isItemDone = Boolean(item.kitchenDone);

    if (kind === "burger") {
      const qty = item.qty || 1;
      totalBurgers += qty;
      if (isItemDone) doneBurgers += qty;
    } else if (kind === "combo") {
      const comboBurgerCount = item.comboBurgers && item.comboBurgers.length > 0 ? item.comboBurgers.length : 1;
      const qty = item.qty || 1;
      totalBurgers += comboBurgerCount * qty;
      if (isItemDone) doneBurgers += comboBurgerCount * qty;

      if (item.garnish) {
        totalSides += qty;
        if (isItemDone) doneSides += qty;
      }
      if (item.includedDrink) {
        totalDrinks += qty;
        if (isItemDone) doneDrinks += qty;
      }
    } else if (kind === "garnish") {
      const qty = item.qty || 1;
      totalSides += qty;
      if (isItemDone) doneSides += qty;
    } else if (kind === "drink") {
      const qty = item.qty || 1;
      totalDrinks += qty;
      if (isItemDone) doneDrinks += qty;
    }

    if (item.sideQuestExtras && item.sideQuestExtras.length > 0) {
      for (const extra of item.sideQuestExtras) {
        const qty = item.qty || 1;
        if (extra.itemKind === "garnish") {
          totalSides += qty;
          if (isItemDone) doneSides += qty;
        } else if (extra.itemKind === "drink") {
          totalDrinks += qty;
          if (isItemDone) doneDrinks += qty;
        } else {
          totalSides += qty;
          if (isItemDone) doneSides += qty;
        }
      }
    }
  }

  const parts: string[] = [];
  if (totalBurgers > 0) parts.push(`🍔 ${doneBurgers}/${totalBurgers} Burgers`);
  if (totalSides > 0) parts.push(`🍟 ${doneSides}/${totalSides} Side${totalSides !== 1 ? 's' : ''}`);
  if (totalDrinks > 0) parts.push(`🥤 ${doneDrinks}/${totalDrinks} Bebida${totalDrinks !== 1 ? 's' : ''}`);

  return parts.join(" · ");
};

/* ------------------------------------------------------------------ */
/*  Active order container                                            */
/* ------------------------------------------------------------------ */

const ActiveOrderContainer = ({
  group,
  busyLineKey,
  onToggle,
}: {
  group: OrderGroup;
  busyLineKey: string | null;
  onToggle: (entry: KitchenProductionItem, done: boolean) => void;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [glowingId, setGlowingId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedId(
      group.items.find((entry) => !entry.done)?.id ?? group.items[0]?.id ?? ""
    );
  }, [group.orderId]);

  const handleToggle = (entry: KitchenProductionItem, done: boolean) => {
    onToggle(entry, done);
    if (done) {
      const nextPending = group.items.find(i => i.id !== entry.id && !i.done);
      if (nextPending) setExpandedId(nextPending.id);
    } else {
      setExpandedId(entry.id);
      setGlowingId(entry.id);
      setTimeout(() => setGlowingId(null), 800);
    }
  };

  const createdAtIso = group.order.createdAtIso || (group.order.createdAtMs ? new Date(group.order.createdAtMs).toISOString() : undefined);
  const details = parseOrderCustomerDetails(group.order.customer, group.order.note, createdAtIso, group.order.delivery);
  const location = details.deliveryLocation || extractKitchenLocation(group.order.note);
  const categoryProgress = buildCategoryProgressBadge(group.order);
  const quickSummary = buildKitchenOrderQueueSummary(group.order);

  return (
    <section className="kitchen-active-order kitchen-production-card" aria-label="Orden activa">
      <div className="kitchen-active-order__header flex-col md:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400 m-0">Pedido Activo</p>
            {categoryProgress ? (
              <span className="text-xs font-black bg-lime-400/20 text-lime-300 px-2 py-0.5 rounded tracking-[0.05em]">
                {categoryProgress}
              </span>
            ) : (
              <span className="text-[10px] font-black bg-lime-400/20 text-lime-300 px-1.5 py-0.5 rounded uppercase tracking-[0.1em]">
                {group.doneCount}/{group.items.length}
              </span>
            )}
          </div>
          <h3 className="kitchen-active-order__customer">
            {details.cleanCustomerName}
          </h3>
          {quickSummary ? (
            <p className="mt-1 mb-2 text-sm font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-800/50 inline-block px-2 py-1 rounded-md">
              {quickSummary}
            </p>
          ) : null}
          <p className="kitchen-active-order__folio kitchen-production-card__folio">{group.order.folio}</p>
        </div>
        <div className="flex flex-wrap md:justify-end gap-1.5 self-start w-full md:w-auto mt-2 md:mt-0 items-center">
          <span className="kitchen-location-chip">
            <MapPin size={14} aria-hidden="true" />
            {location}
          </span>
        </div>
      </div>

      <div className="kitchen-active-order__items">
        {group.items.length === 1 ? (
          <AccordionItemRow
            entry={group.items[0]!}
            busy={busyLineKey === group.items[0]!.lineKey}
            expanded={expandedId === group.items[0]!.id}
            glowing={glowingId === group.items[0]!.id}
            onExpand={() => setExpandedId(group.items[0]!.id)}
            onToggle={handleToggle}
          />
        ) : (
          group.items.map((entry) => (
            <AccordionItemRow
              key={entry.id}
              entry={entry}
              busy={busyLineKey === entry.lineKey}
              expanded={expandedId === entry.id}
              glowing={glowingId === entry.id}
              onExpand={() => setExpandedId(entry.id)}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>
    </section>
  );
};

const PendingOrdersQueue = ({
  groups,
  onSelect,
  laneMode,
}: {
  groups: OrderGroup[];
  onSelect: (orderId: string) => void;
  laneMode: "prep" | "sideQuest";
}) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? groups : groups.slice(0, 4);

  if (!groups.length) return null;

  const isSideQuest = laneMode === "sideQuest";

  return (
    <section className="kitchen-following-orders mt-4">
      {expanded ? (
        <button
          type="button"
          className="kitchen-following-orders__toggle w-full flex items-center justify-between px-4 py-3 text-left font-black text-cyan-400 hover:bg-zinc-100 dark:bg-zinc-800/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 transition-colors"
          onClick={() => setExpanded(false)}
          aria-expanded={true}
        >
          <span className="text-[11px] tracking-[0.2em] uppercase">
            Cola de pedidos ({groups.length})
          </span>
          <ChevronUp size={16} />
        </button>
      ) : null}

      {expanded ? (
        <div className="kitchen-following-orders__list border-t border-zinc-800/40 p-3 space-y-3">
          {groups.map((group) => {
            const shortSummary = isSideQuest
              ? buildKitchenOrderQueueSummary(group.order)
              : null;
            return (
              <div key={group.orderId} className="kitchen-production-card bg-white dark:bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-zinc-900 dark:text-zinc-100 text-lg">{group.order.customer}</p>
                    {shortSummary ? (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{shortSummary}</p>
                    ) : null}
                  </div>
                  <Button
                    className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs px-3 py-1.5 h-auto min-h-0 whitespace-nowrap"
                    onClick={() => onSelect(group.orderId)}
                  >
                    Abrir
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="kitchen-following-orders__list p-3 grid gap-2 cursor-pointer hover:bg-zinc-50 dark:bg-zinc-900/20"
          onClick={() => setExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded(true);
            }
          }}
        >
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-cyan-400">
              Cola de pedidos ({groups.length})
            </span>
            <ChevronDown size={16} className="text-cyan-400" />
          </div>
          {visible.map((group, idx) => {
            const isFirst = idx === 0;
            const opacityValue = isFirst ? 1 : idx === 1 ? 0.75 : idx === 2 ? 0.55 : 0.4;
            const shortSummary = isSideQuest
              ? buildKitchenOrderQueueSummary(group.order)
              : null;
            return (
              <div
                key={group.orderId}
                className={`kitchen-production-card flex justify-between items-center px-3 py-2.5 rounded-lg border transition-all ${
                  isFirst ? "border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20" : "border-zinc-800/40 bg-white dark:bg-zinc-950/20"
                }`}
                style={{ opacity: opacityValue }}
              >
                <div className="text-left min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-[0.16em] mb-0.5 ${isFirst ? "text-cyan-800 dark:text-cyan-300" : "text-zinc-500"}`}>
                    {isFirst ? "Siguiente" : "Después"}
                  </p>
                  <p className={`font-black ${isFirst ? "text-zinc-900 dark:text-zinc-100 text-base" : "text-zinc-700 dark:text-zinc-300 text-sm"}`}>
                    {group.order.customer}
                  </p>
                  {shortSummary ? (
                    <p className="truncate text-xs text-zinc-500 mt-0.5">{shortSummary}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
          {groups.length > 4 ? (
            <p className="text-center text-[10px] font-black tracking-[0.2em] uppercase text-zinc-600 mt-2">
              +{groups.length - 4} pedidos más
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Done list (compact, collapsed at bottom)                          */
/* ------------------------------------------------------------------ */

const DoneOrdersList = ({
  groups,
  label,
  busyLineKey,
  onToggle,
}: {
  groups: OrderGroup[];
  label: string;
  busyLineKey: string | null;
  onToggle: (entry: KitchenProductionItem, done: boolean) => void;
}) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!groups.length) return null;

  const foliosLabel = groups.map((g) => g.order.folio).join(", ");

  return (
    <section className="kitchen-done-list">
      <button
        type="button"
        className="kitchen-done-list__toggle flex flex-col items-start gap-1 p-3 w-full border-t border-zinc-800/40 hover:bg-zinc-100 dark:bg-zinc-800/20 transition-colors mt-4"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-[11px] font-black tracking-[0.2em] uppercase text-zinc-700 dark:text-zinc-300">
            {label} · {groups.length} {groups.length === 1 ? "pedido" : "pedidos"}
          </span>
          {expanded ? <ChevronUp size={16} className="text-zinc-600 dark:text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-600 dark:text-zinc-400" />}
        </div>
        {!expanded ? (
          <span className="text-xs text-zinc-500">Toca para revisar o revertir</span>
        ) : null}
      </button>
      {expanded ? (
        <div className="kitchen-done-list__items">
          {groups.map((group) => {
            const isGroupExpanded = expandedGroupId === group.orderId;
            return (
              <div key={group.orderId} className="kitchen-done-list__item border-b border-zinc-800/30 pb-3 last:border-0 last:pb-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300"
                  onClick={() => {
                    setExpandedGroupId(isGroupExpanded ? null : group.orderId);
                    setExpandedItemId(null);
                  }}
                  aria-expanded={isGroupExpanded}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-zinc-900 dark:text-zinc-100">{group.order.customer}</p>
                      <span className="kitchen-dot kitchen-dot--done">Hecha</span>
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-500">{group.order.folio}</p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 font-bold">{buildKitchenOrderQueueSummary(group.order)}</p>
                  </div>
                  {isGroupExpanded ? (
                    <ChevronUp size={16} className="text-zinc-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" />
                  )}
                </button>

                {isGroupExpanded ? (
                  <div className="mt-3 space-y-2.5 pl-2 border-l border-zinc-800/80">
                    {group.items.map((entry) => (
                      <AccordionItemRow
                        key={entry.id}
                        entry={entry}
                        busy={busyLineKey === entry.lineKey}
                        expanded={expandedItemId === entry.id}
                        glowing={false}
                        onExpand={() => setExpandedItemId(expandedItemId === entry.id ? null : entry.id)}
                        onToggle={onToggle}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Production lane panel (shared by Preparación & Side Quest)        */
/* ------------------------------------------------------------------ */

const ProductionLanePanel = ({
  laneItems,
  laneName,
  laneDescription,
  laneAccent,
  busyLineKey,
  laneMode,
  onToggle,
}: {
  laneItems: KitchenProductionItem[];
  laneName: string;
  laneDescription: string;
  laneAccent: string;
  busyLineKey: string | null;
  laneMode: "prep" | "sideQuest";
  onToggle: (entry: KitchenProductionItem, done: boolean) => void;
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const orderGroups = useMemo(() => buildOrderGroups(laneItems), [laneItems]);
  const pendingGroups = useMemo(
    () => orderGroups.filter((g) => !g.allDone),
    [orderGroups],
  );
  const doneGroups = useMemo(
    () => orderGroups.filter((g) => g.allDone),
    [orderGroups],
  );

  const activeGroup = useMemo(() => {
    if (selectedOrderId) {
      const found = pendingGroups.find((g) => g.orderId === selectedOrderId);
      if (found) return found;
    }
    return pendingGroups[0] ?? null;
  }, [pendingGroups, selectedOrderId]);

  const otherPendingGroups = useMemo(() => {
    if (!activeGroup) return pendingGroups;
    return pendingGroups.filter((g) => g.orderId !== activeGroup.orderId);
  }, [pendingGroups, activeGroup]);

  if (!orderGroups.length) {
    return <KitchenEmptyState title={`Sin items en ${laneName}.`} />;
  }

  return (
    <section className="kitchen-lane space-y-4">
      {/* Section header */}
      <div className="kitchen-section__header">
        <div>
          <p
            className={`text-xs font-black uppercase tracking-[0.18em] ${laneAccent}`}
          >
            {laneName}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{laneDescription}</p>
        </div>
        <span className="kitchen-note-chip">
          {pendingGroups.reduce((acc, g) => acc + g.pendingCount, 0)} pendientes
        </span>
      </div>

      {/* 1. Active order */}
      {activeGroup ? (
        <ActiveOrderContainer
          group={activeGroup}
          busyLineKey={busyLineKey}
          onToggle={onToggle}
        />
      ) : null}

      {/* 2. Unified Queue (Pending Orders) */}
      {otherPendingGroups.length ? (
        <PendingOrdersQueue
          groups={otherPendingGroups}
          onSelect={setSelectedOrderId}
          laneMode={laneMode}
        />
      ) : null}

      {/* 3. Done list */}
      <DoneOrdersList
        groups={doneGroups}
        label="Listas"
        busyLineKey={busyLineKey}
        onToggle={onToggle}
      />
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Main KitchenQueue component                                       */
/* ------------------------------------------------------------------ */

export const KitchenQueue = ({
  orders,
  runtime,
  onToggleKitchenItem,
  onMove,
}: {
  orders: KitchenOrder[];
  runtime: KitchenOrdersRuntime;
  onToggleKitchenItem: ToggleKitchenItemDone;
  onMove: MoveKitchenOrderStatus;
}) => {
  const [view, setView] = useState<KitchenView>("preparacion");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [busyLineKey, setBusyLineKey] = useState<string | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((order) => !terminalStatuses.has(order.status)),
    [orders],
  );

  const filteredActiveOrders = useMemo(() => {
    const todayStr = formatIsoDate(new Date());

    return activeOrders.filter((order) => {
      if (selectedDate === "all") return true;

      const createdAtIso = order.createdAtIso || (order.createdAtMs ? new Date(order.createdAtMs).toISOString() : undefined);
      const details = parseOrderCustomerDetails(order.customer, order.note, createdAtIso, order.delivery);
      let orderDateStr = todayStr;

      if (details.isScheduled && details.scheduledDeliveryDate) {
        orderDateStr = details.scheduledDeliveryDate;
      } else if (order.createdAtMs) {
        orderDateStr = formatIsoDate(new Date(order.createdAtMs));
      }

      if (selectedDate === "today") {
        return orderDateStr === todayStr;
      }
      if (selectedDate === "past") {
        return orderDateStr < todayStr;
      }
      return orderDateStr === selectedDate;
    });
  }, [activeOrders, selectedDate]);

  const productionItems = useMemo(
    () => buildKitchenProductionItems(filteredActiveOrders),
    [filteredActiveOrders],
  );
  const prepItems = useMemo(
    () => productionItems.filter((entry) => entry.lane === "prep"),
    [productionItems],
  );
  const sideQuestProductionItems = useMemo(
    () => productionItems.filter((entry) => entry.lane === "sideQuest"),
    [productionItems],
  );
  const localSummary = useMemo(
    () => buildKitchenLocalSummary(filteredActiveOrders),
    [filteredActiveOrders],
  );
  const fallback = runtime.source !== "d1";
  const kitchenTitle = fallback
    ? "Cocina en fallback"
    : runtime.environment === "preview"
      ? "Cocina conectada a preview"
      : "Cocina conectada a D1 real";
  const kitchenHint = fallback
    ? "Solo referencia visual. Reintenta antes de confirmar cambios como definitivos."
    : "Producción actual por item, ordenada por llegada.";

  const toggleKitchenItem = useCallback(
    async (entry: KitchenProductionItem, done: boolean) => {
      const targetLineKey = entry.item.lineKey || entry.lineKey;
      if (!targetLineKey) return;
      setBusyLineKey(targetLineKey);
      try {
        if (done && entry.order.status === "new") {
          await onMove(entry.order.id, "preparing", "Cocina: preparación actual");
        }
        if (!done && entry.order.status === "ready") {
          await onMove(entry.order.id, "preparing", "Cocina: revertir item a pendiente");
        }
        await onToggleKitchenItem(
          entry.order.id,
          targetLineKey,
          getKitchenItemActionKind(entry.item),
          done,
        );
        const orderItems = productionItems.filter(
          (item) => item.order.id === entry.order.id,
        );
        const allDoneAfter = orderItems.every((item) =>
          item.id === entry.id ? done : item.done,
        );
        if (
          done &&
          allDoneAfter &&
          (entry.order.status === "new" || entry.order.status === "preparing")
        ) {
          await onMove(entry.order.id, "ready", "Cocina: preparación completa");
        }
      } finally {
        setBusyLineKey(null);
      }
    },
    [onMove, onToggleKitchenItem, productionItems],
  );

  return (
    <section className="kitchen-production">
      <div className="kitchen-hero">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="home-section-label">Preparación</p>
            <h2 className="mt-1 text-2xl font-black text-zinc-50 md:text-3xl">
              Cocina
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
              {kitchenTitle}. {kitchenHint}
            </p>
          </div>
          <div className="kitchen-hero__actions">
            {runtime.lastUpdated ? (
              <span className="text-[11px] text-zinc-500">
                Actualizado: {runtime.lastUpdated}
              </span>
            ) : null}
            <Button
              className="kitchen-secondary-action"
              onClick={() => runtime.reload(false)}
              disabled={runtime.loading || !runtime.sessionActive}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {runtime.loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>
        <HorizontalDateCalendarFilter
          orders={activeOrders}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <div className="kitchen-view-tabs" role="tablist">
          {kitchenViews.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={view === option.key}
              aria-pressed={view === option.key}
              className={`kitchen-view-tab ${view === option.key ? "kitchen-view-tab--active" : ""}`}
              onClick={() => setView(option.key)}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {runtime.limitWarning ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100"
        >
          {runtime.limitWarning}
        </p>
      ) : null}
      {fallback ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100"
        >
          Fallback visual: estados de cocina no se guardan en D1.
        </p>
      ) : null}
      {runtime.error ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-100"
        >
          {runtime.error}
        </p>
      ) : null}

      {view === "preparacion" ? (
        <ProductionLanePanel
          laneItems={prepItems}
          laneName="Preparación"
          laneDescription="Hamburguesas individuales y burgers dentro de combos."
          laneAccent="text-lime-200"
          busyLineKey={busyLineKey}
          laneMode="prep"
          onToggle={toggleKitchenItem}
        />
      ) : null}

      {view === "sideQuest" ? (
        <ProductionLanePanel
          laneItems={sideQuestProductionItems}
          laneName="Side Quest"
          laneDescription="Papas, guarniciones, bebidas y extras no-burger."
          laneAccent="text-amber-200"
          busyLineKey={busyLineKey}
          laneMode="sideQuest"
          onToggle={toggleKitchenItem}
        />
      ) : null}

      {view === "summaryK" ? (
        <KitchenSummaryK
          environment={runtime.environment}
          localSummary={localSummary}
        />
      ) : null}
    </section>
  );
};
