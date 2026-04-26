function diagnoseSchemasService_(){
  const ss=getSpreadsheet_();
  const masterSheet=ss.getSheetByName(MASTER_SHEET);
  const chekeoSheet=ss.getSheetByName(CHEKEO_SHEET);

  if(!masterSheet){
    throw new Error(`No existe la hoja "${MASTER_SHEET}". Verifica el nombre de la hoja en tu Google Sheet.`);
  }
  if(!chekeoSheet){
    throw new Error(`No existe la hoja "${CHEKEO_SHEET}". Verifica el nombre de la hoja en tu Google Sheet.`);
  }

  const masterDiagnosis=buildMasterSchemaDiagnosis_(masterSheet);
  const chekeoDiagnosis=buildChekeoSchemaDiagnosis_(chekeoSheet);
  const ui=SpreadsheetApp.getUi();

  const formatMissing=(items)=>items.length
    ? items.map(item=>`- ${item.field}: aliases [${item.aliases.join(', ')}]`).join('\n')
    : '- Ninguna';

  const message=
    `Master (${MASTER_SHEET})\n`+
    `Columnas requeridas faltantes:\n${formatMissing(masterDiagnosis.missingRequired)}\n\n`+
    `Chekeo (${CHEKEO_SHEET})\n`+
    `Columnas base faltantes:\n${formatMissing(chekeoDiagnosis.missingRequired)}\n\n`+
    `Columnas opcionales faltantes:\n${formatMissing(chekeoDiagnosis.missingOptional)}`;

  ui.alert('Diagnóstico de Schemas',message,ui.ButtonSet.OK);
  return {master:masterDiagnosis,chekeo:chekeoDiagnosis};
}
