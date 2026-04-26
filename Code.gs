function onOpen(){
  SpreadsheetApp
    .getUi()
    .createMenu('M Tools')
    .addItem('Sync Chekeo','syncChekeoFromMaster')
    .addSeparator()
    .addItem('Open Burgers OG','showModuleMenu')
    .addItem('Open Chekeo App','showChekeoApp')
    .addItem('Open Tickets Cliente','showClientTicketsApp')
    .addItem('Diagnosticar permisos','diagnoseChekeoPermissions')
    .addItem('Diagnosticar Schema Chekeo','diagnoseChekeoSchema')
    .addItem('Diagnosticar Schemas (Master + Chekeo)','diagnoseSchemas')
    .addItem('Agregar Columnas Opcionales Chekeo','setupChekeoOptionalColumns')
    .addToUi();
}

function showModuleMenu(){
  const html=HtmlService.createHtmlOutputFromFile('module_menu').setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModelessDialog(html,'Burgers OG');
}

function showChekeoApp(){
  const html=HtmlService.createHtmlOutputFromFile('burger').setWidth(460).setHeight(780);
  SpreadsheetApp.getUi().showModelessDialog(html,'Chekeo');
}

function showClientTicketsApp(){
  const html=HtmlService.createHtmlOutputFromFile('client_tickets').setWidth(460).setHeight(860);
  SpreadsheetApp.getUi().showModelessDialog(html,'Tickets cliente');
}

function doGet(e){
  const view=safeTrim_(e&&e.parameter&&e.parameter.view).toLowerCase();
  const fileName=view==='tickets'
    ? 'client_tickets'
    : (view==='cocina'||view==='kitchen'||view==='chekeo' ? 'burger' : 'module_menu');

  const title=view==='tickets'
    ? 'Tickets cliente'
    : (fileName==='burger' ? 'Chekeo' : 'Burgers OG');

  return HtmlService
    .createHtmlOutputFromFile(fileName)
    .setTitle(title);
}

function syncChekeoFromMaster(){
  return syncChekeoFromMasterService_();
}

function getChekeoOrders(){
  return getChekeoOrdersService_();
}

function diagnoseChekeoPermissions(){
  return diagnoseChekeoPermissionsService_();
}

function markOrderReady(orderId){
  return markOrderReadyService_(orderId);
}

function markTicketSent(orderId){
  return markTicketSentService_(orderId);
}

function markSideReady(orderId){
  return markSideReadyService_(orderId);
}

function diagnoseChekeoSchema(){
  return diagnoseChekeoSchemaService_();
}

function setupChekeoOptionalColumns(){
  return setupChekeoOptionalColumnsService_();
}

function diagnoseSchemas(){
  return diagnoseSchemasService_();
}
