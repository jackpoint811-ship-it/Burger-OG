function bogGetDailySummary_() {
  var orders = bogGetAppOrders_();

  var summary = {
    totalVendido: 0,
    totalPagado: 0,
    totalPendiente: 0,
    conteoEstadoPedido: {},
    conteoEstadoPago: {}
  };

  orders.forEach(function (order) {
    var total = bogNormalizeMoney_(order['Total']);
    var estadoPago = bogTrim_(order['Estado Pago']) || BurgerOGConstants.DEFAULTS.ESTADO_PAGO;
    var estadoPedido = bogTrim_(order['Estado Pedido']) || BurgerOGConstants.DEFAULTS.ESTADO_PEDIDO;

    summary.totalVendido += total;
    if (estadoPago === 'Pagado') {
      summary.totalPagado += total;
    } else {
      summary.totalPendiente += total;
    }

    summary.conteoEstadoPedido[estadoPedido] = (summary.conteoEstadoPedido[estadoPedido] || 0) + 1;
    summary.conteoEstadoPago[estadoPago] = (summary.conteoEstadoPago[estadoPago] || 0) + 1;
  });

  return summary;
}

function bogGetCloseDayPreview_() {
  var orders = bogGetAppOrders_();
  var eligible = [];
  var blocked = [];

  orders.forEach(function (order) {
    if (bogIsArchivableOrder_(order)) {
      eligible.push(order);
      return;
    }

    blocked.push({
      orderId: bogTrim_(order['ID Pedido']),
      estadoPedido: bogTrim_(order['Estado Pedido']),
      estadoPago: bogTrim_(order['Estado Pago']),
      reason: 'Solo se puede archivar si Estado Pedido=Listo y Estado Pago=Pagado.'
    });
  });

  var summary = bogBuildSummaryForOrders_(eligible);

  return {
    totalOrders: orders.length,
    eligibleCount: eligible.length,
    blockedCount: blocked.length,
    eligibleOrderIds: eligible.map(function (order) { return bogTrim_(order['ID Pedido']); }),
    blockedOrders: blocked,
    archiveSummary: summary
  };
}

function bogArchiveReadyPaidOrders_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME);
  var historySheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.HISTORY_SHEET_NAME);

  var chekeoData = bogReadSheetAsObjects_(chekeoSheet, BurgerOGConstants.CHEKEO_REQUIRED_COLUMNS);
  var historyHeaderMap = bogEnsureSheetHeaders_(historySheet, BurgerOGConstants.HISTORY_COLUMNS);
  var historyHeaders = historySheet.getRange(1, 1, 1, historySheet.getLastColumn()).getValues()[0];

  var toArchive = [];
  var toDeleteRows = [];

  chekeoData.rows.forEach(function (row) {
    if (!bogTrim_(row.data['ID Pedido'])) {
      return;
    }

    if (!bogIsArchivableOrder_(row.data)) {
      return;
    }

    toArchive.push(row.data);
    toDeleteRows.push(row.rowNumber);
  });

  if (!toArchive.length) {
    return {
      archivedCount: 0,
      deletedCount: 0,
      orderIds: [],
      message: 'No hay pedidos Listo + Pagado para archivar.'
    };
  }

  var archiveDate = bogNowDateMx_();
  var archiveRows = toArchive.map(function (order) {
    var historyRecord = {};
    BurgerOGConstants.CHEKEO_COLUMNS.forEach(function (column) {
      historyRecord[column] = order[column];
    });
    historyRecord['Fecha Archivo'] = archiveDate;
    historyRecord['Motivo Archivo'] = 'Cierre operativo';
    return bogBuildRowByHeaderMap_(historyHeaders, historyHeaderMap, historyRecord);
  });

  historySheet
    .getRange(historySheet.getLastRow() + 1, 1, archiveRows.length, historyHeaders.length)
    .setValues(archiveRows);

  bogDeleteRowsDescending_(chekeoSheet, toDeleteRows);

  return {
    archivedCount: toArchive.length,
    deletedCount: toDeleteRows.length,
    orderIds: toArchive.map(function (order) { return bogTrim_(order['ID Pedido']); }),
    message: 'Pedidos archivados en Historico.'
  };
}

function bogCloseDay_() {
  var preview = bogGetCloseDayPreview_();
  if (preview.blockedCount > 0) {
    throw new Error('No se puede cerrar el día: hay pedidos que no están Listo + Pagado.');
  }

  var archiveResult = bogArchiveReadyPaidOrders_();
  var closeSummary = {
    fecha: bogNowDateMx_(),
    archivedCount: archiveResult.archivedCount,
    archivedOrderIds: archiveResult.orderIds,
    summary: preview.archiveSummary
  };

  bogAppendDailySummaryRow_(closeSummary);

  return closeSummary;
}

function bogGetHistoryOrders_(limit) {
  var safeLimit = Number(limit);
  if (!safeLimit || safeLimit < 1) {
    safeLimit = 30;
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var historySheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.HISTORY_SHEET_NAME);
  var historyData = bogReadSheetAsObjects_(historySheet, BurgerOGConstants.HISTORY_COLUMNS);

  return historyData.rows
    .map(function (row) { return row.data; })
    .filter(function (record) { return bogTrim_(record['ID Pedido']) !== ''; })
    .slice(-safeLimit)
    .reverse();
}

function bogAppendDailySummaryRow_(closeSummary) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var summarySheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.SUMMARY_SHEET_NAME);
  var headerMap = bogEnsureSheetHeaders_(summarySheet, BurgerOGConstants.SUMMARY_COLUMNS);
  var headers = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0];

  var record = {
    'Fecha': closeSummary.fecha,
    'Pedidos Archivados': closeSummary.archivedCount,
    'Total Archivado': closeSummary.summary.totalVendido,
    'Total Pagado Archivado': closeSummary.summary.totalPagado,
    'Total Pendiente Archivado': closeSummary.summary.totalPendiente,
    'Conteo Estado Pedido': JSON.stringify(closeSummary.summary.conteoEstadoPedido || {}),
    'Conteo Estado Pago': JSON.stringify(closeSummary.summary.conteoEstadoPago || {}),
    'Generado En': bogNowIso_()
  };

  var row = bogBuildRowByHeaderMap_(headers, headerMap, record);
  summarySheet.getRange(summarySheet.getLastRow() + 1, 1, 1, headers.length).setValues([row]);
}

function bogBuildSummaryForOrders_(orders) {
  var summary = {
    totalVendido: 0,
    totalPagado: 0,
    totalPendiente: 0,
    conteoEstadoPedido: {},
    conteoEstadoPago: {}
  };

  (orders || []).forEach(function (order) {
    var total = bogNormalizeMoney_(order['Total']);
    var estadoPago = bogTrim_(order['Estado Pago']) || BurgerOGConstants.DEFAULTS.ESTADO_PAGO;
    var estadoPedido = bogTrim_(order['Estado Pedido']) || BurgerOGConstants.DEFAULTS.ESTADO_PEDIDO;

    summary.totalVendido += total;
    if (estadoPago === 'Pagado') {
      summary.totalPagado += total;
    } else {
      summary.totalPendiente += total;
    }

    summary.conteoEstadoPedido[estadoPedido] = (summary.conteoEstadoPedido[estadoPedido] || 0) + 1;
    summary.conteoEstadoPago[estadoPago] = (summary.conteoEstadoPago[estadoPago] || 0) + 1;
  });

  return summary;
}

function bogIsArchivableOrder_(order) {
  return bogTrim_(order['Estado Pedido']) === 'Listo' && bogTrim_(order['Estado Pago']) === 'Pagado';
}

function bogGetBankConfig_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = bogGetRequiredSheet_(spreadsheet, BurgerOGConstants.SHEETS.CONFIG_SHEET_NAME);
  var values = configSheet.getDataRange().getValues();

  if (!values.length) {
    throw new Error('La hoja Configuración está vacía.');
  }

  var headers = values[0];
  var normalizedHeaderMap = bogGetHeaderMap_(headers);
  var bancoIndex = normalizedHeaderMap[bogNormalizeHeaderKey_('Banco')];
  var nombreIndex = normalizedHeaderMap[bogNormalizeHeaderKey_('Nombre')];
  var cuentaIndex = normalizedHeaderMap[bogNormalizeHeaderKey_('Número de cuenta')];

  if (bancoIndex !== undefined && nombreIndex !== undefined && cuentaIndex !== undefined) {
    for (var i = 1; i < values.length; i += 1) {
      var row = values[i];
      var rowConfig = {
        Banco: bogTrim_(row[bancoIndex]),
        Nombre: bogTrim_(row[nombreIndex]),
        'Número de cuenta': bogTrim_(row[cuentaIndex])
      };

      if (rowConfig.Banco || rowConfig.Nombre || rowConfig['Número de cuenta']) {
        return bogValidateBankConfigOrThrow_(rowConfig, 'Formato por columnas incompleto');
      }
    }
  }

  var keyValue = {};
  values.forEach(function (row) {
    var key = bogNormalizeHeaderKey_(row[0]);
    var value = bogTrim_(row[1]);
    if (key) {
      keyValue[key] = value;
    }
  });

  var fieldValueConfig = {
    Banco: keyValue[bogNormalizeHeaderKey_('Banco')] || '',
    Nombre: keyValue[bogNormalizeHeaderKey_('Nombre')] || '',
    'Número de cuenta': keyValue[bogNormalizeHeaderKey_('Número de cuenta')] || ''
  };

  return bogValidateBankConfigOrThrow_(fieldValueConfig, 'Formato Campo|Valor incompleto');
}

function bogValidateBankConfigOrThrow_(config, contextLabel) {
  var missing = [];

  if (!config.Banco) {
    missing.push('Banco');
  }
  if (!config.Nombre) {
    missing.push('Nombre');
  }
  if (!config['Número de cuenta']) {
    missing.push('Número de cuenta');
  }

  if (missing.length) {
    throw new Error(contextLabel + ': faltan ' + missing.join(', ') + '.');
  }

  return config;
}
