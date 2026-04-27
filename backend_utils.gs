function bogNowIso_() {
  return new Date().toISOString();
}

function bogNowDateMx_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function bogNowTimeMx_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm');
}

function bogNormalizeHeaderKey_(value) {
  return bogTrim_(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function bogPadOrderNumber_(masterRow) {
  var orderNumber = Number(masterRow) - 1;
  var asText = String(orderNumber);
  while (asText.length < 3) {
    asText = '0' + asText;
  }
  return asText;
}

function bogBuildOrderId_(masterRow) {
  return 'BOG-' + bogPadOrderNumber_(masterRow);
}

function bogToObjectByHeaderMap_(headers, headerMap, row) {
  var obj = {};
  headers.forEach(function (header) {
    obj[header] = row[headerMap[bogNormalizeHeaderKey_(header)]];
  });
  return obj;
}

function bogToRowInContractOrder_(obj) {
  return BurgerOGConstants.CHEKEO_COLUMNS.map(function (header) {
    return obj[header] !== undefined ? obj[header] : '';
  });
}

function bogTrim_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function bogNormalizeAlertValue_(value) {
  return bogTrim_(value) === '⚠️' ? '⚠️' : '';
}

function bogNormalizeMoney_(value) {
  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw new Error('Total inválido: NaN.');
    }
    return value;
  }

  var raw = bogTrim_(value);
  if (!raw) {
    return 0;
  }

  var cleaned = raw
    .replace(/mxn/gi, '')
    .replace(/\$/g, '')
    .replace(/\s+/g, '');

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.indexOf(',') !== -1 && cleaned.indexOf('.') === -1) {
    cleaned = cleaned.replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  var parsed = Number(cleaned);
  if (isNaN(parsed)) {
    throw new Error('No se pudo normalizar Total: ' + raw);
  }
  return parsed;
}

function bogIsEffectivelyEmptyOrder_(record) {
  var fields = [
    record['Nombre'],
    record['Teléfono'],
    record['Resumen Pedido'],
    record['Hamburguesas'],
    record['Extras'],
    record['Guarniciones'],
    record['Total']
  ];

  return fields.every(function (value) {
    return bogTrim_(value) === '';
  });
}
