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

function getMasterColumnMap_(masterSheet,options){
  const opts=options||{};
  const lastCol=masterSheet.getLastColumn();
  const headers=lastCol>0?masterSheet.getRange(1,1,1,lastCol).getDisplayValues()[0]:[];
  const detectedHeaders=headers.map(header=>safeTrim_(header));
  const normalizedHeaders=headers.map(header=>normalizeHeader_(header));

  const fields={};
  const aliasesByField={};
  Object.keys(MASTER_FIELD_ALIASES).forEach(fieldName=>{
    const aliases=MASTER_FIELD_ALIASES[fieldName];
    aliasesByField[fieldName]=aliases;
    fields[fieldName]=findFirstHeaderIndexByAliases_(normalizedHeaders,aliases);
  });

  const extras=[];
  const sides=[];
  const burgers=[];

  headers.forEach((header,index)=>{
    const raw=safeTrim_(header);
    if(!raw)return;

    const normalizedHeader=normalizedHeaders[index];
    const bracketName=extractBracketName_(raw);

    if(/^extras\s*\[/i.test(raw) && bracketName){
      extras.push({index,name:bracketName,header:raw,normalizedHeader});
    }

    if(/^date\s+un\s+extra\s*\[/i.test(normalizeHeaderLike_(raw)) && bracketName){
      sides.push({index,name:bracketName,header:raw,normalizedHeader});
    }

    const productName=extractBurgerNameFromHeader_(raw,normalizedHeader);
    if(productName){
      burgers.push({
        index,
        name:productName,
        normalizedName:normalizeHeader_(productName),
        header:raw,
        customizationColumns:[]
      });
    }
  });

  burgers.forEach(burger=>{
    burger.customizationColumns=findCustomizationCandidatesForBurger_(burger,headers,normalizedHeaders);
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

  if(!opts.skipRequiredValidation){
    REQUIRED_MASTER_FIELDS.forEach(fieldName=>requireMasterField_(fieldName,detectedColumns));
  }
  return detectedColumns;
}

function buildMasterSchemaDiagnosis_(masterSheet){
  const map=getMasterColumnMap_(masterSheet,{skipRequiredValidation:true});
  const missingRequired=REQUIRED_MASTER_FIELDS
    .filter(fieldName=>map.fields[fieldName]===null||map.fields[fieldName]===undefined||map.fields[fieldName]<0)
    .map(fieldName=>({field:fieldName,aliases:map.aliasesByField[fieldName]||[]}));

  return {
    missingRequired,
    detectedHeaders:map.headers.filter(Boolean),
    aliasesByField:map.aliasesByField
  };
}

function normalizeHeaderLike_(rawHeader){
  return String(rawHeader||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase();
}

function findFirstHeaderIndexByAliases_(normalizedHeaders,aliases){
  const normalizedAliases=aliases.map(alias=>normalizeHeader_(alias));
  for(let i=0;i<normalizedHeaders.length;i++){
    if(normalizedAliases.indexOf(normalizedHeaders[i])!==-1)return i;
  }
  return -1;
}

function extractBracketName_(header){
  const match=String(header||'').match(/\[([^\]]+)\]/);
  return match?safeTrim_(match[1]):'';
}

function extractBurgerNameFromHeader_(rawHeader,normalizedHeader){
  const bracketName=extractBracketName_(rawHeader);
  if(!bracketName)return '';

  // Tolerante a: ¿Cuantas?, ¿Cuántas?, Cuantas, Cuántas.
  const cleanNormalized=String(normalizedHeader||'').replace(/\s+/g,' ').trim();
  if(/^cuantas\s+[a-z0-9&ñ\s]+$/.test(cleanNormalized)){
    return bracketName;
  }

  return '';
}

function findCustomizationCandidatesForBurger_(burger,headers,normalizedHeaders){
  const preferred=[];
  const secondary=[];

  const productNameNormalized=burger.normalizedName;
  const productNameOriginal=burger.name;

  headers.forEach((header,index)=>{
    if(index===burger.index)return;

    const raw=safeTrim_(header);
    if(!raw)return;

    const normalized=normalizedHeaders[index];
    if(!normalized)return;
    if(normalized.startsWith('personalizar '))return; // nunca usar bandera Si/No como texto

    const containsProduct=normalized.includes(productNameNormalized);
    if(!containsProduct)return;

    if(isPreferredCustomizationHeader_(raw,normalized,productNameOriginal,productNameNormalized)){
      preferred.push(index);
      return;
    }

    if(isSecondaryCustomizationHeader_(normalized)){
      secondary.push(index);
    }
  });

  return [...new Set(preferred.concat(secondary))];
}

function isPreferredCustomizationHeader_(rawHeader,normalizedHeader,productNameOriginal,productNameNormalized){
  const escapedOriginal=escapeRegExp_(safeTrim_(productNameOriginal));
  const escapedNormalized=escapeRegExp_(productNameNormalized);
  const raw=String(rawHeader||'').trim();

  const preferredRawPatterns=[
    new RegExp(`^Burger\\s+${escapedOriginal}$`,'i'),
    new RegExp(`^${escapedOriginal}\\s+Burger$`,'i')
  ];
  if(preferredRawPatterns.some(pattern=>pattern.test(raw)))return true;

  const preferredNormalizedPatterns=[
    new RegExp(`^burger\\s+${escapedNormalized}$`),
    new RegExp(`^${escapedNormalized}\\s+burger$`),
    new RegExp(`^descripcion\\s+${escapedNormalized}$`),
    new RegExp(`^detalle\\s+${escapedNormalized}$`)
  ];

  return preferredNormalizedPatterns.some(pattern=>pattern.test(normalizedHeader));
}

function isSecondaryCustomizationHeader_(normalizedHeader){
  return normalizedHeader.includes('burger')||normalizedHeader.includes('descripcion')||normalizedHeader.includes('detalle');
}

function escapeRegExp_(value){
  return String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
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

function getMissingRequiredMasterValues_(row,masterColumns){
  const fieldsToValidate=['customerName','total','paymentMethod'];
  return fieldsToValidate.filter(fieldName=>!safeTrim_(getMasterValue_(row,masterColumns.fields[fieldName])));
}
