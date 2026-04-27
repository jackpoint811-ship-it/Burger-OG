var BurgerOGConstants = (function () {
  var SHEETS = {
    PEDIDOS_MASTER: 'Pedidos Master',
    CHEKEO_NUEVO: 'Chekeo Nuevo',
    CONFIGURACION: 'Configuración'
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
    ENUMS: ENUMS,
    DEFAULTS: DEFAULTS,
    SPECIAL_FLAGS_REGEX: /(\(\+1\)|Chequeo Manual)/i
  };
})();
