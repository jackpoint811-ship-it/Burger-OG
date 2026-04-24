function getSpreadsheet_(){
  if(!SPREADSHEET_ID){
    throw new Error('Falta configurar CHEKEO_SPREADSHEET_ID en Script Properties.');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function buildExistingChekeoMap_(rows){
  const map={};
  rows.forEach(row=>{
    const id=safeTrim_(row[CHEKEO.id]);
    if(!id)return;
    map[id]={
      kitchenStatus:normalizeKitchenStatus_(row[CHEKEO.kitchenStatus]||''),
      startTime:row[CHEKEO.startTime]||'',
      readyTime:row[CHEKEO.readyTime]||'',
      updatedAt:row[CHEKEO.updatedAt]||''
    };
  });
  return map;
}

function buildOrderId_(masterRowNumber){
  return `PM-${String(masterRowNumber).padStart(4,'0')}`;
}

function isSpecialCase_(row,masterColumns){
  const specialFlag=safeTrim_(getMasterValue_(row,masterColumns.fields.specialFlag));
  const normalTotal=safeTrim_(getMasterValue_(row,masterColumns.fields.total));
  const manualTotal=safeTrim_(getMasterValue_(row,masterColumns.fields.manualTotal));
  return specialFlag==='(+1)'||normalTotal==='Chequeo Manual'||manualTotal==='Chequeo Manual';
}

function buildSpecialOrderText_(row,masterColumns){
  const exactOrderText=safeTrim_(getMasterValue_(row,masterColumns.fields.exactOrderText));
  const notes=safeTrim_(getMasterValue_(row,masterColumns.fields.notes));
  if(!notes)return exactOrderText;
  return exactOrderText?`${exactOrderText}\n\nNotas: ${notes}`:`Notas: ${notes}`;
}

function buildBurgerSummary_(row,masterColumns){
  const parts=[];
  masterColumns.burgers.forEach(burger=>{
    const qty=normalizeQty_(getMasterValue_(row,burger.index));
    if(qty<=0)return;

    parts.push(`${qty} x ${burger.name}`);
    const customText=getBurgerCustomizationText_(row,burger,masterColumns);
    if(customText)parts.push(`${burger.name}: ${customText}`);
  });
  return parts.join('\n');
}

function getBurgerCustomizationText_(row,burger){
  if(!burger||!burger.customizationColumns)return'';
  for(let i=0;i<burger.customizationColumns.length;i++){
    const colIndex=burger.customizationColumns[i];
    const text=safeTrim_(getMasterValue_(row,colIndex));
    if(text)return text;
  }
  return '';
}

function buildExtras_(row,masterColumns){
  const extras=[];
  masterColumns.extras.forEach(extra=>{
    if(isAffirmative_(getMasterValue_(row,extra.index)))extras.push(extra.name);
  });
  return extras.join('\n');
}

function buildSides_(row,masterColumns){
  const sides=[];
  masterColumns.sides.forEach(side=>{
    const qty=normalizeQty_(getMasterValue_(row,side.index));
    if(qty>0)sides.push(`${qty} x ${side.name}`);
  });
  return sides.join('\n');
}

function getBurgerQtyByName_(row,masterColumns,burgerName){
  const normalizedTarget=normalizeHeader_(burgerName);
  const burger=masterColumns.burgers.find(item=>item.normalizedName===normalizedTarget);
  return burger?normalizeQty_(getMasterValue_(row,burger.index)):0;
}

function normalizeQty_(value){
  if(value===''||value===null||value===undefined)return 0;
  const n=Number(value);
  return isNaN(n)?0:n;
}

function normalizeYesNo_(value){
  const v=safeTrim_(value).toLowerCase();
  if(v==='si'||v==='sí')return'Si';
  if(v==='no')return'No';
  return'';
}

function isAffirmative_(value){
  const normalized=safeTrim_(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');
  return ['si','yes','true','1','x','ok'].indexOf(normalized)!==-1;
}

function normalizeKitchenStatus_(value){
  const normalized=safeTrim_(value).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  if(normalized===KITCHEN_STATUS.PENDING)return KITCHEN_STATUS.PENDING;
  if(normalized===KITCHEN_STATUS.IN_PREP)return KITCHEN_STATUS.IN_PREP;
  if(normalized===KITCHEN_STATUS.READY)return KITCHEN_STATUS.READY;
  if(normalized===KITCHEN_STATUS.DELIVERED)return KITCHEN_STATUS.DELIVERED;
  if(normalized===KITCHEN_STATUS.CANCELED)return KITCHEN_STATUS.CANCELED;
  return KITCHEN_STATUS.PENDING;
}

function isActiveKitchenStatus_(value){
  const status=normalizeKitchenStatus_(value);
  return status===KITCHEN_STATUS.PENDING||status===KITCHEN_STATUS.IN_PREP;
}

function safeTrim_(value){
  return value===null||value===undefined?'':String(value).trim();
}

function normalizeDateValue_(value){
  if(!value)return'';
  if(Object.prototype.toString.call(value)==='[object Date]'&&!isNaN(value))return value;
  const parsed=new Date(value);
  return isNaN(parsed)?'':parsed;
}

function extractOnlyDate_(dateValue){
  if(!dateValue||Object.prototype.toString.call(dateValue)!=='[object Date]')return'';
  return new Date(dateValue.getFullYear(),dateValue.getMonth(),dateValue.getDate());
}

function formatUiDateTime_(dateValue){
  if(!dateValue||Object.prototype.toString.call(dateValue)!=='[object Date]'||isNaN(dateValue))return'';
  return Utilities.formatDate(dateValue,TIME_ZONE,'dd/MM/yyyy HH:mm:ss');
}

function findChekeoRowById_(sheet,orderId){
  const cleanOrderId=safeTrim_(orderId);
  if(!cleanOrderId)return 0;
  const lastRow=sheet.getLastRow();
  if(lastRow<2)return 0;
  const ids=sheet.getRange(2,CHEKEO.id+1,lastRow-1,1).getDisplayValues().flat();
  const index=ids.findIndex(id=>safeTrim_(id)===cleanOrderId);
  return index===-1?0:index+2;
}

function clearChekeoBody_(sheet){
  const maxRows=sheet.getMaxRows();
  if(maxRows>1){
    sheet.getRange(2,1,maxRows-1,22).clearContent();
  }
}

function applyChekeoFormats_(sheet,rowCount){
  if(rowCount<=0)return;
  sheet.getRange(2,CHEKEO.orderDateTime+1,rowCount,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2,CHEKEO.orderDate+1,rowCount,1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2,CHEKEO.startTime+1,rowCount,3).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}
