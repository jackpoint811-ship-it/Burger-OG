function getChekeoOrdersService_(){
  const ss=getSpreadsheet_();
  const sheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!sheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

  const lastRow=sheet.getLastRow();
  if(lastRow<2)return{orders:[]};

  const values=sheet.getRange(2,1,lastRow-1,22).getDisplayValues();
  const orders=values
    .map((row,index)=>mapChekeoRowToOrder_(row,index))
    .filter(order=>order.id)
    .filter(order=>isActiveKitchenStatus_(order.kitchenStatus))
    .sort((a,b)=>a.masterRow-b.masterRow);

  return {orders};
}

function markOrderReadyService_(orderId){
  const cleanOrderId=safeTrim_(orderId);
  if(!cleanOrderId)throw new Error('No se recibió un ID de pedido válido.');

  const lock=LockService.getDocumentLock();
  lock.waitLock(10000);
  try{
    const ss=getSpreadsheet_();
    const sheet=ss.getSheetByName(CHEKEO_SHEET);
    if(!sheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

    const rowNumber=findChekeoRowById_(sheet,cleanOrderId);
    if(!rowNumber)throw new Error(`No encontré el pedido ${cleanOrderId} en Chekeo`);

    const rowValues=sheet.getRange(rowNumber,1,1,22).getValues()[0];
    const now=new Date();
    const startTime=rowValues[CHEKEO.startTime];

    sheet.getRange(rowNumber,CHEKEO.kitchenStatus+1).setValue(KITCHEN_STATUS.READY);
    if(!startTime){
      sheet.getRange(rowNumber,CHEKEO.startTime+1).setValue(now);
    }
    sheet.getRange(rowNumber,CHEKEO.readyTime+1).setValue(now);
    sheet.getRange(rowNumber,CHEKEO.updatedAt+1).setValue(now);

    return {ok:true,orderId:cleanOrderId,newStatus:KITCHEN_STATUS.READY,updatedAt:formatUiDateTime_(now)};
  }finally{
    lock.releaseLock();
  }
}

function diagnoseChekeoPermissionsService_(){
  const ui=SpreadsheetApp.getUi();
  const ss=getSpreadsheet_();
  const sheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!sheet){
    ui.alert('Diagnóstico Chekeo',`No existe la hoja "${CHEKEO_SHEET}".`,ui.ButtonSet.OK);
    return;
  }

  const lastRow=sheet.getLastRow();
  const statusValues=lastRow>=2?sheet.getRange(2,CHEKEO.kitchenStatus+1,lastRow-1,1).getDisplayValues().flat():[];
  const activeCount=statusValues.filter(value=>isActiveKitchenStatus_(value)).length;
  ui.alert('Diagnóstico Chekeo',`Hoja: ${CHEKEO_SHEET}\nFilas con datos: ${Math.max(lastRow-1,0)}\nÓrdenes activas detectadas: ${activeCount}`,ui.ButtonSet.OK);
}

function mapChekeoRowToOrder_(row,index){
  const masterRow=Number(row[CHEKEO.masterRow])||(index+2);
  return {
    id:safeTrim_(row[CHEKEO.id])||buildOrderId_(masterRow),
    masterRow,
    name:safeTrim_(row[CHEKEO.name]),
    phone:safeTrim_(row[CHEKEO.phone]),
    qtyOg:Number(row[CHEKEO.qtyOg])||0,
    qtyBbq:Number(row[CHEKEO.qtyBbq])||0,
    burgerSummary:safeTrim_(row[CHEKEO.burgerSummary]),
    exactOrderText:safeTrim_(row[CHEKEO.exactOrderText]),
    extras:safeTrim_(row[CHEKEO.extras]),
    sides:safeTrim_(row[CHEKEO.sides]),
    totalDisplay:safeTrim_(row[CHEKEO.total]),
    payment:safeTrim_(row[CHEKEO.payment]),
    confirmed:safeTrim_(row[CHEKEO.confirmed]),
    paid:safeTrim_(row[CHEKEO.paid]),
    kitchenStatus:normalizeKitchenStatus_(row[CHEKEO.kitchenStatus]),
    specialCase:isManualFlag_(row[CHEKEO.specialCase]),
    manualReview:isManualFlag_(row[CHEKEO.manualReview])
  };
}

function isManualFlag_(rawValue){
  const value=safeTrim_(rawValue).toUpperCase();
  return value==='SI'||value==='TRUE'||value==='1';
}
