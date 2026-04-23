function syncChekeoFromMasterService_(){
  const ss=getSpreadsheet_();
  const masterSheet=ss.getSheetByName(MASTER_SHEET);
  const chekeoSheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!masterSheet)throw new Error(`No existe la hoja "${MASTER_SHEET}"`);
  if(!chekeoSheet)throw new Error(`No existe la hoja "${CHEKEO_SHEET}"`);

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
    if(!row[MASTER.timestamp])return;

    const specialCase=isSpecialCase_(row);
    const preserved=existingById[id]||{};
    const syncRow=new Array(22).fill('');
    const orderDateTime=normalizeDateValue_(row[MASTER.timestamp]);
    const orderDate=extractOnlyDate_(orderDateTime);
    const normalTotal=row[MASTER.total]||'';
    const manualTotal=row[MASTER.manualTotal]||'';

    syncRow[CHEKEO.id]=id;
    syncRow[CHEKEO.masterRow]=masterRowNumber;
    syncRow[CHEKEO.orderDateTime]=orderDateTime||'';
    syncRow[CHEKEO.orderDate]=orderDate||'';
    syncRow[CHEKEO.name]=safeTrim_(row[MASTER.customerName]);
    syncRow[CHEKEO.phone]=row[MASTER.phone]?String(row[MASTER.phone]):'';
    syncRow[CHEKEO.qtyOg]=normalizeQty_(row[MASTER.qtyOg]);
    syncRow[CHEKEO.qtyBbq]=normalizeQty_(row[MASTER.qtyBbq]);
    syncRow[CHEKEO.burgerSummary]=specialCase?'PEDIDO ESPECIAL':buildBurgerSummary_(row);
    syncRow[CHEKEO.exactOrderText]=specialCase?buildSpecialOrderText_(row):'';
    syncRow[CHEKEO.extras]=specialCase?'':buildExtras_(row);
    syncRow[CHEKEO.sides]=buildSides_(row);
    syncRow[CHEKEO.total]=specialCase&&manualTotal?manualTotal:normalTotal;
    syncRow[CHEKEO.payment]=safeTrim_(row[MASTER.paymentMethod]);
    syncRow[CHEKEO.confirmed]=normalizeYesNo_(row[MASTER.confirmed]);
    syncRow[CHEKEO.paid]=normalizeYesNo_(row[MASTER.paid]);
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
