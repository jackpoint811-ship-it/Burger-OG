function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: 'Burger-OG Backend Base',
      phase: 2,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiSyncChekeoNuevo() {
  var result = bogSyncChekeoNuevo();
  return {
    ok: true,
    message: 'Sincronización completada.',
    result: result
  };
}

function apiHealth() {
  return {
    ok: true,
    phase: 2,
    activeSheet: BurgerOGConstants.SHEETS.CHEKEO_NUEVO,
    timestamp: new Date().toISOString()
  };
}
