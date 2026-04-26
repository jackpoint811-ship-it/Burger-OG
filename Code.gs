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
  const html=renderModuleMenu_('dialog').setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModelessDialog(html,'Burgers OG');
}

function showChekeoApp(){
  const html=HtmlService.createHtmlOutputFromFile('Cocina').setWidth(460).setHeight(780);
  SpreadsheetApp.getUi().showModelessDialog(html,'Chekeo');
}

function showClientTicketsApp(){
  const html=HtmlService.createHtmlOutputFromFile('Ticket').setWidth(460).setHeight(860);
  SpreadsheetApp.getUi().showModelessDialog(html,'Tickets cliente');
}

function doGet(e){
  const app=safeTrim_(e&&e.parameter&&e.parameter.app).toLowerCase();
  const legacyView=safeTrim_(e&&e.parameter&&e.parameter.view).toLowerCase();
  const route=app||legacyView;
  const fileName=route==='ticket'||route==='tickets'||route==='recibo'
    ? 'Ticket'
    : (route==='cocina'||route==='kitchen'||route==='chekeo'||route==='check'
      ? 'Cocina'
      : '');

  const title=fileName==='Ticket'
    ? 'Ticket cliente'
    : (fileName==='Cocina' ? 'Cocina / Chekeo' : 'Burgers OG');

  try{
    if(!fileName){
      return renderModuleMenu_('web').setTitle(title);
    }

    return HtmlService
      .createHtmlOutputFromFile(fileName)
      .setTitle(title);
  }catch(error){
    return renderDoGetError_(route,fileName,error).setTitle('Burgers OG - Error');
  }
}

function renderModuleMenu_(appMode){
  const template=HtmlService.createTemplateFromFile('module_menu');
  template.appMode=safeTrim_(appMode).toLowerCase()==='dialog'?'dialog':'web';
  return template.evaluate();
}

function renderDoGetError_(view,fileName,error){
  const requestedView=escapeHtml_(safeTrim_(view)||'(sin view)');
  const attemptedFile=escapeHtml_(safeTrim_(fileName)||'module_menu');
  const message=escapeHtml_(safeTrim_(error&&error.message)||String(error||'Error desconocido'));
  const html=
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<style>body{font-family:Arial,sans-serif;background:#111827;color:#f8fafc;margin:0;padding:20px}'+
    '.card{max-width:760px;margin:0 auto;background:#1f2937;border:1px solid #374151;border-radius:12px;padding:16px}'+
    'h1{margin:0 0 8px;font-size:20px}.meta{color:#cbd5e1;font-size:14px;line-height:1.5}.err{margin-top:10px;color:#fecaca;white-space:pre-wrap}</style>'+
    '</head><body><main class="card"><h1>Error al cargar la vista</h1>'+
    `<div class="meta">Vista solicitada: <strong>${requestedView}</strong><br>Archivo intentado: <strong>${attemptedFile}</strong></div>`+
    `<div class="err">Detalle: ${message}</div>`+
    '</main></body></html>';
  return HtmlService.createHtmlOutput(html);
}

function escapeHtml_(value){
  return String(value===null||value===undefined?'':value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function syncChekeoFromMaster(){
  return syncChekeoFromMasterService_();
}

function getChekeoOrders(){
  return getChekeoOrdersService_();
}

function getCocinaOrders(){
  return getChekeoOrdersService_();
}

function getTicketOrder(orderId){
  return getTicketOrderService_(orderId);
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
