import type { CreateOrderV2Payload } from '../packages/config/src/contracts';

const API_BASE_URL = process.env.API_URL || 'https://burgers-exe-public-v2-preview.pages.dev';
const ENDPOINT = `${API_BASE_URL}/api/orders-v2`;

const SCHEDULED_DATE = '2026-08-10';

const testOrders: Array<{ label: string; payload: CreateOrderV2Payload }> = [
  {
    label: 'Orden 1: Burger Individual OG Limpia',
    payload: {
      customer: { name: 'Carlos Mendoza', phone: '5512345671' },
      delivery: {
        location: 'Torre GGA',
        isScheduled: true,
        scheduledDate: SCHEDULED_DATE,
        customerNotes: 'Piso 4, Depto 402',
      },
      orderMode: 'pickup',
      paymentMethod: 'cash',
      notes: 'Piso 4, Depto 402',
      environment: 'preview',
      items: [
        {
          sku: 'OG',
          qty: 1,
          name: 'Burger OG',
          itemKind: 'burger',
          lineKey: 'line-ord1-og',
          removedIngredients: [],
          extras: [],
          sideQuestExtras: [],
          comboBurgers: [],
          modifiers: [],
          components: [],
        },
      ],
    },
  },
  {
    label: 'Orden 2: Burger OG con MODS (Sin Pepinillos, Sin Tomate)',
    payload: {
      customer: { name: 'Ana Paola Ramírez', phone: '5523456782' },
      delivery: {
        location: 'Torre Valcob',
        isScheduled: true,
        scheduledDate: SCHEDULED_DATE,
        customerNotes: 'Oficina 301. Dejar en recepción si no contesto.',
      },
      orderMode: 'delivery',
      paymentMethod: 'transfer',
      notes: 'Oficina 301. Dejar en recepción si no contesto.',
      environment: 'preview',
      items: [
        {
          sku: 'OG',
          qty: 1,
          name: 'Burger OG',
          itemKind: 'burger',
          lineKey: 'line-ord2-og-mods',
          removedIngredients: ['Pepinillos', 'Tomate'],
          extras: [],
          sideQuestExtras: [],
          comboBurgers: [],
          modifiers: [
            { type: 'remove', name: 'Pepinillos', priceCents: 0 },
            { type: 'remove', name: 'Tomate', priceCents: 0 },
          ],
          components: [],
        },
      ],
    },
  },
  {
    label: 'Orden 3: Burger BBQ con UPGRADES (Tocino, Queso Manchego)',
    payload: {
      customer: { name: 'Roberto Gómez', phone: '5534567893' },
      delivery: {
        location: 'Torre GGA',
        isScheduled: true,
        scheduledDate: SCHEDULED_DATE,
        customerNotes: 'Mezzanine, llamar al llegar al elevador.',
      },
      orderMode: 'pickup',
      paymentMethod: 'card',
      notes: 'Mezzanine, llamar al llegar al elevador.',
      environment: 'preview',
      items: [
        {
          sku: 'BBQ',
          qty: 1,
          name: 'Burger BBQ',
          itemKind: 'burger',
          lineKey: 'line-ord3-bbq-upgrades',
          removedIngredients: [],
          extras: [
            { sku: 'EXTRA_TOCINO', name: 'Tocino', price: 29 },
            { sku: 'EXTRA_QUESO_MANCHEGO', name: 'Queso manchego', price: 25 },
          ],
          sideQuestExtras: [],
          comboBurgers: [],
          modifiers: [
            { type: 'extra', code: 'EXTRA_TOCINO', name: 'Tocino', priceCents: 2900 },
            { type: 'extra', code: 'EXTRA_QUESO_MANCHEGO', name: 'Queso manchego', priceCents: 2500 },
          ],
          components: [],
        },
      ],
    },
  },
  {
    label: 'Orden 4: Burger OG Completa (MODS + UPGRADES + Nota de Cocina)',
    payload: {
      customer: { name: 'Valeria Villalobos', phone: '5545678904' },
      delivery: {
        location: 'Torre Valcob',
        isScheduled: true,
        scheduledDate: SCHEDULED_DATE,
        customerNotes: 'Penthouse 12. Tocar timbre 2 veces.',
      },
      orderMode: 'delivery',
      paymentMethod: 'transfer',
      notes: 'Penthouse 12. Tocar timbre 2 veces.',
      environment: 'preview',
      items: [
        {
          sku: 'OG',
          qty: 1,
          name: 'Burger OG',
          itemKind: 'burger',
          lineKey: 'line-ord4-og-full',
          removedIngredients: ['Catsup'],
          extras: [{ sku: 'EXTRA_TOCINO', name: 'Tocino', price: 29 }],
          burgerNote: 'Término 3/4, carne bien sellada',
          sideQuestExtras: [],
          comboBurgers: [],
          modifiers: [
            { type: 'remove', name: 'Catsup', priceCents: 0 },
            { type: 'extra', code: 'EXTRA_TOCINO', name: 'Tocino', priceCents: 2900 },
            { type: 'note', name: 'Término 3/4, carne bien sellada', priceCents: 0 },
          ],
          components: [],
        },
      ],
    },
  },
  {
    label: 'Orden 5: Combo OG Full Loaded Estándar',
    payload: {
      customer: { name: 'Fernando Castillo', phone: '5556789015' },
      delivery: {
        location: 'Torre GGA',
        isScheduled: true,
        scheduledDate: SCHEDULED_DATE,
        customerNotes: 'Piso 8, área de cubículos.',
      },
      orderMode: 'pickup',
      paymentMethod: 'cash',
      notes: 'Piso 8, área de cubículos.',
      environment: 'preview',
      items: [
        {
          sku: '0001',
          qty: 1,
          name: 'OG Full Loaded',
          itemKind: 'combo',
          lineKey: 'line-ord5-combo-0001',
          removedIngredients: [],
          extras: [],
          garnish: { sku: 'PAPAS_OG', name: 'Papas a la francesa OG', upcharge: 0 },
          sideQuestExtras: [],
          comboBurgers: [
            { sku: 'OG', name: 'Burger OG', removedIngredients: [], extras: [] },
          ],
          modifiers: [],
          components: [
            { kind: 'garnish', sku: 'PAPAS_OG', name: 'Papas a la francesa OG', upchargeCents: 0 },
          ],
        },
      ],
    },
  },
  {
    label: 'Orden 6: Combo BBQ Modificado (Burger BBQ Interna con MODS + Aros de Cebolla)',
    payload: {
      customer: { name: 'Gabriela Sotomayor', phone: '5567890126' },
      delivery: {
        location: 'Torre Valcob',
        isScheduled: true,
        scheduledDate: SCHEDULED_DATE,
        customerNotes: 'Recepción Piso 2.',
      },
      orderMode: 'delivery',
      paymentMethod: 'card',
      notes: 'Recepción Piso 2.',
      environment: 'preview',
      items: [
        {
          sku: 'COMBO-BBQ',
          qty: 1,
          name: 'Combo BBQ',
          itemKind: 'combo',
          lineKey: 'line-ord6-combo-bbq-mod',
          removedIngredients: [],
          extras: [],
          garnish: { sku: 'AROS_CEBOLLA', name: 'Aros de Cebolla', upcharge: 25 },
          sideQuestExtras: [],
          comboBurgers: [
            {
              sku: 'BBQ',
              name: 'Burger BBQ',
              removedIngredients: ['Mostaza'],
              extras: [{ sku: 'EXTRA_QUESO_AMERICANO', name: 'Queso americano', price: 20 }],
              burgerNote: 'Sin aderezo especial',
            },
          ],
          modifiers: [],
          components: [
            { kind: 'garnish', sku: 'AROS_CEBOLLA', name: 'Aros de Cebolla', upchargeCents: 2500 },
          ],
        },
      ],
    },
  },
  {
    label: 'Orden 7: Pedido Multi-Item Complejo (Combos + Burgers + Papas + Extras)',
    payload: {
      customer: { name: 'Diego Armando Martínez', phone: '5578901237' },
      delivery: {
        location: 'Torre GGA',
        isScheduled: true,
        scheduledDate: SCHEDULED_DATE,
        customerNotes: 'Piso 10, Sala de Juntas A. Requiero servilletas y cubiertos extra.',
      },
      orderMode: 'delivery',
      paymentMethod: 'transfer',
      notes: 'Piso 10, Sala de Juntas A. Requiero servilletas y cubiertos extra.',
      environment: 'preview',
      items: [
        {
          sku: 'OG',
          qty: 2,
          name: 'Burger OG',
          itemKind: 'burger',
          lineKey: 'line-ord7-og-2x',
          removedIngredients: [],
          extras: [{ sku: 'EXTRA_TOCINO', name: 'Tocino', price: 29 }],
          sideQuestExtras: [],
          comboBurgers: [],
          modifiers: [{ type: 'extra', code: 'EXTRA_TOCINO', name: 'Tocino', priceCents: 2900 }],
          components: [],
        },
        {
          sku: 'PAPAS_OG',
          qty: 1,
          name: 'Papas a la francesa OG',
          itemKind: 'garnish',
          lineKey: 'line-ord7-papas',
          removedIngredients: [],
          extras: [],
          sideQuestExtras: [],
          comboBurgers: [],
          modifiers: [],
          components: [],
        },
        {
          sku: 'EXTRA_TOCINO',
          qty: 1,
          name: 'Tocino',
          itemKind: 'other',
          lineKey: 'line-ord7-extra-tocino',
          removedIngredients: [],
          extras: [],
          sideQuestExtras: [],
          comboBurgers: [],
          modifiers: [],
          components: [],
        },
        {
          sku: '0001',
          qty: 1,
          name: 'OG Full Loaded',
          itemKind: 'combo',
          lineKey: 'line-ord7-combo-0001',
          removedIngredients: [],
          extras: [],
          garnish: { sku: 'PAPAS_OG', name: 'Papas a la francesa OG', upcharge: 0 },
          sideQuestExtras: [],
          comboBurgers: [
            { sku: 'OG', name: 'Burger OG', removedIngredients: [], extras: [] },
          ],
          modifiers: [],
          components: [
            { kind: 'garnish', sku: 'PAPAS_OG', name: 'Papas a la francesa OG', upchargeCents: 0 },
          ],
        },
      ],
    },
  },
];

async function main() {
  console.log(`🚀 Iniciando inyección de ${testOrders.length} pedidos estructurados para la fecha ${SCHEDULED_DATE}...`);
  console.log(`📍 Endpoint objetivo: ${ENDPOINT}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testOrders.length; i++) {
    const { label, payload } = testOrders[i];
    const idempotencyKey = `idem-day10-${Date.now()}-${i + 1}`;

    try {
      console.log(`[${i + 1}/${testOrders.length}] Enviando: ${label}...`);
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-BOG-Order-Environment': 'preview',
        },
        body: JSON.stringify({ ...payload, idempotencyKey }),
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { text };
      }

      if (response.ok && data.ok) {
        successCount++;
        console.log(`   ✅ Creado exitosamente! Folio: ${data.data?.order?.folio || 'N/A'} (ID: ${data.data?.order?.id || 'N/A'})`);
      } else {
        failCount++;
        console.error(`   ❌ Error ${response.status}:`, data.error?.message || data.error?.code || text);
      }
    } catch (error) {
      failCount++;
      console.error(`   ❌ Excepción al enviar:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Resultado Final de Inyección:`);
  console.log(`   - Éxitos: ${successCount}`);
  console.log(`   - Fallos: ${failCount}`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
