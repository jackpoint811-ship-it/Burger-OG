function bogNowIso_() {
  return new Date().toISOString();
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

function bogNormalizeHeaderMap_(headers) {
  var map = {};
  headers.forEach(function (name, index) {
    map[String(name || '').trim()] = index;
  });
  return map;
}

function bogToObject_(headers, row) {
  var obj = {};
  headers.forEach(function (header, index) {
    obj[header] = row[index];
  });
  return obj;
}

function bogToRow_(headers, obj) {
  return headers.map(function (header) {
    return obj[header] !== undefined ? obj[header] : '';
  });
}

function bogTrim_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}
