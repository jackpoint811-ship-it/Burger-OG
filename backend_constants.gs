const MASTER_SHEET='Pedidos Master';
const CHEKEO_SHEET='Chekeo';
const TIME_ZONE='America/Mexico_City';
const SPREADSHEET_ID=(PropertiesService.getScriptProperties().getProperty('CHEKEO_SPREADSHEET_ID')||'').trim();
const KITCHEN_STATUS={PENDING:'PENDIENTE',IN_PREP:'EN PREP',READY:'LISTO',DELIVERED:'ENTREGADO',CANCELED:'CANCELADO'};
const MASTER={timestamp:0,qtyOg:1,qtyBbq:2,specialFlag:3,exactOrderText:4,ogText:7,bbqText:8,extraPickles:9,extraAmerican:10,extraManchego:11,extraBacon:12,extraKetchup:13,extraMustard:14,extraTomato:15,sideFriesOg:16,sideFriesEspeciales:17,sideFriesLemon:18,sideOnionRings:19,customerName:20,phone:21,paymentMethod:22,total:23,manualTotal:24,notes:25,confirmed:26,paid:27};
const CHEKEO={id:0,masterRow:1,orderDateTime:2,orderDate:3,name:4,phone:5,qtyOg:6,qtyBbq:7,burgerSummary:8,exactOrderText:9,extras:10,sides:11,total:12,payment:13,confirmed:14,paid:15,kitchenStatus:16,startTime:17,readyTime:18,updatedAt:19,specialCase:20,manualReview:21};
