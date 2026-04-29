function bogGetClientTicketData_(orderId) {
  var cleanOrderId = bogTrim_(orderId);
  if (!cleanOrderId) {
    throw new Error('ID de pedido requerido.');
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var chekeoSheet = bogGetRequiredSheet_(spreadsheet, bogGetActiveChekeoSheetName_());
  var orderRow = bogFindChekeoOrderRowById_(chekeoSheet, cleanOrderId);
  if (!orderRow || !orderRow.rowData) {
    throw new Error('Pedido no encontrado: ' + cleanOrderId);
  }

  var order = orderRow.rowData;
  return {
    orderId: String(order['ID Pedido'] || ''),
    name: String(order['Nombre'] || ''),
    payment: String(order['Método Pago'] || order['Estado Pago'] || ''),
    noteClient: String(order['Nota Cliente'] || ''),
    total: bogNormalizeMoney_(order['Total']),
    priceBreakdown: bogBuildTicketPriceBreakdown_(order, bogReadPublishedPricesMap_(spreadsheet))
  };
}

function bogReadPublishedPricesMap_(spreadsheet) {
  var pricesSheet = bogGetRequiredSheet_(spreadsheet, 'Precios Publicados');
  var data = bogReadSheetAsObjects_(pricesSheet, []);
  var map = {};

  data.rows.forEach(function (row) {
    var rowValues = row.values || [];
    if (!rowValues.length) {
      return;
    }

    var concept = '';
    var amount = null;

    for (var i = 0; i < rowValues.length; i += 1) {
      var value = rowValues[i];
      if (!concept && typeof value === 'string' && bogTrim_(value)) {
        concept = bogTrim_(value);
        continue;
      }
      if (amount === null) {
        try {
          amount = bogNormalizeMoney_(value);
        } catch (err) {
          amount = null;
        }
      }
    }

    if (!concept || amount === null || isNaN(amount)) {
      return;
    }

    map[bogNormalizeTicketConceptKey_(concept)] = amount;
  });

  return map;
}

function bogBuildTicketPriceBreakdown_(order, priceMap) {
  var lines = [];
  lines = lines.concat(bogBuildTicketLinesFromText_(order['Hamburguesas'], 'item', priceMap));
  lines = lines.concat(bogBuildTicketLinesFromText_(order['Extras'], 'extra', priceMap));
  lines = lines.concat(bogBuildTicketLinesFromText_(order['Guarniciones'], 'item', priceMap));
  return lines;
}

function bogBuildTicketLinesFromText_(text, kind, priceMap) {
  var cleaned = bogTrim_(text);
  if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'n/a') {
    return [];
  }

  return cleaned.split(/\s*\+\s*/).map(function (part) {
    var concept = bogTrim_(part);
    if (!concept || concept === '-') {
      return null;
    }

    var quantity = 1;
    var conceptText = concept;
    var qtyMatch = concept.match(/^(\d+)\s*x\s+(.*)$/i);
    if (qtyMatch) {
      quantity = Number(qtyMatch[1]) || 1;
      conceptText = bogTrim_(qtyMatch[2]);
    }

    var amount = bogFindTicketConceptPrice_(conceptText, priceMap);
    return {
      kind: kind,
      concept: kind === 'extra' ? '+ ' + conceptText : (quantity + 'x ' + conceptText),
      amount: amount === null ? null : amount * quantity,
      review: amount === null
    };
  }).filter(function (line) { return !!line; });
}

function bogFindTicketConceptPrice_(concept, priceMap) {
  var exact = priceMap[bogNormalizeTicketConceptKey_(concept)];
  if (typeof exact === 'number' && !isNaN(exact)) {
    return exact;
  }
  return null;
}

function bogNormalizeTicketConceptKey_(text) {
  return bogNormalizeHeaderKey_(text)
    .replace(/^\+\s*/g, '')
    .replace(/^(\d+)\s*x\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
