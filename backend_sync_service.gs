function syncChekeoFromMasterService_(){
  return syncAppOrdersFromMasterService_();
}

function syncAppOrdersFromMasterService_(){
  const ss=getSpreadsheet_();
  const masterSheet=ss.getSheetByName(MASTER_SHEET);
  const chekeoSheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!masterSheet)throw new Error(`No existe la hoja "${MASTER_SHEET}"`);
  if(!chekeoSheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

  const masterColumns=getMasterColumnMap_(masterSheet);
  const chekeoColumns=getChekeoColumnMap_(chekeoSheet);
  const masterLastRow=masterSheet.getLastRow();
  const masterLastCol=masterSheet.getLastColumn();
  if(masterLastRow<2){
    clearChekeoBody_(chekeoSheet,chekeoColumns);
    return;
  }

  const masterValues=masterSheet.getRange(2,1,masterLastRow-1,masterLastCol).getValues();
  const chekeoLastRow=chekeoSheet.getLastRow();
  const existingRows=chekeoLastRow>=2?chekeoSheet.getRange(2,1,chekeoLastRow-1,chekeoColumns.lastCol).getValues():[];
  const existingById=buildExistingChekeoMap_(existingRows,chekeoColumns);

  const output=[];
  const syncedIds={};
  const skippedByMissingTimestamp=[];
  const skippedByMissingFields=[];
  masterValues.forEach((row,i)=>{
    const masterRowNumber=i+2;
    const id=buildOrderId_(masterRowNumber);
    if(!getMasterValue_(row,masterColumns.fields.timestamp)){
      skippedByMissingTimestamp.push(masterRowNumber);
      return;
    }

    const missingFields=getMissingRequiredMasterValues_(row,masterColumns);
    if(missingFields.length){
      skippedByMissingFields.push({row:masterRowNumber,fields:missingFields});
      return;
    }

    const specialCase=isSpecialCase_(row,masterColumns);
    const preserved=existingById[id]||{};
    const syncRow=new Array(chekeoColumns.lastCol).fill('');
    const orderDateTime=normalizeDateValue_(getMasterValue_(row,masterColumns.fields.timestamp));
    const orderDate=extractOnlyDate_(orderDateTime);
    const normalTotal=getMasterValue_(row,masterColumns.fields.total)||'';
    const manualTotal=getMasterValue_(row,masterColumns.fields.manualTotal)||'';

    syncRow[chekeoColumns.fields.id]=id;
    syncRow[chekeoColumns.fields.masterRow]=masterRowNumber;
    syncRow[chekeoColumns.fields.orderDateTime]=orderDateTime||'';
    syncRow[chekeoColumns.fields.orderDate]=orderDate||'';
    syncRow[chekeoColumns.fields.name]=safeTrim_(getMasterValue_(row,masterColumns.fields.customerName));
    syncRow[chekeoColumns.fields.phone]=safeTrim_(getMasterValue_(row,masterColumns.fields.phone));
    syncRow[chekeoColumns.fields.qtyOg]=getBurgerQtyByName_(row,masterColumns,'OG');
    syncRow[chekeoColumns.fields.qtyBbq]=getBurgerQtyByName_(row,masterColumns,'BBQ');
    syncRow[chekeoColumns.fields.burgerSummary]=specialCase?'PEDIDO ESPECIAL':buildBurgerSummary_(row,masterColumns);
    syncRow[chekeoColumns.fields.exactOrderText]=specialCase?buildSpecialOrderText_(row,masterColumns):'';
    syncRow[chekeoColumns.fields.extras]=specialCase?'':buildExtras_(row,masterColumns);
    syncRow[chekeoColumns.fields.sides]=buildSides_(row,masterColumns);
    syncRow[chekeoColumns.fields.total]=specialCase&&manualTotal?manualTotal:normalTotal;
    syncRow[chekeoColumns.fields.payment]=safeTrim_(getMasterValue_(row,masterColumns.fields.paymentMethod));
    syncRow[chekeoColumns.fields.confirmed]=normalizeYesNo_(getMasterValue_(row,masterColumns.fields.confirmed));
    syncRow[chekeoColumns.fields.paid]=normalizeYesNo_(getMasterValue_(row,masterColumns.fields.paid));
    syncRow[chekeoColumns.fields.kitchenStatus]=normalizeKitchenStatus_(preserved.kitchenStatus||KITCHEN_STATUS.PENDING);
    if(chekeoColumns.fields.orderStatus>=0){
      syncRow[chekeoColumns.fields.orderStatus]=normalizeOrderStatus_(preserved.orderStatus||APP_ORDER_STATUS.NEW);
    }
    if(chekeoColumns.fields.paymentStatus>=0){
      syncRow[chekeoColumns.fields.paymentStatus]=normalizePaymentStatus_(preserved.paymentStatus||syncRow[chekeoColumns.fields.paid]);
    }
    if(chekeoColumns.fields.paymentMethod>=0){
      syncRow[chekeoColumns.fields.paymentMethod]=normalizePaymentMethod_(preserved.paymentMethod||syncRow[chekeoColumns.fields.payment]);
    }
    if(chekeoColumns.fields.noteInternal>=0){
      syncRow[chekeoColumns.fields.noteInternal]=preserved.noteInternal||'';
    }
    if(chekeoColumns.fields.noteClient>=0){
      syncRow[chekeoColumns.fields.noteClient]=preserved.noteClient||'';
    }
    if(chekeoColumns.fields.alert>=0){
      syncRow[chekeoColumns.fields.alert]=specialCase?'⚠️':'';
    }
    if(chekeoColumns.fields.burgers>=0){
      syncRow[chekeoColumns.fields.burgers]=syncRow[chekeoColumns.fields.burgerSummary]||'';
    }
    syncRow[chekeoColumns.fields.startTime]=preserved.startTime||'';
    syncRow[chekeoColumns.fields.readyTime]=preserved.readyTime||'';
    syncRow[chekeoColumns.fields.updatedAt]=preserved.updatedAt||'';
    syncRow[chekeoColumns.fields.specialCase]=specialCase?'SI':'NO';
    syncRow[chekeoColumns.fields.manualReview]=specialCase?'SI':'NO';

    if(chekeoColumns.fields.ticketSent>=0){
      syncRow[chekeoColumns.fields.ticketSent]=preserved.ticketSent||'';
    }
    if(chekeoColumns.fields.ticketSentAt>=0){
      syncRow[chekeoColumns.fields.ticketSentAt]=preserved.ticketSentAt||'';
    }
    if(chekeoColumns.fields.sideReady>=0){
      syncRow[chekeoColumns.fields.sideReady]=preserved.sideReady||'';
    }
    if(chekeoColumns.fields.sideReadyAt>=0){
      syncRow[chekeoColumns.fields.sideReadyAt]=preserved.sideReadyAt||'';
    }

    output.push(syncRow);
    syncedIds[id]=true;
  });

  clearChekeoBody_(chekeoSheet,chekeoColumns);
  if(output.length>0){
    const managedIndexes=getManagedChekeoColumnIndexes_(chekeoColumns);
    writeChekeoManagedRows_(chekeoSheet,2,output,managedIndexes);
    applyChekeoFormats_(chekeoSheet,output.length,chekeoColumns);
  }

  SpreadsheetApp.flush();
  const removedExistingIds=Object.keys(existingById).filter(id=>!syncedIds[id]);
  const warningCount=skippedByMissingTimestamp.length+skippedByMissingFields.length;
  if(warningCount){
    const warningDetails=skippedByMissingFields
      .slice(0,5)
      .map(item=>`fila ${item.row} (${item.fields.join(', ')})`)
      .join('; ');
    const removedDetails=removedExistingIds.length?` Pedidos removidos de Chekeo por omisión: ${removedExistingIds.length}.`:'';
    ss.toast(
      `Chekeo sincronizado con ${warningCount} fila(s) omitidas.${removedDetails} ${warningDetails||''}`.trim(),
      'Burgers OG',
      8
    );
    Logger.log(JSON.stringify({
      type:'sync-warning',
      skippedByMissingTimestamp,
      skippedByMissingFields,
      removedExistingIds
    }));
  }else{
    ss.toast('Chekeo sincronizado.','Burgers OG',4);
  }

  return {
    syncedRows:output.length,
    skippedRows:{
      missingTimestamp:skippedByMissingTimestamp,
      missingRequiredValues:skippedByMissingFields
    },
    removedExistingIds
  };
}
