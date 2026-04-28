var BurgerOGConstants = (function () {
  var SHEETS = {
    MASTER_SHEET_NAME: 'Pedidos Master',
    CHEKEO_ACTIVE_SHEET_NAME: 'Chekeo Nuevo',
    CHEKEO_PRODUCTION_SHEET_NAME: 'Chekeo',
    CONFIG_SHEET_NAME: 'Configuración',
    SUMMARY_SHEET_NAME: 'Resumen Pedidos',
    HISTORY_SHEET_NAME: 'Historico'
  };

  var CHEKEO_COLUMNS = [
    'ID Pedido',
    'Fila Master',
    'Fecha Pedido',
    'Hora Pedido',
    'Nombre',
    'Teléfono',
    'Resumen Pedido',
    'Hamburguesas',
    'Extras',
    'Guarniciones',
    'Total',
    'Estado Pedido',
    'Estado Pago',
    'Método Pago',
    'Nota Interna',
    'Nota Cliente',
    'Alerta',
    'Ticket Enviado',
    'Fecha Ticket Enviado',
    'Hora Inicio',
    'Hora Listo',
    'Última Actualización'
  ];

  var MASTER_REQUIRED_COLUMNS = [
    'Marca temporal',
    'Nombre'
  ];

  var CHEKEO_REQUIRED_COLUMNS = CHEKEO_COLUMNS.slice();


  var HISTORY_EXTRA_COLUMNS = [
    'Fecha Archivo',
    'Motivo Archivo'
  ];

  var HISTORY_COLUMNS = CHEKEO_COLUMNS.concat(HISTORY_EXTRA_COLUMNS);

  var SUMMARY_COLUMNS = [
    'Fecha',
    'Pedidos Archivados',
    'Total Archivado',
    'Total Pagado Archivado',
    'Total Pendiente Archivado',
    'Conteo Estado Pedido',
    'Conteo Estado Pago',
    'Generado En'
  ];

  var ENUMS = {
    ESTADO_PEDIDO: ['Nuevo', 'Confirmado', 'Preparando', 'Listo'],
    ESTADO_PAGO: ['Pendiente', 'Pagado'],
    METODO_PAGO: ['Efectivo', 'Transferencia', 'Mixto', 'No definido'],
    TICKET_ENVIADO: ['Si', 'No']
  };

  var DEFAULTS = {
    ESTADO_PEDIDO: 'Nuevo',
    ESTADO_PAGO: 'Pendiente',
    METODO_PAGO: 'No definido',
    TICKET_ENVIADO: 'No'
  };

  return {
    SHEETS: SHEETS,
    CHEKEO_COLUMNS: CHEKEO_COLUMNS,
    MASTER_REQUIRED_COLUMNS: MASTER_REQUIRED_COLUMNS,
    CHEKEO_REQUIRED_COLUMNS: CHEKEO_REQUIRED_COLUMNS,
    HISTORY_EXTRA_COLUMNS: HISTORY_EXTRA_COLUMNS,
    HISTORY_COLUMNS: HISTORY_COLUMNS,
    SUMMARY_COLUMNS: SUMMARY_COLUMNS,
    ENUMS: ENUMS,
    DEFAULTS: DEFAULTS,
    SPECIAL_FLAGS_REGEX: /(\(\+1\)|Chequeo Manual)/i
  };
})();
