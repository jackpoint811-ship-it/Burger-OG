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
