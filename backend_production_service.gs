function bogGetProductionValidation_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var issues = [];
  var checks = {};

  var activeEnvironment = bogGetActiveEnvironment_();
  var activeSheet = bogGetActiveChekeoSheetName_();

  checks.activeEnvironment = activeEnvironment;
  checks.activeSheet = activeSheet;
  checks.safeDefaultTest = activeEnvironment === BurgerOGConstants.ENVIRONMENTS.TEST;

  var testSheet = spreadsheet.getSheetByName(BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  checks.testSheetExists = Boolean(testSheet);
  if (!checks.testSheetExists) {
    issues.push('Falta hoja de pruebas: ' + BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME + '.');
  }

  var productionSheet = spreadsheet.getSheetByName(BurgerOGConstants.SHEETS.CHEKEO_PRODUCTION_SHEET_NAME);
  checks.productionSheetExists = Boolean(productionSheet);
  if (!checks.productionSheetExists) {
    issues.push('Falta hoja objetivo de producción: ' + BurgerOGConstants.SHEETS.CHEKEO_PRODUCTION_SHEET_NAME + '.');
  }

  checks.requiredSupportSheets = {};
  [
    BurgerOGConstants.SHEETS.MASTER_SHEET_NAME,
    BurgerOGConstants.SHEETS.CONFIG_SHEET_NAME,
    BurgerOGConstants.SHEETS.SUMMARY_SHEET_NAME,
    BurgerOGConstants.SHEETS.HISTORY_SHEET_NAME
  ].forEach(function (sheetName) {
    var exists = Boolean(spreadsheet.getSheetByName(sheetName));
    checks.requiredSupportSheets[sheetName] = exists;
    if (!exists) {
      issues.push('Falta hoja requerida: ' + sheetName + '.');
    }
  });

  if (testSheet) {
    try {
      bogValidateChekeoHeadersWithoutMutation_(testSheet);
      checks.testHeadersValid = true;
    } catch (errTestHeaders) {
      checks.testHeadersValid = false;
      issues.push(errTestHeaders.message);
    }
  }

  if (productionSheet) {
    try {
      bogValidateChekeoHeadersWithoutMutation_(productionSheet);
      checks.productionHeadersValid = true;
    } catch (errProdHeaders) {
      checks.productionHeadersValid = false;
      issues.push(errProdHeaders.message);
    }
  }

  try {
    bogGetBankConfig_();
    checks.bankConfigValid = true;
  } catch (errBank) {
    checks.bankConfigValid = false;
    issues.push('Configuración bancaria incompleta: ' + errBank.message);
  }

  checks.ordersInTest = testSheet ? Math.max(testSheet.getLastRow() - 1, 0) : 0;
  checks.ordersInProduction = productionSheet ? Math.max(productionSheet.getLastRow() - 1, 0) : 0;

  return {
    valid: issues.length === 0,
    issues: issues,
    checks: checks,
    recommendation: issues.length
      ? 'Atiende incidencias antes de ejecutar migración manual.'
      : 'Sistema listo para migración manual controlada.'
  };
}

function bogGetProductionMigrationPreview_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var testSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var productionSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_PRODUCTION_SHEET_NAME);

  var testHeaderMap = bogValidateChekeoHeadersWithoutMutation_(testSheet);
  var productionHeaderMap = bogValidateChekeoHeadersWithoutMutation_(productionSheet);

  var testHeaders = testSheet.getRange(1, 1, 1, testSheet.getLastColumn()).getValues()[0];
  var productionHeaders = productionSheet.getRange(1, 1, 1, productionSheet.getLastColumn()).getValues()[0];

  var testData = bogReadSheetAsObjects_(testSheet, BurgerOGConstants.CHEKEO_REQUIRED_COLUMNS);
  var productionData = bogReadSheetAsObjects_(productionSheet, BurgerOGConstants.CHEKEO_REQUIRED_COLUMNS);

  var productionById = {};
  productionData.rows.forEach(function (row) {
    var orderId = bogTrim_(row.data['ID Pedido']);
    if (!orderId) {
      return;
    }

    if (!productionById[orderId]) {
      productionById[orderId] = [];
    }
    productionById[orderId].push(row);
  });

  var insertions = [];
  var updates = [];
  var duplicateIdsInProduction = [];

  testData.rows.forEach(function (row) {
    var orderId = bogTrim_(row.data['ID Pedido']);
    if (!orderId) {
      return;
    }

    var matches = productionById[orderId] || [];
    if (!matches.length) {
      insertions.push(orderId);
      return;
    }

    if (matches.length > 1) {
      duplicateIdsInProduction.push(orderId);
    }

    updates.push(orderId);
  });

  return {
    sourceSheet: BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME,
    targetSheet: BurgerOGConstants.SHEETS.CHEKEO_PRODUCTION_SHEET_NAME,
    activeEnvironment: bogGetActiveEnvironment_(),
    headers: {
      testColumns: Object.keys(testHeaderMap).length,
      productionColumns: Object.keys(productionHeaderMap).length,
      testHeaderCount: testHeaders.length,
      productionHeaderCount: productionHeaders.length
    },
    totals: {
      sourceRows: testData.rows.filter(function (row) { return bogTrim_(row.data['ID Pedido']) !== ''; }).length,
      targetRows: productionData.rows.filter(function (row) { return bogTrim_(row.data['ID Pedido']) !== ''; }).length,
      wouldInsert: insertions.length,
      wouldUpdate: updates.length,
      duplicateIdsInProduction: bogUniqueNonEmpty_(duplicateIdsInProduction).length
    },
    sample: {
      insertions: insertions.slice(0, 20),
      updates: updates.slice(0, 20),
      duplicateIdsInProduction: bogUniqueNonEmpty_(duplicateIdsInProduction).slice(0, 20)
    },
    safeMode: {
      migrationExecuted: false,
      note: 'Este endpoint solo genera preview y no copia ni borra datos.'
    }
  };
}

function bogPrepareProductionSheets_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var actions = [];

  var testSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  bogEnsureChekeoHeaders_(testSheet);

  var productionExistsBefore = Boolean(spreadsheet.getSheetByName(BurgerOGConstants.SHEETS.CHEKEO_PRODUCTION_SHEET_NAME));
  var productionSheet = bogGetOrCreateSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_PRODUCTION_SHEET_NAME);
  if (!productionExistsBefore) {
    actions.push('Se creó hoja de producción: ' + BurgerOGConstants.SHEETS.CHEKEO_PRODUCTION_SHEET_NAME + '.');
  }

  bogEnsureChekeoHeaders_(productionSheet);
  actions.push('Encabezados validados en hoja de pruebas y hoja de producción.');

  return {
    prepared: true,
    activeEnvironment: bogGetActiveEnvironment_(),
    activeSheet: bogGetActiveChekeoSheetName_(),
    actions: actions,
    safeGuards: [
      'No se migraron filas de Chekeo Nuevo a Chekeo.',
      'No se cambió el entorno activo automáticamente.',
      'No se borraron hojas ni datos existentes.'
    ]
  };
}

function bogValidateChekeoHeadersWithoutMutation_(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    throw new Error('La hoja ' + sheet.getName() + ' no tiene encabezados.');
  }
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return bogValidateRequiredHeaders_(headers, BurgerOGConstants.CHEKEO_REQUIRED_COLUMNS, sheet.getName());
}
