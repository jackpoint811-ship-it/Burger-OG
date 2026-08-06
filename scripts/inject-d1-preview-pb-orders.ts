import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCHEDULED_DATE = '2026-08-10';
const CREATED_AT = '2026-08-06T14:35:00.000Z';

const orders = [
  {
    id: 'ord_pb_c0001',
    folio: 'PB-C0001',
    customer_name: 'Carlos Mendoza',
    customer_phone: '5512345671',
    order_mode: 'pickup',
    payment_method: 'cash',
    payment_status: 'paid',
    notes: 'Piso 4, Depto 402',
    subtotal_cents: 14900,
    total_cents: 14900,
    items: [
      {
        id: 'oi_pb_c0001_1',
        sku: 'OG',
        name: 'Burger OG',
        qty: 1,
        unit_price_cents: 14900,
        line_total_cents: 14900,
        snapshot: {
          lineKey: 'line-pb-c0001-1',
          itemKind: 'burger',
          removedIngredients: [],
          extras: [],
          garnish: null,
          includedDrink: null,
          sideQuestExtras: [],
          comboBurgers: [],
          delivery: {
            location: 'Torre GGA',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Piso 4, Depto 402',
          },
        },
      },
    ],
  },
  {
    id: 'ord_pb_c0002',
    folio: 'PB-C0002',
    customer_name: 'Ana Paola Ramírez',
    customer_phone: '5523456782',
    order_mode: 'delivery',
    payment_method: 'transfer',
    payment_status: 'paid',
    notes: 'Oficina 301. Dejar en recepción si no contesto.',
    subtotal_cents: 14900,
    total_cents: 14900,
    items: [
      {
        id: 'oi_pb_c0002_1',
        sku: 'OG',
        name: 'Burger OG',
        qty: 1,
        unit_price_cents: 14900,
        line_total_cents: 14900,
        snapshot: {
          lineKey: 'line-pb-c0002-1',
          itemKind: 'burger',
          removedIngredients: ['Pepinillos', 'Tomate'],
          extras: [],
          garnish: null,
          includedDrink: null,
          sideQuestExtras: [],
          comboBurgers: [],
          delivery: {
            location: 'Torre Valcob',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Oficina 301. Dejar en recepción si no contesto.',
          },
        },
      },
    ],
  },
  {
    id: 'ord_pb_c0003',
    folio: 'PB-C0003',
    customer_name: 'Roberto Gómez',
    customer_phone: '5534567893',
    order_mode: 'pickup',
    payment_method: 'card',
    payment_status: 'paid',
    notes: 'Mezzanine, llamar al llegar al elevador.',
    subtotal_cents: 21300,
    total_cents: 21300,
    items: [
      {
        id: 'oi_pb_c0003_1',
        sku: 'BBQ',
        name: 'Burger BBQ',
        qty: 1,
        unit_price_cents: 15900,
        line_total_cents: 21300,
        snapshot: {
          lineKey: 'line-pb-c0003-1',
          itemKind: 'burger',
          removedIngredients: [],
          extras: [
            { sku: 'EXTRA_TOCINO', name: 'Tocino', price: 29 },
            { sku: 'EXTRA_QUESO_MANCHEGO', name: 'Queso manchego', price: 25 },
          ],
          garnish: null,
          includedDrink: null,
          sideQuestExtras: [],
          comboBurgers: [],
          delivery: {
            location: 'Torre GGA',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Mezzanine, llamar al llegar al elevador.',
          },
        },
      },
    ],
  },
  {
    id: 'ord_pb_c0004',
    folio: 'PB-C0004',
    customer_name: 'Valeria Villalobos',
    customer_phone: '5545678904',
    order_mode: 'delivery',
    payment_method: 'transfer',
    payment_status: 'paid',
    notes: 'Penthouse 12. Tocar timbre 2 veces.',
    subtotal_cents: 17800,
    total_cents: 17800,
    items: [
      {
        id: 'oi_pb_c0004_1',
        sku: 'OG',
        name: 'Burger OG',
        qty: 1,
        unit_price_cents: 14900,
        line_total_cents: 17800,
        snapshot: {
          lineKey: 'line-pb-c0004-1',
          itemKind: 'burger',
          removedIngredients: ['Catsup'],
          extras: [{ sku: 'EXTRA_TOCINO', name: 'Tocino', price: 29 }],
          burgerNote: 'Término 3/4, carne bien sellada',
          garnish: null,
          includedDrink: null,
          sideQuestExtras: [],
          comboBurgers: [],
          delivery: {
            location: 'Torre Valcob',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Penthouse 12. Tocar timbre 2 veces.',
          },
        },
      },
    ],
  },
  {
    id: 'ord_pb_c0005',
    folio: 'PB-C0005',
    customer_name: 'Fernando Castillo',
    customer_phone: '5556789015',
    order_mode: 'pickup',
    payment_method: 'cash',
    payment_status: 'paid',
    notes: 'Piso 8, área de cubículos.',
    subtotal_cents: 20800,
    total_cents: 20800,
    items: [
      {
        id: 'oi_pb_c0005_1',
        sku: '0001',
        name: 'OG Full Loaded',
        qty: 1,
        unit_price_cents: 20800,
        line_total_cents: 20800,
        snapshot: {
          lineKey: 'line-pb-c0005-1',
          itemKind: 'combo',
          removedIngredients: [],
          extras: [],
          garnish: { sku: 'PAPAS_OG', name: 'Papas a la francesa OG', upcharge: 0 },
          includedDrink: null,
          sideQuestExtras: [],
          comboBurgers: [
            { sku: 'OG', name: 'Burger OG', removedIngredients: [], extras: [] },
          ],
          delivery: {
            location: 'Torre GGA',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Piso 8, área de cubículos.',
          },
        },
      },
    ],
  },
  {
    id: 'ord_pb_c0006',
    folio: 'PB-C0006',
    customer_name: 'Gabriela Sotomayor',
    customer_phone: '5567890126',
    order_mode: 'delivery',
    payment_method: 'card',
    payment_status: 'paid',
    notes: 'Recepción Piso 2.',
    subtotal_cents: 25300,
    total_cents: 25300,
    items: [
      {
        id: 'oi_pb_c0006_1',
        sku: 'COMBO-BBQ',
        name: 'Combo BBQ',
        qty: 1,
        unit_price_cents: 20800,
        line_total_cents: 25300,
        snapshot: {
          lineKey: 'line-pb-c0006-1',
          itemKind: 'combo',
          removedIngredients: [],
          extras: [],
          garnish: { sku: 'AROS_CEBOLLA', name: 'Aros de Cebolla Extra', upcharge: 25 },
          includedDrink: null,
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
          delivery: {
            location: 'Torre Valcob',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Recepción Piso 2.',
          },
        },
      },
    ],
  },
  {
    id: 'ord_pb_c0007',
    folio: 'PB-C0007',
    customer_name: 'Diego Armando Martínez',
    customer_phone: '5578901237',
    order_mode: 'delivery',
    payment_method: 'transfer',
    payment_status: 'paid',
    notes: 'Piso 10, Sala de Juntas A. Requiero servilletas y cubiertos extra.',
    subtotal_cents: 65100,
    total_cents: 65100,
    items: [
      {
        id: 'oi_pb_c0007_1',
        sku: 'OG',
        name: 'Burger OG',
        qty: 2,
        unit_price_cents: 14900,
        line_total_cents: 35600,
        snapshot: {
          lineKey: 'line-pb-c0007-1',
          itemKind: 'burger',
          removedIngredients: [],
          extras: [{ sku: 'EXTRA_TOCINO', name: 'Tocino', price: 29 }],
          sideQuestExtras: [],
          comboBurgers: [],
          delivery: {
            location: 'Torre GGA',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Piso 10, Sala de Juntas A. Requiero servilletas y cubiertos extra.',
          },
        },
      },
      {
        id: 'oi_pb_c0007_2',
        sku: 'PAPAS_OG',
        name: 'Papas a la francesa OG',
        qty: 1,
        unit_price_cents: 5900,
        line_total_cents: 5900,
        snapshot: {
          lineKey: 'line-pb-c0007-2',
          itemKind: 'garnish',
          removedIngredients: [],
          extras: [],
          sideQuestExtras: [],
          comboBurgers: [],
          delivery: {
            location: 'Torre GGA',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Piso 10, Sala de Juntas A.',
          },
        },
      },
      {
        id: 'oi_pb_c0007_3',
        sku: 'EXTRA_TOCINO',
        name: 'Tocino',
        qty: 1,
        unit_price_cents: 2800,
        line_total_cents: 2800,
        snapshot: {
          lineKey: 'line-pb-c0007-3',
          itemKind: 'other',
          removedIngredients: [],
          extras: [],
          sideQuestExtras: [],
          comboBurgers: [],
          delivery: {
            location: 'Torre GGA',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Piso 10, Sala de Juntas A.',
          },
        },
      },
      {
        id: 'oi_pb_c0007_4',
        sku: '0001',
        name: 'OG Full Loaded',
        qty: 1,
        unit_price_cents: 20800,
        line_total_cents: 20800,
        snapshot: {
          lineKey: 'line-pb-c0007-4',
          itemKind: 'combo',
          removedIngredients: [],
          extras: [],
          garnish: { sku: 'PAPAS_OG', name: 'Papas a la francesa OG', upcharge: 0 },
          sideQuestExtras: [],
          comboBurgers: [
            { sku: 'OG', name: 'Burger OG', removedIngredients: [], extras: [] },
          ],
          delivery: {
            location: 'Torre GGA',
            isScheduled: true,
            scheduledDate: SCHEDULED_DATE,
            customerNotes: 'Piso 10, Sala de Juntas A.',
          },
        },
      },
    ],
  },
];

function buildSqlStatements(): string {
  const sqlLines: string[] = ['PRAGMA foreign_keys = ON;'];

  for (const order of orders) {
    const escNotes = order.notes.replace(/'/g, "''");
    const escName = order.customer_name.replace(/'/g, "''");
    const firstItemDelivery = order.items[0]?.snapshot?.delivery;
    const escDeliveryJson = firstItemDelivery ? JSON.stringify(firstItemDelivery).replace(/'/g, "''") : null;
    const deliveryValueSql = escDeliveryJson ? `'${escDeliveryJson}'` : 'NULL';

    sqlLines.push(
      `INSERT OR REPLACE INTO orders_v2 (id, folio, idempotency_key, customer_name, customer_phone, delivery_json, order_mode, payment_method, payment_status, notes, subtotal_cents, total_cents, status, source, created_at, updated_at) VALUES ('${order.id}', '${order.folio}', 'idem-${order.folio.toLowerCase()}', '${escName}', '${order.customer_phone}', ${deliveryValueSql}, '${order.order_mode}', '${order.payment_method}', '${order.payment_status}', '${escNotes}', ${order.subtotal_cents}, ${order.total_cents}, 'preparing', 'public-v2-preview', '${CREATED_AT}', '${CREATED_AT}');`
    );

    for (const item of order.items) {
      const escItemName = item.name.replace(/'/g, "''");
      const snapshotStr = JSON.stringify(item.snapshot).replace(/'/g, "''");
      sqlLines.push(
        `INSERT OR REPLACE INTO order_items_v2 (id, order_id, sku, name, qty, unit_price_cents, line_total_cents, snapshot_json, created_at) VALUES ('${item.id}', '${order.id}', '${item.sku}', '${escItemName}', ${item.qty}, ${item.unit_price_cents}, ${item.line_total_cents}, '${snapshotStr}', '${CREATED_AT}');`
      );
    }
  }

  return sqlLines.join('\n');
}

function main() {
  const tempSqlFile = path.join(process.cwd(), 'scripts', 'temp_pb_orders.sql');
  const sql = buildSqlStatements();
  fs.writeFileSync(tempSqlFile, sql, 'utf8');

  console.log(`🚀 Ejecutando inserción directa en D1 Preview (burgers-exe-menu-v2-preview) para folios PB-C0001 a PB-C0007...`);
  try {
    const cmd = `npx wrangler d1 execute burgers-exe-menu-v2-preview --remote --file="${tempSqlFile}"`;
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log(output);
    console.log(`✅ Inserción completa en Cloudflare D1 Remote!`);
  } finally {
    if (fs.existsSync(tempSqlFile)) {
      fs.unlinkSync(tempSqlFile);
    }
  }
}

main();
