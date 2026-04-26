function getSpreadsheet_(){
  if(!SPREADSHEET_ID){
    throw new Error(
      'Falta configurar CHEKEO_SPREADSHEET_ID en Script Properties. '+
      'Abre Extensiones > Apps Script > Configuración del proyecto > Propiedades del script y agrega el ID del Google Sheet.'
    );
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function buildExistingChekeoMap_(rows,chekeoColumns){
  const map={};
  const fields=chekeoColumns&&chekeoColumns.fields?chekeoColumns.fields:CHEKEO;
  rows.forEach(row=>{
    const id=safeTrim_(row[fields.id]);
    if(!id)return;
    map[id]={
      kitchenStatus:normalizeKitchenStatus_(row[fields.kitchenStatus]||''),
      startTime:row[fields.startTime]||'',
      readyTime:row[fields.readyTime]||'',
      updatedAt:row[fields.updatedAt]||'',
      ticketSent:normalizeFlagForPreservation_(readByIndex_(row,fields.ticketSent)),
      ticketSentAt:readByIndex_(row,fields.ticketSentAt),
      sideReady:normalizeFlagForPreservation_(readByIndex_(row,fields.sideReady)),
      sideReadyAt:readByIndex_(row,fields.sideReadyAt)
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
  const hasPlusOne=(row||[]).some(value=>safeTrim_(value).indexOf('(+1)')!==-1);
  return hasPlusOne||specialFlag==='(+1)'||normalTotal==='Chequeo Manual'||manualTotal==='Chequeo Manual';
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
    if(!text)continue;
    if(isBooleanLikeText_(text))continue;
    return text;
  }
  return '';
}


function isBooleanLikeText_(value){
  const normalized=safeTrim_(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');
  return ['si','no','yes','true','false','1','0'].indexOf(normalized)!==-1;
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

function normalizeFlagForPreservation_(value){
  if(value===null||value===undefined)return'';
  if(typeof value==='boolean')return value?'Si':'No';
  if(typeof value==='number'){
    if(value===1)return'Si';
    if(value===0)return'No';
  }

  const raw=safeTrim_(value);
  if(!raw)return'';
  const normalized=raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(['si','yes','true','1','x','ok'].indexOf(normalized)!==-1)return'Si';
  if(['no','false','0'].indexOf(normalized)!==-1)return'No';
  return raw;
}

function readByIndex_(row,index){
  if(index===null||index===undefined||index<0)return'';
  if(index>=row.length)return'';
  const value=row[index];
  return value===null||value===undefined?'':value;
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

function findChekeoRowById_(sheet,orderId,chekeoColumns){
  const cleanOrderId=safeTrim_(orderId);
  if(!cleanOrderId)return 0;
  const lastRow=sheet.getLastRow();
  if(lastRow<2)return 0;
  const ids=sheet.getRange(2,chekeoColumns.fields.id+1,lastRow-1,1).getDisplayValues().flat();
  const index=ids.findIndex(id=>safeTrim_(id)===cleanOrderId);
  return index===-1?0:index+2;
}

function clearChekeoBody_(sheet,chekeoColumns){
  const maxRows=sheet.getMaxRows();
  if(maxRows<=1)return;

  const columns=getManagedChekeoColumnIndexes_(chekeoColumns||getChekeoColumnMap_(sheet,{skipRequiredValidation:true}));
  if(!columns.length)return;

  const rowCount=maxRows-1;
  let rangeStart=columns[0];
  let previous=columns[0];

  for(let i=1;i<=columns.length;i++){
    const current=columns[i];
    const isContiguous=current===previous+1;
    if(isContiguous){
      previous=current;
      continue;
    }
    const width=previous-rangeStart+1;
    sheet.getRange(2,rangeStart+1,rowCount,width).clearContent();
    rangeStart=current;
    previous=current;
  }
}

function applyChekeoFormats_(sheet,rowCount,chekeoColumns){
  if(rowCount<=0)return;
  sheet.getRange(2,chekeoColumns.fields.orderDateTime+1,rowCount,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2,chekeoColumns.fields.orderDate+1,rowCount,1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2,chekeoColumns.fields.startTime+1,rowCount,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2,chekeoColumns.fields.readyTime+1,rowCount,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2,chekeoColumns.fields.updatedAt+1,rowCount,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');

  if(chekeoColumns.fields.ticketSentAt>=0){
    sheet.getRange(2,chekeoColumns.fields.ticketSentAt+1,rowCount,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }
  if(chekeoColumns.fields.sideReadyAt>=0){
    sheet.getRange(2,chekeoColumns.fields.sideReadyAt+1,rowCount,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }
}

function getManagedChekeoColumnIndexes_(chekeoColumns){
  const fields=chekeoColumns&&chekeoColumns.fields?chekeoColumns.fields:{};
  const allFields=CHEKEO_REQUIRED_FIELDS.concat(CHEKEO_OPTIONAL_FIELDS);
  const indexes=allFields
    .map(fieldName=>fields[fieldName])
    .filter(index=>index!==null&&index!==undefined&&index>=0);
  return [...new Set(indexes)].sort((a,b)=>a-b);
}

function writeChekeoFieldsByRow_(sheet,rowNumber,chekeoColumns,fieldValues){
  const items=Object.keys(fieldValues||{})
    .map(fieldName=>({index:chekeoColumns.fields[fieldName],value:fieldValues[fieldName]}))
    .filter(item=>item.index!==null&&item.index!==undefined&&item.index>=0)
    .sort((a,b)=>a.index-b.index);

  if(!items.length)return;
  let blockStart=items[0].index;
  let blockValues=[items[0].value];

  for(let i=1;i<=items.length;i++){
    const item=items[i];
    const prev=items[i-1];
    const isContiguous=item&&item.index===prev.index+1;
    if(isContiguous){
      blockValues.push(item.value);
      continue;
    }
    sheet.getRange(rowNumber,blockStart+1,1,blockValues.length).setValues([blockValues]);
    if(item){
      blockStart=item.index;
      blockValues=[item.value];
    }
  }
}

function writeChekeoManagedRows_(sheet,startRow,rows,managedIndexes){
  if(!rows||!rows.length||!managedIndexes||!managedIndexes.length)return;
  let blockStart=managedIndexes[0];
  let blockIndexes=[managedIndexes[0]];

  for(let i=1;i<=managedIndexes.length;i++){
    const current=managedIndexes[i];
    const prev=managedIndexes[i-1];
    const isContiguous=current===prev+1;
    if(isContiguous){
      blockIndexes.push(current);
      continue;
    }

    const blockMatrix=rows.map(row=>blockIndexes.map(colIndex=>row[colIndex]));
    sheet.getRange(startRow,blockStart+1,rows.length,blockIndexes.length).setValues(blockMatrix);
    if(current!==undefined){
      blockStart=current;
      blockIndexes=[current];
    }
  }
}
