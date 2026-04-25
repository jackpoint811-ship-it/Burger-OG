function onOpen(){
  SpreadsheetApp
    .getUi()
    .createMenu('M Tools')
    .addItem('Sync Chekeo','syncChekeoFromMaster')
    .addSeparator()
    .addItem('Open Chekeo App','showChekeoApp')
    .addItem('Open Tickets Cliente','showClientTicketsApp')
    .addItem('Diagnosticar permisos','diagnoseChekeoPermissions')
    .addToUi();
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
  const fileName=view==='tickets'?'client_tickets':'burger';
  const title=view==='tickets'?'Tickets cliente':'Chekeo';
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
