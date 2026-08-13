/* ============================================================================
   BURGERS.EXE · CIUDAD DEL GRAFO 3D
   build_city.cjs
   Lee viz_data_city.json (generado por compute_layout.cjs) y ensambla
   graph_city.html: ciudad 3D donde las colonias son manzanas, las comunidades
   son edificios (altura ∝ tamaño, base ∝ hub), los nodos son ventanas (hubs
   en el piso alto) y las hojas viven en el sótano. Todo inline + three.min.js
   local (funciona con file://).
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'viz_data_city.json'), 'utf8'));
const JS_APP = fs.readFileSync(path.join(__dirname, '_city_runtime.js'), 'utf8');
const THREE_JS = fs.readFileSync(path.join(__dirname, 'three.min.js'), 'utf8');

const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #080b16; }
body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color: #e4ecf8; }
canvas { display: block; touch-action: none; }
.panel {
  position: fixed; z-index: 20;
  background: rgba(10, 15, 26, .82);
  border: 1px solid rgba(255, 255, 255, .09);
  border-radius: 14px;
  padding: 12px 14px;
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 36px rgba(0, 0, 0, .5);
  font-size: 12.5px;
}
#hud { top: 14px; left: 14px; pointer-events: none; }
#hud .t1 {
  font-size: 21px; font-weight: 800; letter-spacing: .6px;
  background: linear-gradient(90deg, #7fd8ff, #9be8c8 50%, #c8ffb4);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 18px rgba(127, 216, 255, .22);
}
#hud .t2 { margin-top: 3px; color: #93a7c4; font-size: 11.5px; }
#searchbox { top: 14px; left: 50%; transform: translateX(-50%); width: min(430px, 62vw); padding: 10px 12px; }
#search { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 9px 13px; color: #e4ecf8; font-size: 13.5px; outline: none; }
#search::placeholder { color: #7d92b5; }
#search:focus { border-color: #4fd8ff; box-shadow: 0 0 0 3px rgba(79, 216, 255, .15); }
#searchresults { position: absolute; inset: calc(100% + 8px) 0 auto 0; display: none; max-height: 46vh; overflow-y: auto; background: rgba(10, 15, 26, .94); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; backdrop-filter: blur(14px); }
#searchbox.open #searchresults { display: block; }
.sb-row { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 12px; background: none; border: 0; border-bottom: 1px solid rgba(255,255,255,.06); color: #e4ecf8; font-size: 12.5px; text-align: left; cursor: pointer; }
.sb-row:last-child { border-bottom: 0; }
.sb-row:hover { background: rgba(79, 216, 255, .10); }
.sb-ico { width: 22px; font-size: 15px; }
.sb-lbl { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sb-sub { color: #8aa0c4; font-size: 11px; white-space: nowrap; }
.sb-none { padding: 12px; color: #8aa0c4; }
#controls { top: 14px; right: 14px; display: flex; flex-wrap: wrap; gap: 6px; width: min(480px, 76vw); justify-content: flex-end; }
.btn {
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #c6d6ee;
  border-radius: 999px; padding: 7px 12px; font-size: 12px; cursor: pointer; transition: all .18s; white-space: nowrap;
}
.btn:hover { background: rgba(255,255,255,.12); }
.btn.on { background: rgba(34, 197, 94, .18); border-color: #22c55e; color: #b7f5cf; box-shadow: 0 0 14px rgba(34, 197, 94, .25); }
#stats { bottom: 14px; left: 14px; color: #93a7c4; font-size: 11.5px; pointer-events: none; }
#fps { position: fixed; top: 14px; right: 14px; margin-top: 44px; z-index: 19; color: #5d7294; font-size: 10.5px; pointer-events: none; }
#controls-hint { bottom: 14px; left: 50%; transform: translateX(-50%); color: #687ea0; font-size: 10.5px; pointer-events: none; opacity: .85; }
#legend {
  bottom: 14px; right: 14px; width: 276px; max-height: 54vh; overflow-y: auto; z-index: 25;
}
#legend .lg-title { font-weight: 700; font-size: 12.5px; margin-bottom: 8px; color: #c6d6ee; display: flex; align-items: center; gap: 7px; }
#legend .lg-title small { color: #6f84a8; font-weight: 400; }
.lg-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 6px; background: none; border: 0; border-radius: 8px; color: #d6e2f5; font-size: 12px; text-align: left; cursor: pointer; }
.lg-row:hover { background: rgba(79, 216, 255, .10); }
.lg-row.cur { background: rgba(34, 197, 94, .14); box-shadow: inset 0 0 0 1px rgba(34, 197, 94, .4); }
.lg-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lg-count { color: #8aa0c4; font-size: 10.5px; white-space: nowrap; }
#detail {
  top: 50%; right: 14px; transform: translateY(-50%); width: 300px; display: none; z-index: 30;
}
#detail .d-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
#d-title { font-size: 15px; font-weight: 700; word-break: break-word; color: #eaf6ff; }
#d-close { background: none; border: 0; color: #7f93b8; font-size: 16px; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
#d-close:hover { background: rgba(255,255,255,.1); color: #fff; }
.d-row { display: flex; gap: 8px; padding: 4px 0; font-size: 12px; border-top: 1px solid rgba(255,255,255,.06); }
.d-row b { color: #8aa0c4; font-weight: 600; min-width: 86px; }
.d-row span { color: #d6e2f5; word-break: break-word; }
.d-file-span { font-family: Consolas, monospace; font-size: 11px; color: #9fd0ff; }
#d-go-building { margin-top: 8px; width: 100%; }
#neighbors { margin-top: 8px; max-height: 200px; overflow-y: auto; border-top: 1px solid rgba(255,255,255,.08); padding-top: 6px; }
#neighbors .nlab { font-size: 11px; color: #8aa0c4; margin-bottom: 4px; }
.nd-row { display: flex; align-items: center; gap: 7px; width: 100%; padding: 5px 6px; background: none; border: 0; border-radius: 7px; color: #d6e2f5; font-size: 11.5px; text-align: left; cursor: pointer; }
.nd-row:hover { background: rgba(34, 197, 94, .12); }
.nd-lbl { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nd-rel { color: #8aa0c4; font-size: 10px; }
.nd-none { color: #6f84a8; font-size: 11px; padding: 6px 0; }
#tooltip {
  position: fixed; z-index: 40; display: none; pointer-events: none;
  max-width: 300px; background: rgba(10, 15, 26, .94); border: 1px solid rgba(127, 216, 255, .25);
  border-radius: 10px; padding: 10px 13px; backdrop-filter: blur(10px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, .55);
}
.tt-name { font-weight: 700; font-size: 12.5px; word-break: break-word; }
.tt-sub { color: #9fd0ff; font-size: 11px; margin: 3px 0; }
.tt-file { color: #6f84a8; font-size: 10px; word-break: break-all; font-family: Consolas, monospace; }
.tt-chip { display: inline-block; margin-top: 6px; background: rgba(34, 197, 94, .14); color: #6ee7a0; border-radius: 999px; padding: 2px 9px; font-size: 10.5px; margin-right: 4px; }
#toasts { position: fixed; bottom: 52px; left: 50%; transform: translateX(-50%); z-index: 60; display: flex; flex-direction: column; gap: 6px; align-items: center; pointer-events: none; }
.toast {
  background: rgba(10, 15, 26, .92); border: 1px solid rgba(127, 216, 255, .3); color: #dff3ff;
  padding: 8px 16px; border-radius: 999px; font-size: 12px;
  box-shadow: 0 8px 26px rgba(0, 0, 0, .5); animation: toastIn .3s ease;
}
@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
#help { position: fixed; inset: 0; z-index: 80; display: none; align-items: center; justify-content: center; background: rgba(4, 7, 14, .74); backdrop-filter: blur(6px); }
#help .card { width: min(560px, 92vw); max-height: 84vh; overflow-y: auto; background: rgba(12, 18, 32, .96); border: 1px solid rgba(127, 216, 255, .25); border-radius: 18px; padding: 24px 28px; box-shadow: 0 24px 80px rgba(0,0,0,.6); }
#help h2 { font-size: 20px; margin-bottom: 14px; background: linear-gradient(90deg, #7fd8ff, #b7f5cf); -webkit-background-clip: text; background-clip: text; color: transparent; }
#help .h-item { display: flex; gap: 12px; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.06); font-size: 13px; }
#help .h-item:last-child { border-bottom: 0; }
#help .h-emo { font-size: 19px; }
#help .h-txt b { color: #6ee7a0; }
#help .h-k { display: inline-block; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-radius: 5px; padding: 0 7px; font-family: Consolas, monospace; font-size: 11.5px; margin: 0 2px; }
#helpClose { margin-top: 14px; width: 100%; background: rgba(34, 197, 94, .18); border: 1px solid #22c55e; color: #b7f5cf; border-radius: 10px; padding: 10px; font-size: 13px; cursor: pointer; }
@media (max-width: 720px) {
  #hud .t1 { font-size: 16px; }
  #searchbox { width: min(430px, 88vw); top: 62px; z-index: 45; }
  #controls { width: auto; max-width: 94vw; z-index: 20; }
  #legend { width: 200px; max-height: 40vh; z-index: 25; }
  #detail { width: min(300px, 90vw); top: auto; bottom: 14px; transform: none; z-index: 35; }
  #controls-hint { display: none; }
}
`;

const body = `
<div id="hud" class="panel"><div class="t1">🏙 CIUDAD BURGERS.EXE</div><div class="t2">El grafo del código como ciudad · comunidades = edificios · hojas = sótano</div></div>
<div id="searchbox" class="panel"><input id="search" type="text" placeholder="🔍 Buscar nodo o edificio…" autocomplete="off" spellcheck="false"><div id="searchresults"></div></div>
<div id="controls" class="panel">
  <button class="btn on" id="btnSmoke">🏭 Humo</button>
  <button class="btn" id="btnBasement">🕳 Sótano</button>
  <button class="btn on" id="btnLines">⛓ Rutas</button>
  <button class="btn on" id="btnRot">🔄 Rotar</button>
  <button class="btn" id="btnPause">⏸ Pausa</button>
  <button class="btn" id="btnReset">🧭 Centro</button>
  <button class="btn" id="btnTour">🎬 Tour</button>
  <button class="btn" id="btnHelp">❓ Ayuda</button>
</div>
<div id="legend" class="panel"></div>
<div id="detail" class="panel">
  <div class="d-head"><div id="d-title"></div><button id="d-close">✕</button></div>
  <div class="d-row"><b>Edificio</b><span id="d-galaxy"></span></div>
  <div class="d-row"><b>Colonia</b><span id="d-colony"></span></div>
  <div class="d-row"><b>Tipo</b><span id="d-type"></span></div>
  <div class="d-row"><b>Archivo</b><span class="d-file-span" id="d-file"></span></div>
  <div class="d-row"><b>Conexiones</b><span>⚡ <span id="d-deg"></span> vecinos · <span id="d-rel"></span> enlaces</span></div>
  <div class="d-row"><b>Naturaleza</b><span id="d-filetype"></span></div>
  <button class="btn on" id="d-go-building">🏢 Ir al edificio</button>
  <div id="neighbors"><div class="nlab">🛰 Vecinos cercanos</div><div id="neighbors-list"></div></div>
</div>
<div id="stats" class="panel"></div>
<div id="fps"></div>
<div id="controls-hint">🖱 arrastrar = rotar · Shift/⊞ derecho = mover · rueda = zoom · WASD = volar · R = centro · clic = detalle · B = sótano</div>
<div id="toasts"></div>
<div id="tooltip"></div>
<div id="help">
  <div class="card">
    <h2>🏙 Tu código es una ciudad</h2>
    <div class="h-item"><div class="h-emo">🏙</div><div class="h-txt"><b>Colonias</b> = carpetas raíz del repo (apps/, docs/, legacy/, functions/...). Cada manzana agrupa los edificios que viven en esa carpeta.</div></div>
    <div class="h-item"><div class="h-emo">🏢</div><div class="h-txt"><b>Edificios</b> = comunidades del código. La <b>altura</b> indica cuántos nodos tiene la comunidad; la <b>base</b> indica el tamaño de su hub (nodo más conectado).</div></div>
    <div class="h-item"><div class="h-emo">🏭</div><div class="h-txt"><b>Fábricas</b> = comunidades con un hub muy grande. Su chimenea emite humo (se apaga con el botón Humo).</div></div>
    <div class="h-item"><div class="h-emo">🪟</div><div class="h-txt"><b>Ventanas</b> = nodos con conexiones. Los <b>pisos altos</b> son los hubs (🌟); las ventanas normales (🪟) están más abajo según su centralidad.</div></div>
    <div class="h-item"><div class="h-emo">🕳</div><div class="h-txt"><b>Sótano</b> = nodos hoja (1 o 0 conexiones): documentos, conceptos y fragmentos sin dependencias. Están enterrados para no ensuciar la ciudad; actívalos con el botón Sótano o la tecla <span class="h-k">B</span>.</div></div>
    <div class="h-item"><div class="h-emo">⛓</div><div class="h-txt"><b>Rutas</b> = las conexiones del grafo. Al pasar sobre una ventana se iluminan sus vecinos en verde y se dibujan sus rutas directas.</div></div>
    <div class="h-item"><div class="h-emo">🛰</div><div class="h-txt">Clic en una ventana abre su <b>ficha</b> con vecinos clickeables. Clic en un edificio o colonia te lleva hasta él.</div></div>
    <div class="h-item"><div class="h-emo">🕹</div><div class="h-txt">Arrastrar = rotar · <b>Shift + arrastrar / botón derecho</b> = mover la vista · Rueda = zoom · <b>WASD / flechas</b> = volar · <b>Q/E</b> = subir/bajar · <b>R</b> = volver al centro · Táctil: arrastrar / pellizcar (2 dedos también mueven).<br>Teclas: <span class="h-k">Espacio</span> pausa · <span class="h-k">B</span> sótano · <span class="h-k">L</span> rutas · <span class="h-k">S</span> humo · <span class="h-k">H</span> ayuda · <span class="h-k">Esc</span> cerrar</div></div>
    <button id="helpClose">Entendido, ¡a explorar! 🏙</button>
  </div>
</div>
`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>BURGERS.EXE · Ciudad del Grafo 3D</title>
<style>${css}</style>
</head>
<body>
${body}
<script>${THREE_JS}</script>
<script>var DATA = ${JSON.stringify(DATA)};</script>
<script>${JS_APP}</script>
</body>
</html>`;

const out = path.join(__dirname, 'graph_city.html');
fs.writeFileSync(out, html);
console.log('OK → ' + out);
console.log('nodos ' + DATA.n.length + ' · enlaces ' + DATA.l.length + ' · edificios ' + DATA.b.length + ' · colonias ' + DATA.col.length + ' · html ' + (html.length / 1024).toFixed(0) + ' KB');