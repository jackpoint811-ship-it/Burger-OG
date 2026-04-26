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

function getAppOrdersService_(){
  const result=getChekeoOrdersService_({activeOnly:false});
  return {orders:result.orders};
}

function getOrderDetailService_(orderId){
  const cleanOrderId=safeTrim_(orderId);
  if(!cleanOrderId)throw new Error('No se recibió un ID de pedido válido.');
  const result=getChekeoOrdersService_({activeOnly:false});
  const order=result.orders.find(item=>item.id===cleanOrderId);
  if(!order)throw new Error(`No encontré el pedido ${cleanOrderId} en ${CHEKEO_SHEET}.`);
  return {order};
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
  return updateOrderStatusService_(orderId,APP_ORDER_STATUS.READY);
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
  const orderStatus=normalizeOrderStatus_(readByIndex_(row,chekeoColumns.fields.orderStatus)||readByIndex_(row,chekeoColumns.fields.kitchenStatus));
  const paymentStatus=normalizePaymentStatus_(readByIndex_(row,chekeoColumns.fields.paymentStatus)||readByIndex_(row,chekeoColumns.fields.paid));
  const paymentMethod=normalizePaymentMethod_(readByIndex_(row,chekeoColumns.fields.paymentMethod)||readByIndex_(row,chekeoColumns.fields.payment));
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
    paymentMethod,
    paymentStatus,
    orderStatus,
    confirmed:safeTrim_(row[chekeoColumns.fields.confirmed]),
    paid:safeTrim_(row[chekeoColumns.fields.paid]),
    kitchenStatus:normalizeKitchenStatus_(row[chekeoColumns.fields.kitchenStatus]),
    specialCase:isManualFlag_(row[chekeoColumns.fields.specialCase]),
    manualReview:isManualFlag_(row[chekeoColumns.fields.manualReview]),
    ticketSent:chekeoColumns.fields.ticketSent>=0?isManualFlag_(row[chekeoColumns.fields.ticketSent]):false,
    ticketSentAt:chekeoColumns.fields.ticketSentAt>=0?safeTrim_(row[chekeoColumns.fields.ticketSentAt]):'',
    sideReady:chekeoColumns.fields.sideReady>=0?isManualFlag_(row[chekeoColumns.fields.sideReady]):false,
    sideReadyAt:chekeoColumns.fields.sideReadyAt>=0?safeTrim_(row[chekeoColumns.fields.sideReadyAt]):'',
    noteInternal:chekeoColumns.fields.noteInternal>=0?safeTrim_(row[chekeoColumns.fields.noteInternal]):'',
    noteClient:chekeoColumns.fields.noteClient>=0?safeTrim_(row[chekeoColumns.fields.noteClient]):'',
    alert:chekeoColumns.fields.alert>=0?safeTrim_(row[chekeoColumns.fields.alert]):''
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

function updateOrderStatusService_(orderId,status){
  const normalizedStatus=assertValidOrderStatus_(status);
  const now=new Date();
  return updateOrderWithLock_(orderId,(sheet,rowNumber,chekeoColumns)=>{
    const updates={
      updatedAt:now,
      kitchenStatus:mapOrderStatusToKitchenStatus_(normalizedStatus)
    };
    if(chekeoColumns.fields.orderStatus>=0)updates.orderStatus=normalizedStatus;
    if(normalizedStatus===APP_ORDER_STATUS.PREPARING){
      const currentStart=sheet.getRange(rowNumber,chekeoColumns.fields.startTime+1,1,1).getValue();
      if(!currentStart)updates.startTime=now;
    }
    if(normalizedStatus===APP_ORDER_STATUS.READY){
      updates.readyTime=now;
    }
    writeChekeoFieldsByRow_(sheet,rowNumber,chekeoColumns,updates);
    return {ok:true,orderId,newStatus:normalizedStatus,updatedAt:formatUiDateTime_(now)};
  });
}

function markOrderPaidService_(orderId){
  const now=new Date();
  return updateOrderWithLock_(orderId,(sheet,rowNumber,chekeoColumns)=>{
    const updates={updatedAt:now,paid:'Si'};
    if(chekeoColumns.fields.paymentStatus>=0)updates.paymentStatus=APP_PAYMENT_STATUS.PAID;
    writeChekeoFieldsByRow_(sheet,rowNumber,chekeoColumns,updates);
    return {ok:true,orderId,paymentStatus:APP_PAYMENT_STATUS.PAID,updatedAt:formatUiDateTime_(now)};
  });
}

function updateOrderNotesService_(orderId,noteInternal,noteClient){
  const now=new Date();
  return updateOrderWithLock_(orderId,(sheet,rowNumber,chekeoColumns)=>{
    requireChekeoOptionalField_('noteInternal',chekeoColumns);
    requireChekeoOptionalField_('noteClient',chekeoColumns);
    const updates={updatedAt:now};
    updates.noteInternal=safeTrim_(noteInternal);
    updates.noteClient=safeTrim_(noteClient);
    writeChekeoFieldsByRow_(sheet,rowNumber,chekeoColumns,updates);
    return {ok:true,orderId,updatedAt:formatUiDateTime_(now)};
  });
}

function getDailySummaryService_(){
  const result=getChekeoOrdersService_({activeOnly:false});
  const summary=result.orders.reduce((acc,order)=>{
    const total=Number(String(order.totalDisplay||'').replace(/[^0-9.-]/g,''))||0;
    acc.sold+=total;
    if(order.paymentStatus===APP_PAYMENT_STATUS.PAID){
      acc.paid+=total;
    }else{
      acc.pending+=total;
    }
    return acc;
  },{sold:0,paid:0,pending:0});
  return summary;
}

function getBankConfigService_(){
  const ss=getSpreadsheet_();
  const sheet=ss.getSheetByName(CONFIG_SHEET);
  if(!sheet)throw new Error(`No existe la hoja "${CONFIG_SHEET}".`);
  const values=sheet.getDataRange().getDisplayValues();
  const map={};
  values.forEach(row=>{
    const key=normalizeHeader_(row[0]);
    if(!key)return;
    map[key]=safeTrim_(row[1]);
  });
  return {
    bank:map.banco||'',
    accountName:map.nombre||map.nombrecuenta||'',
    accountNumber:map.numero||map.numerodecuenta||map.cuenta||''
  };
}

function updateOrderWithLock_(orderId,callback){
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
    if(!rowNumber)throw new Error(`No encontré el pedido ${cleanOrderId} en ${CHEKEO_SHEET}.`);
    return callback(sheet,rowNumber,chekeoColumns);
  }finally{
    lock.releaseLock();
  }
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
