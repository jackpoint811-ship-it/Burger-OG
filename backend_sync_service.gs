function bogSyncChekeoNuevo() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = spreadsheet.getSheetByName(BurgerOGConstants.SHEETS.PEDIDOS_MASTER);
  var chekeoSheet = spreadsheet.getSheetByName(BurgerOGConstants.SHEETS.CHEKEO_NUEVO);

  if (!masterSheet || !chekeoSheet) {
    throw new Error('No se encontraron hojas requeridas: Pedidos Master / Chekeo Nuevo.');
  }

  bogEnsureChekeoHeaders_(chekeoSheet);

  var masterData = masterSheet.getDataRange().getValues();
  if (masterData.length <= 1) {
    return { inserted: 0, updated: 0, checked: 0 };
  }

  var masterHeaders = masterData[0];
  var masterRows = masterData.slice(1);

  var chekeoData = chekeoSheet.getDataRange().getValues();
  var chekeoHeaders = chekeoData[0];
  var chekeoRows = chekeoData.slice(1);

  var chekeoByMasterRow = {};
  chekeoRows.forEach(function (row, idx) {
    var rowObj = bogToObject_(chekeoHeaders, row);
    var masterRowKey = bogTrim_(rowObj['Fila Master']);
    if (masterRowKey) {
      chekeoByMasterRow[masterRowKey] = {
        index: idx,
        rowObj: rowObj
      };
    }
  });

  var outRows = chekeoRows.slice();
  var inserted = 0;
  var updated = 0;

  masterRows.forEach(function (masterRow, idx) {
    var source = bogToObject_(masterHeaders, masterRow);
    var sheetRowNumber = idx + 2;
    var key = String(sheetRowNumber);
    var existing = chekeoByMasterRow[key];

    var merged = bogBuildChekeoRowFromMaster_(source, sheetRowNumber, existing && existing.rowObj);
    var validationErrors = bogValidateChekeoRecord_(merged);

    if (validationErrors.length) {
      throw new Error('Error de validación en Fila Master ' + key + ': ' + validationErrors.join(' | '));
    }

    if (existing) {
      outRows[existing.index] = bogToRow_(chekeoHeaders, merged);
      updated += 1;
    } else {
      outRows.push(bogToRow_(chekeoHeaders, merged));
      inserted += 1;
    }
  });

  if (outRows.length) {
    chekeoSheet
      .getRange(2, 1, outRows.length, chekeoHeaders.length)
      .setValues(outRows);
  }

  return {
    inserted: inserted,
    updated: updated,
    checked: masterRows.length
  };
}

function bogBuildChekeoRowFromMaster_(masterRecord, masterRowNumber, existingRecord) {
  var row = {};
  var nowIso = bogNowIso_();

  row['ID Pedido'] = existingRecord ? existingRecord['ID Pedido'] : bogBuildOrderId_(masterRowNumber);
  row['Fila Master'] = existingRecord ? existingRecord['Fila Master'] : String(masterRowNumber);

  row['Fecha Pedido'] = masterRecord['Fecha Pedido'] || '';
  row['Hora Pedido'] = masterRecord['Hora Pedido'] || '';
  row.Nombre = masterRecord.Nombre || '';
  row['Teléfono'] = masterRecord['Teléfono'] || '';
  row['Resumen Pedido'] = masterRecord['Resumen Pedido'] || '';
  row.Hamburguesas = masterRecord.Hamburguesas || '';
  row.Extras = masterRecord.Extras || '';
  row.Guarniciones = masterRecord.Guarniciones || '';
  row.Total = masterRecord.Total || 0;

  row['Estado Pedido'] = (existingRecord && existingRecord['Estado Pedido']) || masterRecord['Estado Pedido'] || BurgerOGConstants.DEFAULTS.ESTADO_PEDIDO;
  row['Estado Pago'] = (existingRecord && existingRecord['Estado Pago']) || masterRecord['Estado Pago'] || BurgerOGConstants.DEFAULTS.ESTADO_PAGO;
  row['Método Pago'] = (existingRecord && existingRecord['Método Pago']) || masterRecord['Método Pago'] || BurgerOGConstants.DEFAULTS.METODO_PAGO;

  row['Nota Interna'] = (existingRecord && existingRecord['Nota Interna']) || '';
  row['Nota Cliente'] = (existingRecord && existingRecord['Nota Cliente']) || '';
  row.Alerta = (existingRecord && existingRecord.Alerta) || '';

  if (!row.Alerta && bogRequiresAlert_(row)) {
    row.Alerta = '⚠️';
  }

  row['Ticket Enviado'] = (existingRecord && existingRecord['Ticket Enviado']) || BurgerOGConstants.DEFAULTS.TICKET_ENVIADO;
  row['Fecha Ticket Enviado'] = (existingRecord && existingRecord['Fecha Ticket Enviado']) || '';
  row['Hora Inicio'] = (existingRecord && existingRecord['Hora Inicio']) || '';
  row['Hora Listo'] = (existingRecord && existingRecord['Hora Listo']) || '';
  row['Última Actualización'] = nowIso;

  return row;
}

function bogEnsureChekeoHeaders_(sheet) {
  var currentHeaders = sheet.getRange(1, 1, 1, BurgerOGConstants.CHEKEO_COLUMNS.length).getValues()[0];
  var expected = BurgerOGConstants.CHEKEO_COLUMNS;

  var isHeaderMissing = currentHeaders.every(function (v) {
    return bogTrim_(v) === '';
  });

  if (isHeaderMissing) {
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    return;
  }

  expected.forEach(function (header, index) {
    if (bogTrim_(currentHeaders[index]) !== header) {
      throw new Error('Chekeo Nuevo no cumple contrato de columnas en posición ' + (index + 1) + '.');
    }
  });
}
