const MASTER_SHEET='Pedidos Master';
const CHEKEO_SHEET='Chekeo';
const TIME_ZONE='America/Mexico_City';
const SPREADSHEET_ID=(PropertiesService.getScriptProperties().getProperty('CHEKEO_SPREADSHEET_ID')||'').trim();
const KITCHEN_STATUS={PENDING:'PENDIENTE',IN_PREP:'EN PREP',READY:'LISTO',DELIVERED:'ENTREGADO',CANCELED:'CANCELADO'};
const CHEKEO={id:0,masterRow:1,orderDateTime:2,orderDate:3,name:4,phone:5,qtyOg:6,qtyBbq:7,burgerSummary:8,exactOrderText:9,extras:10,sides:11,total:12,payment:13,confirmed:14,paid:15,kitchenStatus:16,startTime:17,readyTime:18,updatedAt:19,specialCase:20,manualReview:21};
