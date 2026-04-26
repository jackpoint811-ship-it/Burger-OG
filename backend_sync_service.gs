function syncChekeoFromMasterService_(){
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
  masterValues.forEach((row,i)=>{
    const masterRowNumber=i+2;
    const id=buildOrderId_(masterRowNumber);
    if(!getMasterValue_(row,masterColumns.fields.timestamp))return;

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
  });

  clearChekeoBody_(chekeoSheet,chekeoColumns);
  if(output.length>0){
    const managedIndexes=getManagedChekeoColumnIndexes_(chekeoColumns);
    writeChekeoManagedRows_(chekeoSheet,2,output,managedIndexes);
    applyChekeoFormats_(chekeoSheet,output.length,chekeoColumns);
  }

  SpreadsheetApp.flush();
  ss.toast('Chekeo sincronizado.','Burgers OG',4);
}
