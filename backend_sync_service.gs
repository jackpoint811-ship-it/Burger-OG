function syncChekeoFromMasterService_(){
  const ss=getSpreadsheet_();
  const masterSheet=ss.getSheetByName(MASTER_SHEET);
  const chekeoSheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!masterSheet)throw new Error(`No existe la hoja "${MASTER_SHEET}"`);
  if(!chekeoSheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

  const masterColumns=getMasterColumnMap_(masterSheet);
  const masterLastRow=masterSheet.getLastRow();
  const masterLastCol=masterSheet.getLastColumn();
  if(masterLastRow<2){
    clearChekeoBody_(chekeoSheet);
    return;
  }

  const masterValues=masterSheet.getRange(2,1,masterLastRow-1,masterLastCol).getValues();
  const chekeoLastRow=chekeoSheet.getLastRow();
  const existingRows=chekeoLastRow>=2?chekeoSheet.getRange(2,1,chekeoLastRow-1,22).getValues():[];
  const existingById=buildExistingChekeoMap_(existingRows);

  const output=[];
  masterValues.forEach((row,i)=>{
    const masterRowNumber=i+2;
    const id=buildOrderId_(masterRowNumber);
    if(!getMasterValue_(row,masterColumns.fields.timestamp))return;

    const specialCase=isSpecialCase_(row,masterColumns);
    const preserved=existingById[id]||{};
    const syncRow=new Array(22).fill('');
    const orderDateTime=normalizeDateValue_(getMasterValue_(row,masterColumns.fields.timestamp));
    const orderDate=extractOnlyDate_(orderDateTime);
    const normalTotal=getMasterValue_(row,masterColumns.fields.total)||'';
    const manualTotal=getMasterValue_(row,masterColumns.fields.manualTotal)||'';

    syncRow[CHEKEO.id]=id;
    syncRow[CHEKEO.masterRow]=masterRowNumber;
    syncRow[CHEKEO.orderDateTime]=orderDateTime||'';
    syncRow[CHEKEO.orderDate]=orderDate||'';
    syncRow[CHEKEO.name]=safeTrim_(getMasterValue_(row,masterColumns.fields.customerName));
    syncRow[CHEKEO.phone]=safeTrim_(getMasterValue_(row,masterColumns.fields.phone));
    syncRow[CHEKEO.qtyOg]=getBurgerQtyByName_(row,masterColumns,'OG');
    syncRow[CHEKEO.qtyBbq]=getBurgerQtyByName_(row,masterColumns,'BBQ');
    syncRow[CHEKEO.burgerSummary]=specialCase?'PEDIDO ESPECIAL':buildBurgerSummary_(row,masterColumns);
    syncRow[CHEKEO.exactOrderText]=specialCase?buildSpecialOrderText_(row,masterColumns):'';
    syncRow[CHEKEO.extras]=specialCase?'':buildExtras_(row,masterColumns);
    syncRow[CHEKEO.sides]=buildSides_(row,masterColumns);
    syncRow[CHEKEO.total]=specialCase&&manualTotal?manualTotal:normalTotal;
    syncRow[CHEKEO.payment]=safeTrim_(getMasterValue_(row,masterColumns.fields.paymentMethod));
    syncRow[CHEKEO.confirmed]=normalizeYesNo_(getMasterValue_(row,masterColumns.fields.confirmed));
    syncRow[CHEKEO.paid]=normalizeYesNo_(getMasterValue_(row,masterColumns.fields.paid));
    syncRow[CHEKEO.kitchenStatus]=normalizeKitchenStatus_(preserved.kitchenStatus||KITCHEN_STATUS.PENDING);
    syncRow[CHEKEO.startTime]=preserved.startTime||'';
    syncRow[CHEKEO.readyTime]=preserved.readyTime||'';
    syncRow[CHEKEO.updatedAt]=preserved.updatedAt||'';
    syncRow[CHEKEO.specialCase]=specialCase?'SI':'NO';
    syncRow[CHEKEO.manualReview]=specialCase?'SI':'NO';

    output.push(syncRow);
  });

  clearChekeoBody_(chekeoSheet);
  if(output.length>0){
    chekeoSheet.getRange(2,1,output.length,22).setValues(output);
    applyChekeoFormats_(chekeoSheet,output.length);
  }

  SpreadsheetApp.flush();
  ss.toast('Chekeo sincronizado.','Burgers OG',4);
}
