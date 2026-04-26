function getChekeoColumnMap_(chekeoSheet,options){
  const opts=options||{};
  const lastCol=chekeoSheet.getLastColumn();
  if(lastCol<=0){
    throw new Error(
      `La hoja "${CHEKEO_SHEET}" no tiene encabezados. `+
      'Agrega la fila 1 con los encabezados de Chekeo antes de continuar.'
    );
  }

  const headers=chekeoSheet.getRange(1,1,1,lastCol).getDisplayValues()[0];
  const detectedHeaders=headers.map(header=>safeTrim_(header));
  const normalizedHeaders=headers.map(header=>normalizeHeader_(header));
  const fields={};
  const aliasesByField={};

  Object.keys(CHEKEO_FIELD_ALIASES).forEach(fieldName=>{
    const aliases=CHEKEO_FIELD_ALIASES[fieldName];
    aliasesByField[fieldName]=aliases;
    fields[fieldName]=findFirstHeaderIndexByAliases_(normalizedHeaders,aliases);
  });

  const detectedColumns={fields,headers:detectedHeaders,aliasesByField,normalizedHeaders,lastCol};
  if(!opts.skipRequiredValidation){
    CHEKEO_REQUIRED_FIELDS.forEach(fieldName=>requireChekeoField_(fieldName,detectedColumns));
  }
  return detectedColumns;
}

function requireChekeoField_(fieldName,detectedColumns){
  const index=detectedColumns.fields[fieldName];
  if(index!==null&&index!==undefined&&index>=0)return;

  const aliases=(detectedColumns.aliasesByField[fieldName]||[]).join(', ');
  const headers=detectedColumns.headers.filter(Boolean).join(', ');
  const firstAlias=(detectedColumns.aliasesByField[fieldName]||[fieldName])[0];
  throw new Error(
    `Falta la columna requerida ${firstAlias} en ${CHEKEO_SHEET}. `+
    `Aliases intentados: ${aliases}. `+
    `Encabezados detectados: ${headers}. `+
    'Corrige los encabezados de la fila 1 de Chekeo y vuelve a intentar.'
  );
}

function requireChekeoOptionalField_(fieldName,detectedColumns){
  const index=detectedColumns.fields[fieldName];
  if(index!==null&&index!==undefined&&index>=0)return index;
  const aliases=(detectedColumns.aliasesByField[fieldName]||[]).join(', ');
  const headers=detectedColumns.headers.filter(Boolean).join(', ');
  const firstAlias=(detectedColumns.aliasesByField[fieldName]||[fieldName])[0];
  throw new Error(
    `Para esta acción falta la columna ${firstAlias} en ${CHEKEO_SHEET}. `+
    `Aliases intentados: ${aliases}. `+
    `Encabezados detectados: ${headers}. `+
    `Agrega la columna ${firstAlias} en la fila 1 de ${CHEKEO_SHEET}.`
  );
}

function buildChekeoSchemaDiagnosis_(chekeoSheet){
  const map=getChekeoColumnMap_(chekeoSheet,{skipRequiredValidation:true});
  const missingRequired=CHEKEO_REQUIRED_FIELDS
    .filter(fieldName=>map.fields[fieldName]===null||map.fields[fieldName]===undefined||map.fields[fieldName]<0)
    .map(fieldName=>({field:fieldName,aliases:map.aliasesByField[fieldName]||[]}));

  const missingOptional=CHEKEO_OPTIONAL_FIELDS
    .filter(fieldName=>map.fields[fieldName]===null||map.fields[fieldName]===undefined||map.fields[fieldName]<0)
    .map(fieldName=>({field:fieldName,aliases:map.aliasesByField[fieldName]||[]}));

  return {
    missingRequired,
    missingOptional,
    detectedHeaders:map.headers.filter(Boolean),
    aliasesByField:map.aliasesByField
  };
}

function diagnoseChekeoSchemaService_(){
  const ss=getSpreadsheet_();
  const sheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!sheet){
    throw new Error(`No existe la hoja "${CHEKEO_SHEET}". Verifica el nombre de la hoja en tu Google Sheet.`);
  }

  const diagnosis=buildChekeoSchemaDiagnosis_(sheet);
  const formatMissing=items=>items.length
    ? items.map(item=>`- ${item.field}: aliases [${item.aliases.join(', ')}]`).join('\n')
    : '- Ninguna';

  const message=
    `Diagnóstico de schema para "${CHEKEO_SHEET}"\n\n`+
    `Columnas base faltantes:\n${formatMissing(diagnosis.missingRequired)}\n\n`+
    `Columnas opcionales faltantes:\n${formatMissing(diagnosis.missingOptional)}\n\n`+
    `Encabezados detectados:\n${diagnosis.detectedHeaders.join(', ')||'(sin encabezados)'}`;

  SpreadsheetApp.getUi().alert('Diagnóstico Schema Chekeo',message,SpreadsheetApp.getUi().ButtonSet.OK);
  return diagnosis;
}

function setupChekeoOptionalColumnsService_(){
  const ss=getSpreadsheet_();
  const sheet=ss.getSheetByName(CHEKEO_SHEET);
  if(!sheet){
    throw new Error(`No existe la hoja "${CHEKEO_SHEET}". Verifica el nombre de la hoja en tu Google Sheet.`);
  }

  const diagnosis=buildChekeoSchemaDiagnosis_(sheet);
  if(diagnosis.missingRequired.length){
    throw new Error(
      `No se pueden agregar columnas opcionales porque faltan columnas base en "${CHEKEO_SHEET}". `+
      `Ejecuta "Diagnosticar Schema Chekeo" y corrige primero las columnas base.`
    );
  }

  if(!diagnosis.missingOptional.length){
    ss.toast('No faltan columnas opcionales en Chekeo.','Burgers OG',4);
    return {ok:true,added:[],message:'No faltan columnas opcionales.'};
  }

  const headersToAdd=diagnosis.missingOptional.map(item=>(CHEKEO_FIELD_ALIASES[item.field]||[item.field])[0]);
  const startCol=sheet.getLastColumn()+1;
  sheet.getRange(1,startCol,1,headersToAdd.length).setValues([headersToAdd]);
  ss.toast(`Columnas opcionales agregadas: ${headersToAdd.join(', ')}`,'Burgers OG',6);

  return {ok:true,added:headersToAdd};
}
