function bogValidateChekeoRecord_(record) {
  var errors = [];

  if (!/^BOG-\d{3,}$/.test(bogTrim_(record['ID Pedido']))) {
    errors.push('ID Pedido inválido.');
  }

  if (!/^\d+$/.test(bogTrim_(record['Fila Master']))) {
    errors.push('Fila Master debe ser numérico.');
  }

  if (
    record['Alerta'] !== '' &&
    record['Alerta'] !== '⚠️'
  ) {
    errors.push('Alerta solo admite vacío o ⚠️.');
  }

  if (BurgerOGConstants.ENUMS.ESTADO_PEDIDO.indexOf(record['Estado Pedido']) === -1) {
    errors.push('Estado Pedido fuera de catálogo.');
  }

  if (BurgerOGConstants.ENUMS.ESTADO_PAGO.indexOf(record['Estado Pago']) === -1) {
    errors.push('Estado Pago fuera de catálogo.');
  }

  if (BurgerOGConstants.ENUMS.METODO_PAGO.indexOf(record['Método Pago']) === -1) {
    errors.push('Método Pago fuera de catálogo.');
  }

  if (BurgerOGConstants.ENUMS.TICKET_ENVIADO.indexOf(record['Ticket Enviado']) === -1) {
    errors.push('Ticket Enviado fuera de catálogo.');
  }

  if (record['Ticket Enviado'] === 'Si' && bogTrim_(record['Fecha Ticket Enviado']) === '') {
    errors.push('Si Ticket Enviado = Si, Fecha Ticket Enviado es obligatoria.');
  }

  if (Number(record.Total) < 0 || isNaN(Number(record.Total))) {
    errors.push('Total debe ser numérico >= 0.');
  }

  return errors;
}

function bogRequiresAlert_(record) {
  var fieldsToScan = [
    record['Resumen Pedido'],
    record.Hamburguesas,
    record.Extras,
    record.Guarniciones
  ];

  return fieldsToScan.some(function (value) {
    return BurgerOGConstants.SPECIAL_FLAGS_REGEX.test(String(value || ''));
  });
}
