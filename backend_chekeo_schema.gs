function getChekeoColumnMap_(chekeoSheet){
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
  CHEKEO_REQUIRED_FIELDS.forEach(fieldName=>requireChekeoField_(fieldName,detectedColumns));
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
