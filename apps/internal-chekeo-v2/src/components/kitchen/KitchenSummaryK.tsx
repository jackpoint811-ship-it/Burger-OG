import { useEffect, useState } from "react";
import { Button, Card } from "@ui/index";
import type {
  KitchenSummaryKResponse,
  OrderV2Environment,
} from "@config/index";
import { fetchKitchenSummaryK } from "../../lib/ingredients-v2-admin";
import type { KitchenLocalSummary } from "./kitchen-types";

type KitchenSummaryKData = NonNullable<KitchenSummaryKResponse["data"]>;

const orderEnvironmentLabel: Record<OrderV2Environment, string> = {
  production: "Producción",
  preview: "Preview",
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const aggregateSummaryRows = <T extends { name: string; quantity: number }>(
  items: T[],
): T[] => {
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

const SummaryMetric = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <Card className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
      {label}
    </p>
    <p className="mt-2 text-3xl font-black text-[var(--color-text-primary)]">
      {value}
    </p>
  </Card>
);

const KitchenEmptyState = ({ title }: { title: string }) => (
  <Card className="border-dashed border-[var(--color-line)] p-5 text-center bg-[var(--color-surface-raised)]">
    <p className="text-base font-black text-[var(--color-text-primary)]">{title}</p>
  </Card>
);

export const KitchenSummaryK = ({
  environment,
  localSummary,
}: {
  environment: OrderV2Environment;
  localSummary: KitchenLocalSummary;
}) => {
  const [summary, setSummary] = useState<KitchenSummaryKData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchKitchenSummaryK(environment));
    } catch {
      setError(
        "No se pudo cargar Resumen K. Cocina sigue funcionando normalmente.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [environment]);

  const burgerRows =
    summary?.hasRecipes && summary.burgers?.length
      ? aggregateSummaryRows(summary.burgers)
      : localSummary.burgersList;

  const garnishRows =
    summary?.hasRecipes && summary.garnishes?.length
      ? aggregateSummaryRows(summary.garnishes)
      : localSummary.garnishesList;

  const totalBurgers =
    summary?.hasRecipes && summary.totals?.burgers
      ? summary.totals.burgers
      : localSummary.burgers;

  const totalGarnishes =
    summary?.hasRecipes && summary.totals?.garnishes
      ? summary.totals.garnishes
      : localSummary.garnishes;

  const costText =
    summary?.totals?.estimatedCostCents == null
      ? "—"
      : formatCurrency(summary.totals.estimatedCostCents / 100);
  const estimatedProfitText =
    summary?.totals?.estimatedCostCents == null
      ? "—"
      : formatCurrency(
          localSummary.estimatedSales - summary.totals.estimatedCostCents / 100,
        );

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Total burgers" value={totalBurgers} />
        <SummaryMetric label="Total guarniciones" value={totalGarnishes} />
        <SummaryMetric
          label="Combos desglosados"
          value={localSummary.comboBurgers}
        />
        <SummaryMetric label="Side Quest" value={localSummary.sideQuests} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Por hacer" value={localSummary.pendingItems} />
        <SummaryMetric label="Hechas" value={localSummary.doneItems} />
        <SummaryMetric label="Extras" value={localSummary.extras} />
        <SummaryMetric
          label="Ventas visibles"
          value={formatCurrency(localSummary.estimatedSales)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryMetric label="Costo producción" value={costText} />
        <SummaryMetric label="Ganancia estimada" value={estimatedProfitText} />
        <SummaryMetric
          label="Insumos"
          value={summary?.totals?.ingredients ?? 0}
        />
      </div>

      {loading ? (
        <Card className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Cargando Resumen K...
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-sm font-bold text-rose-800 dark:text-rose-200">{error}</p>
          <Button
            className="mt-3 border border-rose-500/40 bg-[var(--color-surface)] text-rose-800 dark:text-rose-200"
            onClick={load}
          >
            Reintentar
          </Button>
        </Card>
      ) : null}

      {summary && !summary.hasRecipes ? (
        <Card className="border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
            Configura recetas aproximadas en Chekeo para desbloquear el cálculo
            de ingredientes.
          </p>
        </Card>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
                {orderEnvironmentLabel[environment]} · burgers
              </h3>
              <div className="mt-3 space-y-2">
                {burgerRows.length ? (
                  burgerRows.map((item) => (
                    <div
                      key={item.sku || item.name}
                      className="kitchen-summary-row"
                    >
                      <span>{item.name}</span>
                      <strong>{item.quantity}</strong>
                    </div>
                  ))
                ) : (
                  <KitchenEmptyState title="Sin burgers del día." />
                )}
              </div>
            </Card>
            <Card className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                {orderEnvironmentLabel[environment]} · guarniciones
              </h3>
              <div className="mt-3 space-y-2">
                {garnishRows.length ? (
                  garnishRows.map((item) => (
                    <div
                      key={item.sku || item.name}
                      className="kitchen-summary-row"
                    >
                      <span>{item.name}</span>
                      <strong>{item.quantity}</strong>
                    </div>
                  ))
                ) : (
                  <KitchenEmptyState title="Sin guarniciones del día." />
                )}
              </div>
            </Card>
          </div>
          <Card className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Ingredientes estimados
            </h3>
            <div className="mt-3 space-y-2">
              {summary.ingredients?.length ? (
                summary.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.ingredientId}
                    className="kitchen-ingredient-row"
                  >
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)]">
                        {ingredient.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Precio unitario:{" "}
                        {ingredient.unitPriceCents == null
                          ? "—"
                          : formatCurrency(ingredient.unitPriceCents / 100)}
                      </p>
                    </div>
                    <p className="font-black text-[var(--color-accent)]">
                      {ingredient.quantity.toFixed(2)} {ingredient.unit}
                    </p>
                    <p className="font-black text-emerald-700 dark:text-emerald-300">
                      {ingredient.estimatedCostCents == null
                        ? "—"
                        : formatCurrency(ingredient.estimatedCostCents / 100)}
                    </p>
                  </div>
                ))
              ) : !summary.hasRecipes ? (
                <KitchenEmptyState title="Ingredientes estimados no disponibles porque faltan recetas configuradas." />
              ) : (
                <KitchenEmptyState title="Sin ingredientes estimados." />
              )}
            </div>
          </Card>
        </>
      ) : null}
    </section>
  );
};
