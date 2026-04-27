function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify(healthCheck()))
    .setMimeType(ContentService.MimeType.JSON);
}

function healthCheck() {
  return bogPublicRead_(function () {
    return {
      phase: 2,
      service: 'Burger-OG Backend Apps Script base',
      activeSheet: BurgerOGConstants.SHEETS.CHEKEO_ACTIVE_SHEET_NAME,
      timestamp: bogNowIso_()
    };
  }, 'Health check listo.');
}

function validateSheetsSetup() {
  return bogPublicRead_(function () {
    return bogValidateSheetSetup_();
  }, 'Validación de hojas ejecutada.');
}

function syncOrdersFromMaster() {
  return bogPublicWrite_(function () {
    return bogSyncOrdersFromMaster_();
  }, 'Sincronización completada.');
}

function getAppOrders() {
  return bogPublicRead_(function () {
    return bogGetAppOrders_();
  }, 'Listado de pedidos obtenido.');
}

function getOrderDetail(orderId) {
  return bogPublicRead_(function () {
    var data = bogGetOrderDetail_(orderId);
    if (!data) {
      throw new Error('Pedido no encontrado: ' + orderId);
    }
    return data;
  }, 'Detalle de pedido obtenido.');
}

function updateOrderStatus(orderId, nextStatus) {
  return bogPublicWrite_(function () {
    return bogUpdateOrderStatus_(orderId, nextStatus);
  }, 'Estado de pedido actualizado.');
}

function markOrderPaid(orderId) {
  return bogPublicWrite_(function () {
    return bogMarkOrderPaid_(orderId);
  }, 'Pedido marcado como pagado.');
}

function updateOrderNotes(orderId, noteInternal, noteClient) {
  return bogPublicWrite_(function () {
    return bogUpdateOrderNotes_(orderId, noteInternal, noteClient);
  }, 'Notas del pedido actualizadas.');
}

function markTicketSent(orderId) {
  return bogPublicWrite_(function () {
    return bogMarkTicketSent_(orderId);
  }, 'Ticket marcado como enviado.');
}

function getDailySummary() {
  return bogPublicRead_(function () {
    return bogGetDailySummary_();
  }, 'Resumen diario calculado.');
}

function getBankConfig() {
  return bogPublicRead_(function () {
    return bogGetBankConfig_();
  }, 'Configuración bancaria obtenida.');
}

function apiHealth() {
  return healthCheck();
}

function apiSyncChekeoNuevo() {
  return syncOrdersFromMaster();
}

function bogPublicRead_(operation, successMessage) {
  try {
    return {
      ok: true,
      data: operation(),
      message: successMessage
    };
  } catch (err) {
    return bogErrorEnvelope_(err);
  }
}

function bogPublicWrite_(operation, successMessage) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  try {
    lock.waitLock(30000);
    lockAcquired = true;
    return {
      ok: true,
      data: operation(),
      message: successMessage
    };
  } catch (err) {
    return bogErrorEnvelope_(err);
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

function bogErrorEnvelope_(err) {
  var message = err && err.message ? err.message : 'Error no controlado.';
  return {
    ok: false,
    error: {
      code: 'BACKEND_ERROR',
      message: message
    }
  };
}
