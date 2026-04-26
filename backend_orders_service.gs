function getChekeoOrdersService_(options){
  const config=options||{};
  const activeOnly=config.activeOnly!==false;
  const ss=getSpreadsheet_();
  const sheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!sheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}". Verifica el nombre de la hoja en el archivo de Google Sheets.`);
  const chekeoColumns=getChekeoColumnMap_(sheet);

  const lastRow=sheet.getLastRow();
  if(lastRow<2)return{orders:[]};

  const values=sheet.getRange(2,1,lastRow-1,chekeoColumns.lastCol).getDisplayValues();
  let orders=values
    .map((row,index)=>mapChekeoRowToOrder_(row,index,chekeoColumns))
    .filter(order=>order.id)
    .sort((a,b)=>a.masterRow-b.masterRow);
  if(activeOnly){
    orders=orders.filter(order=>isActiveKitchenStatus_(order.kitchenStatus));
  }

  return {orders};
}

function getTicketOrderService_(orderId){
  const cleanOrderId=safeTrim_(orderId);
  const allOrdersResult=getChekeoOrdersService_({activeOnly:false});
  const activeOrders=allOrdersResult.orders.filter(order=>isActiveKitchenStatus_(order.kitchenStatus));
  if(!cleanOrderId){
    return {
      order:null,
      orders:activeOrders
    };
  }

  const foundOrder=allOrdersResult.orders.find(order=>order.id===cleanOrderId)||null;
  return {
    order:foundOrder,
    orders:activeOrders
  };
}

function markOrderReadyService_(orderId){
  const cleanOrderId=safeTrim_(orderId);
  if(!cleanOrderId)throw new Error('No se recibió un ID de pedido válido.');

  const lock=LockService.getDocumentLock();
  lock.waitLock(10000);
  try{
    const ss=getSpreadsheet_();
    const sheet=ss.getSheetByName(CHEKEO_SHEET);
    if(!sheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}". Verifica el nombre de la hoja en el archivo de Google Sheets.`);
    const chekeoColumns=getChekeoColumnMap_(sheet);

    const rowNumber=findChekeoRowById_(sheet,cleanOrderId,chekeoColumns);
    if(!rowNumber)throw new Error(`No encontré el pedido ${cleanOrderId} en Chekeo`);

    const now=new Date();
    const startTime=sheet.getRange(rowNumber,chekeoColumns.fields.startTime+1,1,1).getValue();
    const fieldUpdates={
      kitchenStatus:KITCHEN_STATUS.READY,
      readyTime:now,
      updatedAt:now
    };
    if(!startTime){
      fieldUpdates.startTime=now;
    }
    writeChekeoFieldsByRow_(sheet,rowNumber,chekeoColumns,fieldUpdates);

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
  const chekeoColumns=getChekeoColumnMap_(sheet);

  const lastRow=sheet.getLastRow();
  const statusValues=lastRow>=2?sheet.getRange(2,chekeoColumns.fields.kitchenStatus+1,lastRow-1,1).getDisplayValues().flat():[];
  const activeCount=statusValues.filter(value=>isActiveKitchenStatus_(value)).length;
  ui.alert('Diagnóstico Chekeo',`Hoja: ${CHEKEO_SHEET}\nFilas con datos: ${Math.max(lastRow-1,0)}\nÓrdenes activas detectadas: ${activeCount}`,ui.ButtonSet.OK);
}

function mapChekeoRowToOrder_(row,index,chekeoColumns){
  const masterRow=Number(row[chekeoColumns.fields.masterRow])||(index+2);
  return {
    id:safeTrim_(row[chekeoColumns.fields.id])||buildOrderId_(masterRow),
    masterRow,
    name:safeTrim_(row[chekeoColumns.fields.name]),
    phone:safeTrim_(row[chekeoColumns.fields.phone]),
    qtyOg:Number(row[chekeoColumns.fields.qtyOg])||0,
    qtyBbq:Number(row[chekeoColumns.fields.qtyBbq])||0,
    burgerSummary:safeTrim_(row[chekeoColumns.fields.burgerSummary]),
    exactOrderText:safeTrim_(row[chekeoColumns.fields.exactOrderText]),
    extras:safeTrim_(row[chekeoColumns.fields.extras]),
    sides:safeTrim_(row[chekeoColumns.fields.sides]),
    totalDisplay:safeTrim_(row[chekeoColumns.fields.total]),
    payment:safeTrim_(row[chekeoColumns.fields.payment]),
    confirmed:safeTrim_(row[chekeoColumns.fields.confirmed]),
    paid:safeTrim_(row[chekeoColumns.fields.paid]),
    kitchenStatus:normalizeKitchenStatus_(row[chekeoColumns.fields.kitchenStatus]),
    specialCase:isManualFlag_(row[chekeoColumns.fields.specialCase]),
    manualReview:isManualFlag_(row[chekeoColumns.fields.manualReview]),
    ticketSent:chekeoColumns.fields.ticketSent>=0?isManualFlag_(row[chekeoColumns.fields.ticketSent]):false,
    ticketSentAt:chekeoColumns.fields.ticketSentAt>=0?safeTrim_(row[chekeoColumns.fields.ticketSentAt]):'',
    sideReady:chekeoColumns.fields.sideReady>=0?isManualFlag_(row[chekeoColumns.fields.sideReady]):false,
    sideReadyAt:chekeoColumns.fields.sideReadyAt>=0?safeTrim_(row[chekeoColumns.fields.sideReadyAt]):''
  };
}

function markTicketSentService_(orderId){
  return markOrderFlagService_(orderId,{
    actionLabel:'marcar ticket como enviado',
    flagField:'ticketSent',
    dateField:'ticketSentAt',
    successMessage:'Ticket marcado como enviado'
  });
}

function markSideReadyService_(orderId){
  return markOrderFlagService_(orderId,{
    actionLabel:'marcar guarnición como lista',
    flagField:'sideReady',
    dateField:'sideReadyAt',
    successMessage:'Guarnición marcada como lista'
  });
}

function markOrderFlagService_(orderId,config){
  const cleanOrderId=safeTrim_(orderId);
  if(!cleanOrderId)throw new Error('No se recibió un ID de pedido válido.');

  const lock=LockService.getDocumentLock();
  lock.waitLock(10000);
  try{
    const ss=getSpreadsheet_();
    const sheet=ss.getSheetByName(CHEKEO_SHEET);
    if(!sheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}". Verifica el nombre de la hoja en el archivo de Google Sheets.`);
    const chekeoColumns=getChekeoColumnMap_(sheet);
    requireChekeoOptionalField_(config.flagField,chekeoColumns);
    requireChekeoOptionalField_(config.dateField,chekeoColumns);

    const rowNumber=findChekeoRowById_(sheet,cleanOrderId,chekeoColumns);
    if(!rowNumber)throw new Error(`No encontré el pedido ${cleanOrderId} en ${CHEKEO_SHEET}.`);

    const now=new Date();
    const fieldUpdates={updatedAt:now};
    fieldUpdates[config.flagField]='Si';
    fieldUpdates[config.dateField]=now;
    writeChekeoFieldsByRow_(sheet,rowNumber,chekeoColumns,fieldUpdates);

    return {
      ok:true,
      orderId:cleanOrderId,
      message:config.successMessage,
      updatedAt:formatUiDateTime_(now)
    };
  }finally{
    lock.releaseLock();
  }
}

function isManualFlag_(rawValue){
  const value=safeTrim_(rawValue).toUpperCase();
  return value==='SI'||value==='TRUE'||value==='1';
}
