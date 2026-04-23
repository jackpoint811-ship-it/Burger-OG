/*********************************
 * BURGERS OG - CHEKEO
 * Versión simple:
 * - Sync Pedidos Master -> Chekeo
 * - App sin filtros
 * - Solo flujo LISTO
 *********************************/

const MASTER_SHEET = 'Pedidos Master';
const CHEKEO_SHEET = 'Chekeo';
const TIME_ZONE = 'America/Mexico_City';
const KITCHEN_STATUS = {
  PENDING: 'PENDIENTE',
  IN_PREP: 'EN PREP',
  READY: 'LISTO',
  DELIVERED: 'ENTREGADO',
  CANCELED: 'CANCELADO'
};

/**
 * Columnas de "Pedidos Master" base 0
 */
const MASTER = {
  timestamp: 0,            // A
  qtyOg: 1,                // B
  qtyBbq: 2,               // C
  specialFlag: 3,          // D
  exactOrderText: 4,       // E
  customOgFlag: 5,         // F
  customBbqFlag: 6,        // G
  ogText: 7,               // H
  bbqText: 8,              // I
  extraPickles: 9,         // J
  extraAmerican: 10,       // K
  extraManchego: 11,       // L
  extraBacon: 12,          // M
  extraKetchup: 13,        // N
  extraMustard: 14,        // O
  extraTomato: 15,         // P
  sideFriesOg: 16,         // Q
  sideFriesEspeciales: 17, // R
  sideFriesLemon: 18,      // S
  sideOnionRings: 19,      // T
  customerName: 20,        // U
  phone: 21,               // V
  paymentMethod: 22,       // W
  total: 23,               // X
  note: 24,                // Y
  confirmed: 25,           // Z
  paid: 26                 // AA
};

/**
 * Columnas de "Chekeo" base 0
 */
const CHEKEO = {
  id: 0,               // A
  masterRow: 1,        // B
  orderDateTime: 2,    // C
  orderDate: 3,        // D
  name: 4,             // E
  phone: 5,            // F
  qtyOg: 6,            // G
  qtyBbq: 7,           // H
  burgerSummary: 8,    // I
  exactOrderText: 9,   // J
  extras: 10,          // K
  sides: 11,           // L
  total: 12,           // M
  payment: 13,         // N
  confirmed: 14,       // O
  paid: 15,            // P
  kitchenStatus: 16,   // Q
  startTime: 17,       // R
  readyTime: 18,       // S
  updatedAt: 19,       // T
  specialCase: 20,     // U
  manualReview: 21     // V
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('M Tools')
    .addItem('Sync Chekeo', 'syncChekeoFromMaster')
    .addSeparator()
    .addItem('Open Chekeo App', 'showChekeoApp')
    .addItem('Diagnosticar permisos', 'diagnoseChekeoPermissions')
    .addSeparator()
    .addItem('Install 1-min trigger', 'installChekeoTrigger')
    .addItem('Remove sync triggers', 'removeChekeoTriggers')
    .addToUi();
}

function showChekeoApp() {
  const html = HtmlService.createHtmlOutputFromFile('burger')
    .setWidth(460)
    .setHeight(780);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Chekeo');
}

/**
 * Sync Pedidos Master -> Chekeo
 * Conserva:
 * - Estado Cocina
 * - Hora Inicio
 * - Hora Listo
 * - Última Actualización
 */
function syncChekeoFromMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(MASTER_SHEET);
  const chekeoSheet = ss.getSheetByName(CHEKEO_SHEET);

  if (!masterSheet) throw new Error(`No existe la hoja "${MASTER_SHEET}"`);
  if (!chekeoSheet) throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

  const masterLastRow = masterSheet.getLastRow();
  const masterLastCol = masterSheet.getLastColumn();

  if (masterLastRow < 2) {
    clearChekeoBody_(chekeoSheet);
    return;
  }

  const masterValues = masterSheet.getRange(2, 1, masterLastRow - 1, masterLastCol).getValues();

  const chekeoLastRow = chekeoSheet.getLastRow();
  const existingRows = chekeoLastRow >= 2
    ? chekeoSheet.getRange(2, 1, chekeoLastRow - 1, 22).getValues()
    : [];

  const existingById = buildExistingChekeoMap_(existingRows);
  const output = [];

  masterValues.forEach((row, i) => {
    const masterRowNumber = i + 2;
    const id = buildOrderId_(masterRowNumber);

    if (!row[MASTER.timestamp]) return;

    const specialCase = isSpecialCase_(row);
    const preserved = existingById[id] || {};

    const kitchenStatus = normalizeKitchenStatus_(preserved.kitchenStatus || KITCHEN_STATUS.PENDING);
    const startTime = preserved.startTime || '';
    const readyTime = preserved.readyTime || '';
    const updatedAt = preserved.updatedAt || '';

    const orderDateTime = normalizeDateValue_(row[MASTER.timestamp]);
    const orderDate = extractOnlyDate_(orderDateTime);

    const syncRow = new Array(22).fill('');

    syncRow[CHEKEO.id] = id;
    syncRow[CHEKEO.masterRow] = masterRowNumber;
    syncRow[CHEKEO.orderDateTime] = orderDateTime || '';
    syncRow[CHEKEO.orderDate] = orderDate || '';
    syncRow[CHEKEO.name] = safeTrim_(row[MASTER.customerName]);
    syncRow[CHEKEO.phone] = row[MASTER.phone] ? String(row[MASTER.phone]) : '';
    syncRow[CHEKEO.qtyOg] = normalizeQty_(row[MASTER.qtyOg]);
    syncRow[CHEKEO.qtyBbq] = normalizeQty_(row[MASTER.qtyBbq]);
    syncRow[CHEKEO.burgerSummary] = specialCase ? 'PEDIDO ESPECIAL' : buildBurgerSummary_(row);
    syncRow[CHEKEO.exactOrderText] = specialCase ? safeTrim_(row[MASTER.exactOrderText]) : '';
    syncRow[CHEKEO.extras] = specialCase ? '' : buildExtras_(row);
    syncRow[CHEKEO.sides] = buildSides_(row);
    syncRow[CHEKEO.total] = row[MASTER.total] || '';
    syncRow[CHEKEO.payment] = safeTrim_(row[MASTER.paymentMethod]);
    syncRow[CHEKEO.confirmed] = normalizeYesNo_(row[MASTER.confirmed]);
    syncRow[CHEKEO.paid] = normalizeYesNo_(row[MASTER.paid]);
    syncRow[CHEKEO.kitchenStatus] = kitchenStatus;
    syncRow[CHEKEO.startTime] = startTime;
    syncRow[CHEKEO.readyTime] = readyTime;
    syncRow[CHEKEO.updatedAt] = updatedAt;
    syncRow[CHEKEO.specialCase] = specialCase ? 'SI' : 'NO';
    syncRow[CHEKEO.manualReview] = specialCase ? 'SI' : 'NO';

    output.push(syncRow);
  });

  clearChekeoBody_(chekeoSheet);

  if (output.length > 0) {
    chekeoSheet.getRange(2, 1, output.length, 22).setValues(output);
    applyChekeoFormats_(chekeoSheet, output.length);
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActive().toast('Chekeo sincronizado.', 'Burgers OG', 4);
}

/**
 * Devuelve solo órdenes activas para la app:
 * PENDIENTE y EN PREP
 */
function getChekeoOrders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CHEKEO_SHEET);

    if (!sheet) throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { orders: [] };

    const values = sheet.getRange(2, 1, lastRow - 1, 22).getValues();

    const orders = values
      .map((row) => {
        const dt = normalizeDateValue_(row[CHEKEO.orderDateTime]);
        const status = normalizeKitchenStatus_(row[CHEKEO.kitchenStatus]);

        const masterRow = row[CHEKEO.masterRow] || '';
        const stableId = safeTrim_(row[CHEKEO.id]) || (masterRow ? buildOrderId_(masterRow) : '');

        return {
          id: stableId,
          masterRow: masterRow,
          orderDateTimeRaw: dt,
          orderDateTime: formatUiDateTime_(dt),
          orderDate: formatUiDate_(dt),
          name: safeTrim_(row[CHEKEO.name]),
          phone: row[CHEKEO.phone] ? String(row[CHEKEO.phone]) : '',
          qtyOg: normalizeQty_(row[CHEKEO.qtyOg]),
          qtyBbq: normalizeQty_(row[CHEKEO.qtyBbq]),
          burgerSummary: safeTrim_(row[CHEKEO.burgerSummary]),
          exactOrderText: safeTrim_(row[CHEKEO.exactOrderText]),
          extras: safeTrim_(row[CHEKEO.extras]),
          sides: safeTrim_(row[CHEKEO.sides]),
          totalDisplay: formatUiMoney_(row[CHEKEO.total]),
          payment: safeTrim_(row[CHEKEO.payment]),
          confirmed: safeTrim_(row[CHEKEO.confirmed]),
          paid: safeTrim_(row[CHEKEO.paid]),
          kitchenStatus: status,
          specialCase: safeTrim_(row[CHEKEO.specialCase]).toUpperCase() === 'SI',
          manualReview: safeTrim_(row[CHEKEO.manualReview]).toUpperCase() === 'SI'
        };
      })
      .filter((o) => o.id)
      .filter((o) => o.kitchenStatus === KITCHEN_STATUS.PENDING || o.kitchenStatus === KITCHEN_STATUS.IN_PREP)
      .sort((a, b) => {
        const at = a.orderDateTimeRaw ? a.orderDateTimeRaw.getTime() : 0;
        const bt = b.orderDateTimeRaw ? b.orderDateTimeRaw.getTime() : 0;
        return at - bt;
      });

    return { orders };
  } catch (error) {
    const msg = error && error.message ? String(error.message) : 'Error desconocido al leer Chekeo.';
    throw new Error(`No se pudo leer la hoja "${CHEKEO_SHEET}". Reautoriza el script y valida permisos del archivo. Detalle: ${msg}`);
  }
}

function diagnoseChekeoPermissions() {
  const ui = SpreadsheetApp.getUi();
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CHEKEO_SHEET);
    if (!sheet) throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);
    sheet.getRange(1, 1, 1, 1).getValue();
    ui.alert('Permisos OK', `Acceso correcto a "${CHEKEO_SHEET}" en ${ss.getName()}.`, ui.ButtonSet.OK);
  } catch (error) {
    const detail = error && error.message ? String(error.message) : 'Sin detalle';
    ui.alert('Permiso/Reautorización requerida', `No se pudo leer "${CHEKEO_SHEET}".\n\nDetalle: ${detail}`, ui.ButtonSet.OK);
    throw error;
  }
}

/**
 * Marca una orden como LISTO
 */
function markOrderReady(orderId) {
  const cleanOrderId = safeTrim_(orderId);

  if (!cleanOrderId) {
    throw new Error('No se recibió un ID de pedido válido.');
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CHEKEO_SHEET);
    if (!sheet) throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

    const rowNumber = findChekeoRowById_(sheet, cleanOrderId);
    if (!rowNumber) throw new Error(`No encontré el pedido ${cleanOrderId} en Chekeo`);

    const rowValues = sheet.getRange(rowNumber, 1, 1, 22).getValues()[0];
    const now = new Date();
    const startTime = rowValues[CHEKEO.startTime];

    sheet.getRange(rowNumber, CHEKEO.kitchenStatus + 1).setValue(KITCHEN_STATUS.READY);

    if (!startTime) {
      sheet.getRange(rowNumber, CHEKEO.startTime + 1).setValue(now);
    }

    sheet.getRange(rowNumber, CHEKEO.readyTime + 1).setValue(now);
    sheet.getRange(rowNumber, CHEKEO.updatedAt + 1).setValue(now);

    return {
      ok: true,
      orderId: cleanOrderId,
      newStatus: KITCHEN_STATUS.READY,
      updatedAt: formatUiDateTime_(now)
    };
  } finally {
    lock.releaseLock();
  }
}

function installChekeoTrigger() {
  removeChekeoTriggers();

  ScriptApp.newTrigger('syncChekeoFromMaster')
    .timeBased()
    .everyMinutes(1)
    .create();

  SpreadsheetApp.getActive().toast('Trigger instalado cada 1 minuto.', 'Burgers OG', 4);
}

function removeChekeoTriggers() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'syncChekeoFromMaster') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  SpreadsheetApp.getActive().toast('Triggers eliminados.', 'Burgers OG', 4);
}

/* =========================
   HELPERS
========================= */

function buildExistingChekeoMap_(rows) {
  const map = {};

  rows.forEach((row) => {
    const id = safeTrim_(row[CHEKEO.id]);
    if (!id) return;

    map[id] = {
      kitchenStatus: normalizeKitchenStatus_(row[CHEKEO.kitchenStatus] || ''),
      startTime: row[CHEKEO.startTime] || '',
      readyTime: row[CHEKEO.readyTime] || '',
      updatedAt: row[CHEKEO.updatedAt] || ''
    };
  });

  return map;
}

function buildOrderId_(masterRowNumber) {
  return `PM-${String(masterRowNumber).padStart(4, '0')}`;
}

function isSpecialCase_(row) {
  const specialFlag = safeTrim_(row[MASTER.specialFlag]);
  const total = safeTrim_(row[MASTER.total]);
  return specialFlag === '(+1)' || total === 'Chequeo Manual';
}

function buildBurgerSummary_(row) {
  const parts = [];

  const qtyOg = normalizeQty_(row[MASTER.qtyOg]);
  const qtyBbq = normalizeQty_(row[MASTER.qtyBbq]);
  const ogText = safeTrim_(row[MASTER.ogText]);
  const bbqText = safeTrim_(row[MASTER.bbqText]);

  if (qtyOg > 0) {
    parts.push(`${qtyOg} x OG`);
    if (ogText) parts.push(`OG: ${ogText}`);
  }

  if (qtyBbq > 0) {
    parts.push(`${qtyBbq} x BBQ`);
    if (bbqText) parts.push(`BBQ: ${bbqText}`);
  }

  return parts.join('\n');
}

function buildExtras_(row) {
  const extras = [];

  if (isYes_(row[MASTER.extraPickles])) extras.push('Pepinillos');
  if (isYes_(row[MASTER.extraAmerican])) extras.push('Queso americano');
  if (isYes_(row[MASTER.extraManchego])) extras.push('Queso manchego');
  if (isYes_(row[MASTER.extraBacon])) extras.push('Tocino');
  if (isYes_(row[MASTER.extraKetchup])) extras.push('Catsup');
  if (isYes_(row[MASTER.extraMustard])) extras.push('Mostaza');
  if (isYes_(row[MASTER.extraTomato])) extras.push('Tomate');

  return extras.join('\n');
}

function buildSides_(row) {
  const sides = [];

  const qOg = normalizeQty_(row[MASTER.sideFriesOg]);
  const qEsp = normalizeQty_(row[MASTER.sideFriesEspeciales]);
  const qLemon = normalizeQty_(row[MASTER.sideFriesLemon]);
  const qRings = normalizeQty_(row[MASTER.sideOnionRings]);

  if (qOg > 0) sides.push(`${qOg} x Papas a la francesa OG`);
  if (qEsp > 0) sides.push(`${qEsp} x Papas a la francesa Especiales`);
  if (qLemon > 0) sides.push(`${qLemon} x Papas a la francesa Lemon&Pepper`);
  if (qRings > 0) sides.push(`${qRings} x Aros de Cebolla`);

  return sides.join('\n');
}

function normalizeQty_(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

function normalizeYesNo_(value) {
  const v = safeTrim_(value).toLowerCase();
  if (v === 'si' || v === 'sí') return 'Si';
  if (v === 'no') return 'No';
  return '';
}

function isYes_(value) {
  return normalizeYesNo_(value) === 'Si';
}

function normalizeKitchenStatus_(value) {
  const raw = safeTrim_(value);
  const normalized = raw
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized === KITCHEN_STATUS.PENDING) return KITCHEN_STATUS.PENDING;
  if (normalized === KITCHEN_STATUS.IN_PREP) return KITCHEN_STATUS.IN_PREP;
  if (normalized === KITCHEN_STATUS.READY) return KITCHEN_STATUS.READY;
  if (normalized === KITCHEN_STATUS.DELIVERED) return KITCHEN_STATUS.DELIVERED;
  if (normalized === KITCHEN_STATUS.CANCELED) return KITCHEN_STATUS.CANCELED;

  return KITCHEN_STATUS.PENDING;
}

function safeTrim_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeDateValue_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value;

  const parsed = new Date(value);
  return isNaN(parsed) ? '' : parsed;
}

function extractOnlyDate_(dateValue) {
  if (!dateValue || Object.prototype.toString.call(dateValue) !== '[object Date]') return '';
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
}

function formatUiDateTime_(dateValue) {
  if (!dateValue || Object.prototype.toString.call(dateValue) !== '[object Date]' || isNaN(dateValue)) {
    return '';
  }
  return Utilities.formatDate(dateValue, TIME_ZONE, 'dd/MM/yyyy HH:mm:ss');
}

function formatUiDate_(dateValue) {
  if (!dateValue || Object.prototype.toString.call(dateValue) !== '[object Date]' || isNaN(dateValue)) {
    return '';
  }
  return Utilities.formatDate(dateValue, TIME_ZONE, 'dd/MM/yyyy');
}

function formatUiMoney_(value) {
  if (value === '' || value === null || value === undefined) return '';
  return String(value);
}

function findChekeoRowById_(sheet, orderId) {
  const cleanOrderId = safeTrim_(orderId);
  if (!cleanOrderId) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const ids = sheet.getRange(2, CHEKEO.id + 1, lastRow - 1, 1).getValues().flat();
  const index = ids.findIndex((id) => safeTrim_(id) === cleanOrderId);
  return index === -1 ? 0 : index + 2;
}

function clearChekeoBody_(sheet) {
  const maxRows = sheet.getMaxRows();
  if (maxRows > 1) {
    sheet.getRange(2, 1, maxRows - 1, 22).clearContent();
  }
}

function applyChekeoFormats_(sheet, rowCount) {
  if (rowCount <= 0) return;

  sheet.getRange(2, CHEKEO.orderDateTime + 1, rowCount, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2, CHEKEO.orderDate + 1, rowCount, 1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2, CHEKEO.startTime + 1, rowCount, 3).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}
