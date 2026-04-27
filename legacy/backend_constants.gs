const MASTER_SHEET='Pedidos Master';
const CHEKEO_SHEET='Chekeo';
const TIME_ZONE='America/Mexico_City';
const SPREADSHEET_ID=(PropertiesService.getScriptProperties().getProperty('CHEKEO_SPREADSHEET_ID')||'').trim();
const KITCHEN_STATUS={PENDING:'PENDIENTE',IN_PREP:'EN PREP',READY:'LISTO',DELIVERED:'ENTREGADO',CANCELED:'CANCELADO'};
const CHEKEO={id:0,masterRow:1,orderDateTime:2,orderDate:3,name:4,phone:5,qtyOg:6,qtyBbq:7,burgerSummary:8,exactOrderText:9,extras:10,sides:11,total:12,payment:13,confirmed:14,paid:15,kitchenStatus:16,startTime:17,readyTime:18,updatedAt:19,specialCase:20,manualReview:21};
const CHEKEO_BASE_COLUMN_COUNT=22;
const CHEKEO_OPTIONAL_FIELDS=['ticketSent','ticketSentAt','sideReady','sideReadyAt'];
const CHEKEO_REQUIRED_FIELDS=[
  'id','masterRow','orderDateTime','orderDate','name','phone','qtyOg','qtyBbq','burgerSummary','exactOrderText',
  'extras','sides','total','payment','confirmed','paid','kitchenStatus','startTime','readyTime','updatedAt','specialCase','manualReview'
];
const CHEKEO_FIELD_ALIASES={
  id:['ID','Order ID','Pedido ID','Folio','id'],
  masterRow:['Master Row','Fila Master','Fila origen','masterRow'],
  orderDateTime:['Order DateTime','Fecha Hora Pedido','Fecha y hora','Timestamp','orderDateTime'],
  orderDate:['Order Date','Fecha Pedido','Fecha','orderDate'],
  name:['Nombre','Cliente','Customer Name','name'],
  phone:['Teléfono','Telefono','Celular','Phone','phone'],
  qtyOg:['Qty OG','Cantidad OG','OG','qtyOg'],
  qtyBbq:['Qty BBQ','Cantidad BBQ','BBQ','qtyBbq'],
  burgerSummary:['Burger Summary','Resumen Burgers','Resumen','burgerSummary'],
  exactOrderText:['Exact Order Text','Pedido Exacto','Texto exacto','exactOrderText'],
  extras:['Extras','extras'],
  sides:['Sides','Guarniciones','Guarnición','sides'],
  total:['Total','Monto','total'],
  payment:['Payment','Forma de pago','Pago','payment'],
  confirmed:['Confirmado','Confirmed','confirmed'],
  paid:['Pagado','Pagado?','Paid','paid'],
  kitchenStatus:['Kitchen Status','Estado Cocina','Estado','kitchenStatus'],
  startTime:['Start Time','Hora Inicio','Inicio','startTime'],
  readyTime:['Ready Time','Hora Listo','Listo','readyTime'],
  updatedAt:['Updated At','Actualizado','updatedAt'],
  specialCase:['Special Case','Caso especial','specialCase'],
  manualReview:['Manual Review','Revisión manual','manualReview'],
  ticketSent:['Ticket Enviado','Ticket enviado','Enviado','ticketSent'],
  ticketSentAt:['Fecha Ticket Enviado','Fecha enviado','ticketSentAt'],
  sideReady:['Guarnición Lista','Guarnicion Lista','Side Ready','sideReady'],
  sideReadyAt:['Fecha Guarnición Lista','Fecha Guarnicion Lista','Fecha Side Ready','sideReadyAt']
};
