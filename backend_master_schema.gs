const MASTER_FIELD_ALIASES={
  timestamp:['Marca temporal'],
  customerName:['Nombre','Cliente','Nombre del cliente'],
  phone:['Telefono','Teléfono','Celular','Número de teléfono'],
  paymentMethod:['Forma de pago','Pago','Método de pago'],
  total:['Total'],
  manualTotal:['Precio Manual total','Precio manual','Total manual'],
  notes:['Nota','Notas','Comentarios'],
  confirmed:['Confirmado'],
  paid:['Pagado?','Pagado'],
  specialFlag:['¿Personalizar tu(s) hamburguesa(s)?','Personalizar hamburguesa','Personalizar'],
  exactOrderText:['Describe como quieres tus Burgers','Describe tu pedido','Pedido exacto']
};

const REQUIRED_MASTER_FIELDS=['timestamp','customerName','total','paymentMethod'];

function normalizeHeader_(value){
  return String(value===null||value===undefined?'':value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[¿?\[\](){}]/g,' ')
    .replace(/[^a-z0-9&ñ\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function getMasterColumnMap_(masterSheet){
  const lastCol=masterSheet.getLastColumn();
  const headers=lastCol>0?masterSheet.getRange(1,1,1,lastCol).getDisplayValues()[0]:[];
  const detectedHeaders=headers.map(header=>safeTrim_(header));
  const normalizedHeaders=headers.map(header=>normalizeHeader_(header));

  const fields={};
  const aliasesByField={};
  Object.keys(MASTER_FIELD_ALIASES).forEach(fieldName=>{
    const aliases=MASTER_FIELD_ALIASES[fieldName];
    aliasesByField[fieldName]=aliases;
    fields[fieldName]=findFirstHeaderIndexByAliases_(headers,normalizedHeaders,aliases);
  });

  const extras=[];
  const sides=[];
  const burgers=[];
  const customizationColumns=[];

  headers.forEach((header,index)=>{
    const raw=safeTrim_(header);
    if(!raw)return;
    const normalized=normalizedHeaders[index];
    const bracketName=extractBracketName_(raw);

    if(/^extras\s*\[/i.test(raw) && bracketName){
      extras.push({index,name:bracketName,header:raw,normalizedHeader:normalized});
    }

    if(/^date\s+un\s+extra\s*\[/i.test(normalizedHeaderLike_(raw)) && bracketName){
      sides.push({index,name:bracketName,header:raw,normalizedHeader:normalized});
    }

    const burgerMatch=raw.match(/^\s*[¿?]?\s*cuantas\??\s*\[([^\]]+)\]\s*$/i);
    if(burgerMatch){
      const burgerName=safeTrim_(burgerMatch[1]);
      if(burgerName){
        burgers.push({
          index,
          name:burgerName,
          normalizedName:normalizeHeader_(burgerName),
          header:raw,
          customizationColumns:[]
        });
      }
    }

    if(normalized.includes('personalizar')||normalized.includes('burger')){
      customizationColumns.push({index,header:raw,normalizedHeader:normalized});
    }
  });

  burgers.forEach(burger=>{
    const candidates=[];
    customizationColumns.forEach(column=>{
      if(column.index===burger.index)return;
      if(column.normalizedHeader.includes(burger.normalizedName))candidates.push(column.index);
    });

    const normalizedBurger=burger.normalizedName;
    if(normalizedBurger==='og'){
      pushCustomizationAliasCandidates_(candidates,headers,['Burger OG','Personalizar OG']);
    }
    if(normalizedBurger==='bbq'){
      pushCustomizationAliasCandidates_(candidates,headers,['BBQ Burger','Personalizar BBQ','Burger BBQ']);
    }

    burger.customizationColumns=[...new Set(candidates)];
  });

  const detectedColumns={
    fields,
    extras,
    sides,
    burgers,
    headers:detectedHeaders,
    aliasesByField,
    normalizedHeaders
  };

  REQUIRED_MASTER_FIELDS.forEach(fieldName=>requireMasterField_(fieldName,detectedColumns));
  return detectedColumns;
}

function normalizedHeaderLike_(rawHeader){
  return String(rawHeader||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase();
}

function findFirstHeaderIndexByAliases_(headers,normalizedHeaders,aliases){
  const normalizedAliases=aliases.map(alias=>normalizeHeader_(alias));
  for(let i=0;i<headers.length;i++){
    if(normalizedAliases.indexOf(normalizedHeaders[i])!==-1)return i;
  }
  return -1;
}

function extractBracketName_(header){
  const match=String(header||'').match(/\[([^\]]+)\]/);
  return match?safeTrim_(match[1]):'';
}

function pushCustomizationAliasCandidates_(target,headers,aliases){
  const normalizedByIndex=headers.map(header=>normalizeHeader_(header));
  aliases.forEach(alias=>{
    const normalizedAlias=normalizeHeader_(alias);
    const idx=normalizedByIndex.findIndex(value=>value===normalizedAlias);
    if(idx!==-1)target.push(idx);
  });
}

function getMasterValue_(row,columnIndex){
  if(!row||columnIndex===null||columnIndex===undefined||columnIndex<0)return'';
  if(columnIndex>=row.length)return'';
  const value=row[columnIndex];
  return value===null||value===undefined?'':value;
}

function requireMasterField_(fieldName,detectedColumns){
  const index=detectedColumns.fields[fieldName];
  if(index!==null&&index!==undefined&&index>=0)return;

  const aliases=(detectedColumns.aliasesByField[fieldName]||[]).join(', ');
  const headers=detectedColumns.headers.filter(Boolean).join(', ');
  const firstAlias=(detectedColumns.aliasesByField[fieldName]||[fieldName])[0];
  throw new Error(
    `Falta la columna requerida ${firstAlias} en ${MASTER_SHEET}. `+
    `Aliases intentados: ${aliases}. `+
    `Encabezados detectados: ${headers}`
  );
}
