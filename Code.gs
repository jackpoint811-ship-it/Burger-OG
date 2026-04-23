function onOpen(){
  SpreadsheetApp
    .getUi()
    .createMenu('M Tools')
    .addItem('Sync Chekeo','syncChekeoFromMaster')
    .addSeparator()
    .addItem('Open Chekeo App','showChekeoApp')
    .addItem('Diagnosticar permisos','diagnoseChekeoPermissions')
    .addToUi();
}

function showChekeoApp(){
  const html=HtmlService.createHtmlOutputFromFile('burger').setWidth(460).setHeight(780);
  SpreadsheetApp.getUi().showModelessDialog(html,'Chekeo');
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
