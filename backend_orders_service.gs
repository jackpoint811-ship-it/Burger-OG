function bogSyncOrdersFromMaster_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.MASTER_SHEET_NAME);
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);

  bogEnsureChekeoHeaders_(chekeoSheet);

  var masterData = bogReadSheetAsObjects_(masterSheet, BurgerOGConstants.MASTER_REQUIRED_COLUMNS);
  var chekeoData = bogReadSheetAsObjects_(chekeoSheet, BurgerOGConstants.CHEKEO_REQUIRED_COLUMNS);

  var existingByMasterRow = {};
  chekeoData.rows.forEach(function (row) {
    var key = bogTrim_(row.data['Fila Master']);
    if (key) {
      existingByMasterRow[key] = row;
    }
  });

  var writeByChekeoRow = {};
  var appendRows = [];
  var inserted = 0;
  var updated = 0;
  var checked = 0;

  masterData.rows.forEach(function (masterRow) {
    var record = masterRow.data;
    if (bogIsEffectivelyEmptyOrder_(record)) {
      return;
    }

    checked += 1;
    var masterRowNumber = masterRow.rowNumber;
    var key = String(masterRowNumber);
    var existing = existingByMasterRow[key];

    var merged = bogBuildChekeoRowFromMaster_(record, masterRowNumber, existing && existing.data);
    var validationErrors = bogValidateChekeoRecord_(merged);
    if (validationErrors.length) {
      throw new Error('Error de validación en Fila Master ' + key + ': ' + validationErrors.join(' | '));
    }

    if (existing) {
      writeByChekeoRow[existing.rowNumber] = bogToRowInContractOrder_(merged);
      updated += 1;
    } else {
      appendRows.push(bogToRowInContractOrder_(merged));
      inserted += 1;
    }
  });

  Object.keys(writeByChekeoRow).forEach(function (rowNumberText) {
    var rowNumber = Number(rowNumberText);
    chekeoSheet
      .getRange(rowNumber, 1, 1, BurgerOGConstants.CHEKEO_COLUMNS.length)
      .setValues([writeByChekeoRow[rowNumberText]]);
  });

  if (appendRows.length) {
    var startRow = chekeoSheet.getLastRow() + 1;
    chekeoSheet
      .getRange(startRow, 1, appendRows.length, BurgerOGConstants.CHEKEO_COLUMNS.length)
      .setValues(appendRows);
  }

  return {
    inserted: inserted,
    updated: updated,
    checked: checked
  };
}

function bogGetAppOrders_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var chekeoData = bogReadSheetAsObjects_(chekeoSheet, BurgerOGConstants.CHEKEO_REQUIRED_COLUMNS);

  return chekeoData.rows
    .map(function (row) { return row.data; })
    .filter(function (record) { return bogTrim_(record['ID Pedido']) !== ''; });
}

function bogGetOrderDetail_(orderId) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var found = bogFindChekeoOrderRowById_(chekeoSheet, orderId);
  return found ? found.rowData : null;
}

function bogUpdateOrderStatus_(orderId, nextStatus) {
  if (BurgerOGConstants.ENUMS.ESTADO_PEDIDO.indexOf(nextStatus) === -1) {
    throw new Error('Estado Pedido inválido: ' + nextStatus);
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var found = bogFindChekeoOrderRowById_(chekeoSheet, orderId);

  if (!found) {
    throw new Error('Pedido no encontrado: ' + orderId);
  }

  var patch = {
    'Estado Pedido': nextStatus,
    'Última Actualización': bogNowIso_()
  };

  if (nextStatus === 'Preparando' && bogTrim_(found.rowData['Hora Inicio']) === '') {
    patch['Hora Inicio'] = bogNowTimeMx_();
  }

  if (nextStatus === 'Listo' && bogTrim_(found.rowData['Hora Listo']) === '') {
    patch['Hora Listo'] = bogNowTimeMx_();
  }

  bogPatchRowByHeaders_(chekeoSheet, found.rowNumber, found.headerMap, patch);
  return { orderId: orderId, updatedFields: patch };
}

function bogMarkOrderPaid_(orderId) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var found = bogFindChekeoOrderRowById_(chekeoSheet, orderId);

  if (!found) {
    throw new Error('Pedido no encontrado: ' + orderId);
  }

  var patch = {
    'Estado Pago': 'Pagado',
    'Última Actualización': bogNowIso_()
  };

  bogPatchRowByHeaders_(chekeoSheet, found.rowNumber, found.headerMap, patch);
  return { orderId: orderId, updatedFields: patch };
}

function bogUpdateOrderNotes_(orderId, noteInternal, noteClient) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var found = bogFindChekeoOrderRowById_(chekeoSheet, orderId);

  if (!found) {
    throw new Error('Pedido no encontrado: ' + orderId);
  }

  var patch = {
    'Nota Interna': bogTrim_(noteInternal),
    'Nota Cliente': bogTrim_(noteClient),
    'Última Actualización': bogNowIso_()
  };

  bogPatchRowByHeaders_(chekeoSheet, found.rowNumber, found.headerMap, patch);
  return { orderId: orderId, updatedFields: patch };
}

function bogMarkTicketSent_(orderId) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var found = bogFindChekeoOrderRowById_(chekeoSheet, orderId);

  if (!found) {
    throw new Error('Pedido no encontrado: ' + orderId);
  }

  var patch = {
    'Ticket Enviado': 'Si',
    'Fecha Ticket Enviado': bogNowDateMx_(),
    'Última Actualización': bogNowIso_()
  };

  bogPatchRowByHeaders_(chekeoSheet, found.rowNumber, found.headerMap, patch);
  return { orderId: orderId, updatedFields: patch };
}

function bogBuildChekeoRowFromMaster_(masterRecord, masterRowNumber, existingRecord) {
  var row = {};

  row['ID Pedido'] = existingRecord ? existingRecord['ID Pedido'] : bogBuildOrderId_(masterRowNumber);
  row['Fila Master'] = existingRecord ? existingRecord['Fila Master'] : String(masterRowNumber);

  row['Fecha Pedido'] = masterRecord['Fecha Pedido'] || '';
  row['Hora Pedido'] = masterRecord['Hora Pedido'] || '';
  row['Nombre'] = masterRecord['Nombre'] || '';
  row['Teléfono'] = masterRecord['Teléfono'] || '';
  row['Resumen Pedido'] = masterRecord['Resumen Pedido'] || '';
  row['Hamburguesas'] = masterRecord['Hamburguesas'] || '';
  row['Extras'] = masterRecord['Extras'] || '';
  row['Guarniciones'] = masterRecord['Guarniciones'] || '';
  row['Total'] = bogNormalizeMoney_(masterRecord['Total']);

  row['Estado Pedido'] = (existingRecord && existingRecord['Estado Pedido']) || BurgerOGConstants.DEFAULTS.ESTADO_PEDIDO;
  row['Estado Pago'] = (existingRecord && existingRecord['Estado Pago']) || BurgerOGConstants.DEFAULTS.ESTADO_PAGO;
  row['Método Pago'] = (existingRecord && existingRecord['Método Pago']) || BurgerOGConstants.DEFAULTS.METODO_PAGO;
  row['Nota Interna'] = (existingRecord && existingRecord['Nota Interna']) || '';
  row['Nota Cliente'] = (existingRecord && existingRecord['Nota Cliente']) || '';

  row['Alerta'] = bogNormalizeAlertValue_(existingRecord && existingRecord['Alerta']);
  if (!row['Alerta'] && bogRequiresAlert_(row)) {
    row['Alerta'] = '⚠️';
  }

  row['Ticket Enviado'] = (existingRecord && existingRecord['Ticket Enviado']) || BurgerOGConstants.DEFAULTS.TICKET_ENVIADO;
  row['Fecha Ticket Enviado'] = (existingRecord && existingRecord['Fecha Ticket Enviado']) || '';
  row['Hora Inicio'] = (existingRecord && existingRecord['Hora Inicio']) || '';
  row['Hora Listo'] = (existingRecord && existingRecord['Hora Listo']) || '';
  row['Última Actualización'] = bogNowIso_();

  return row;
}
