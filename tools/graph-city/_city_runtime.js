/* ============================================================================
   BURGERS.EXE · CIUDAD DEL GRAFO 3D — runtime
   Datos en DATA (inyectado por build_city.cjs)
   n: [id, label, file, ft, deg, bi, wx, wy, wz, isLeaf]
   b: {id,name,colony,x,z,w,d,h,hue,size,hub}
   col: {id,name,cx,cz,size}
   l: [sourceIdx, targetIdx, relIdx]   rel: [nombres]
   Ventanas (arriba) = nodos con connections; Sótano (bajo tierra) = hojas.
   ========================================================================== */
(function () {
  'use strict';
  var N = DATA.n, B = DATA.b, COLS = DATA.col, L = DATA.l, REL = DATA.rel;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene, camera, renderer, raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2(), pointerDown = false, pointerMoved = 0, lastDX = 0, lastDY = 0;
  var dragging = false, touchDist = -1, touchPts = null;
  var hoverNi = -1, selNi = -1, hoverBi = -1;
  var paused = false, autorot = !reducedMotion, linesOn = true, basementOn = false, smokeOn = true;
  var tourOn = false, tourTimer = null, tourIdx = 0;
  var time = 0, fps = 0, fpsAcc = 0, fpsN = 0, lastFrame = performance.now();
  var toasts = [];

  var cam = { tx: 0, ty: 0, tz: 0, theta: 2.25, phi: 1.0, radius: 760, anim: false, dtx: 0, dty: 0, dtz: 0, dr: 760 };

  /* ---------- util ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(n) { return n.toLocaleString('es'); }
  var REL_ICON = { contains: '📦', calls: '📞', imports: '📥', imports_from: '📤', references: '🔍', inherits: '🧬', method: '🧩', rationale_for: '💡' };
  function relIcon(r) { return REL_ICON[r] || '🎯'; }
  function nodeEmoji(n) { return n[9] === 1 ? '🏚' : (n[4] >= 50 ? '🌟' : '🪟'); }
  function colonyNameOf(bi) { return COLS[B[bi].colony].name; }

  /* ---------- init renderer ---------- */
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080b16);
  scene.fog = new THREE.FogExp2(0x080b16, 0.00042);

  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x64748b, 1.1));
  var sunLight = new THREE.DirectionalLight(0xbfd4ff, 1.15);
  sunLight.position.set(240, 420, 190);
  scene.add(sunLight);
  var rim = new THREE.DirectionalLight(0x22c55e, 0.28);
  rim.position.set(-240, -60, -320);
  scene.add(rim);

  /* ---------- suelo / calles ---------- */
  var GROUND_Y = 0;
  (function buildGround() {
    var xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
    COLS.forEach(function (c) {
      xMin = Math.min(xMin, c.cx - 150); xMax = Math.max(xMax, c.cx + 150);
      zMin = Math.min(zMin, c.cz - 150); zMax = Math.max(zMax, c.cz + 150);
    });
    var pad = 90;
    var geo = new THREE.PlaneGeometry(xMax - xMin + pad * 2, zMax - zMin + pad * 2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x0d1220, roughness: 1 });
    var g = new THREE.Mesh(geo, mat);
    g.rotation.x = -Math.PI / 2;
    g.position.set((xMin + xMax) / 2, GROUND_Y - 0.05, (zMin + zMax) / 2);
    scene.add(g);

    /* rejilla de calles */
    var grid = new THREE.GridHelper(Math.max(xMax - xMin, zMax - zMin) + pad * 2, 48, 0x1c2840, 0x131a2c);
    grid.position.set((xMin + xMax) / 2, GROUND_Y + 0.01, (zMin + zMax) / 2);
    grid.material.transparent = true; grid.material.opacity = 0.5;
    scene.add(grid);

    /* parcelas de colonia (cajas translúcidas) */
    COLS.forEach(function (c, ci) {
      var lot = new THREE.Mesh(
        new THREE.BoxGeometry(260, 0.4, 260),
        new THREE.MeshLambertMaterial({ color: 0x151d31, transparent: true, opacity: 0.85 })
      );
      lot.position.set(c.cx, GROUND_Y, c.cz);
      lot.userData.ci = ci;
      scene.add(lot);
    });
  })();

  /* ---------- etiquetas procedurales ---------- */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function texFrom(c) { return new THREE.CanvasTexture(c); }
  function makeLabelTex(name, px, size, weight, color) {
    var c = cv(px, 96), x = c.getContext('2d');
    x.font = (weight || '600') + ' ' + (size || 40) + 'px "Segoe UI", Arial, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(0,0,0,.9)'; x.shadowBlur = 16;
    x.fillStyle = color || 'rgba(240,246,255,.97)';
    x.fillText(name, px / 2, 48);
    return texFrom(c);
  }

  /* ---------- etiquetas de colonia ---------- */
  var colonyLabels = [];
  COLS.forEach(function (c, ci) {
    var lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTex(c.name, 512), transparent: true, opacity: .94, depthWrite: false }));
    var ls = 46 + Math.log2(1 + c.size) * 5;
    lab.scale.set(ls, ls * 0.1875, 1);
    lab.position.set(c.cx, 30, c.cz);
    lab.userData.ci = ci;
    scene.add(lab); colonyLabels.push(lab);
  });

  /* ---------- edificios (cajas por comunidad) ---------- */
  var geoBox = new THREE.BoxGeometry(1, 1, 1);
  var buildingMeshes = [];
  var buildingLOD = [];
  B.forEach(function (b, bi) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x223050 });
    var m = new THREE.Mesh(geoBox, mat);
    m.position.set(b.x, b.h / 2, b.z);
    m.scale.set(b.w, b.h, b.d);
    m.userData.bi = bi;
    scene.add(m);
    buildingMeshes.push(m);

    /* techo iluminado */
    var roof = new THREE.Mesh(geoBox, new THREE.MeshLambertMaterial({ color: 0x2b3d63, transparent: true, opacity: 0.9 }));
    roof.position.set(b.x, b.h + 0.06, b.z);
    roof.scale.set(b.w * 1.02, 0.5, b.d * 1.02);
    roof.userData.bi = bi;
    scene.add(roof);

    /* etiqueta de edificio solo para los relevantes */
    if (b.size >= 10 || b.hub >= 40) {
      var lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTex(b.name, 256, 30), transparent: true, opacity: .88, depthWrite: false }));
      var ls = clamp(14 + Math.log2(1 + b.size) * 2.4, 16, 42);
      lab.scale.set(ls, ls * 0.1875, 1);
      lab.position.set(b.x, b.h + 1.2 + ls * 0.1, b.z);
      lab.userData.bi = bi;
      lab.userData.lod = 2;
      scene.add(lab);
      buildingLOD.push({ mesh: lab, bi: bi, lod: 2 });
    }

    /* fábricas-hub: chimenea + humo */
    if (b.hub >= 60) {
      var ch = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.4, 6, 8), new THREE.MeshLambertMaterial({ color: 0x3a4a72 }));
      ch.position.set(b.x + b.w * 0.35, b.h + 3.2, b.z - b.d * 0.3);
      ch.userData.smoke = true; ch.userData.bi = bi;
      scene.add(ch);
      (b._smokeAnchor = ch.position);
    }
  });

  /* ---------- ventanas y sótano: instancias de nodos ---------- */
  var W_EDGE = 0.42;           // medio tamaño de la caja-ventana
  var geoWin = new THREE.BoxGeometry(0.84, 0.84, 0.84);
  var winMesh = null, winIdx = [], winPos = new Float32Array(0), winCol = new Float32Array(0);
  var basementMesh = null, baseIdx = [], basePos = new Float32Array(0), baseCol = new Float32Array(0);
  var hubGeo = new THREE.OctahedronGeometry(0.75, 0);

  function colorFor(bi, v) {
    var b = B[bi];
    var h = b.hue / 360, s = v ? 0.75 : 0.30, l = v ? 0.66 : 0.30;
    var c = new THREE.Color(); c.setHSL(h, s, l); return c;
  }

  (function buildInstances() {
    var wl = [], bl = [];
    N.forEach(function (n, i) {
      if (n[9] === 1) bl.push(i); else wl.push(i);
    });
    winIdx = wl; baseIdx = bl;

    var mkInst = function (count) {
      if (count === 0) return null;
      return new THREE.InstancedMesh(geoWin, new THREE.MeshLambertMaterial({ roughness: 0.9 }), count);
    };
    winMesh = mkInst(winIdx.length);
    if (winMesh) {
      winPos = new Float32Array(winIdx.length * 3);
      winCol = new Float32Array(winIdx.length * 3);
      winIdx.forEach(function (i, k) {
        var n = N[i], b = B[n[5]], v = n[4] >= 50;
        winPos[k * 3] = b.x + n[6];
        winPos[k * 3 + 1] = b.h * n[7];
        winPos[k * 3 + 2] = b.z + n[8];
        var c = v ? new THREE.Color(0xffd166) : colorFor(n[5], true);
        winCol[k * 3] = c.r; winCol[k * 3 + 1] = c.g; winCol[k * 3 + 2] = c.b;
      });
      winMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      winMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(winCol), 3);
      applyWinPositions();
      scene.add(winMesh);
    }

    basementMesh = mkInst(baseIdx.length);
    if (basementMesh) {
      basementMesh.material.transparent = true;
      basementMesh.material.opacity = 0.0;
      basePos = new Float32Array(baseIdx.length * 3);
      baseCol = new Float32Array(baseIdx.length * 3);
      baseIdx.forEach(function (i, k) {
        var n = N[i], b = B[n[5]];
        basePos[k * 3] = b.x + n[6];
        basePos[k * 3 + 1] = -2.2 - ((i * 9301 + 49297) % 233280) / 233280 * 5.2; // profundidad variable
        basePos[k * 3 + 2] = b.z + n[8];
        var c = colorFor(n[5], false);
        baseCol[k * 3] = c.r; baseCol[k * 3 + 1] = c.g; baseCol[k * 3 + 2] = c.b;
      });
      basementMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      basementMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(baseCol), 3);
      applyBasePositions();
      basementMesh.visible = false;
      scene.add(basementMesh);
    }
  })();

  function applyWinPositions() {
    if (!winMesh) return;
    var arr = winMesh.instanceMatrix.array;
    for (var k = 0; k < winIdx.length; k++) {
      var i = winIdx[k], n = N[i], b = B[n[5]];
      var s = n[4] >= 50 ? 1.35 : 1;
      var m = arr;
      m[k * 16 + 0] = s; m[k * 16 + 1] = 0; m[k * 16 + 2] = 0; m[k * 16 + 3] = winPos[k * 3];
      m[k * 16 + 4] = 0; m[k * 16 + 5] = s; m[k * 16 + 6] = 0; m[k * 16 + 7] = winPos[k * 3 + 1];
      m[k * 16 + 8] = 0; m[k * 16 + 9] = 0; m[k * 16 + 10] = s; m[k * 16 + 11] = winPos[k * 3 + 2];
      m[k * 16 + 12] = 0; m[k * 16 + 13] = 0; m[k * 16 + 14] = 0; m[k * 16 + 15] = 1;
    }
    winMesh.instanceMatrix.needsUpdate = true;
    if (winMesh.instanceColor) winMesh.instanceColor.needsUpdate = true;
  }
  function applyBasePositions() {
    if (!basementMesh) return;
    var arr = basementMesh.instanceMatrix.array;
    for (var k = 0; k < baseIdx.length; k++) {
      var i = baseIdx[k], n = N[i];
      var s = 0.8;
      arr[k * 16 + 0] = s; arr[k * 16 + 1] = 0; arr[k * 16 + 2] = 0; arr[k * 16 + 3] = basePos[k * 3];
      arr[k * 16 + 4] = 0; arr[k * 16 + 5] = s; arr[k * 16 + 6] = 0; arr[k * 16 + 7] = basePos[k * 3 + 1];
      arr[k * 16 + 8] = 0; arr[k * 16 + 9] = 0; arr[k * 16 + 10] = s; arr[k * 16 + 11] = basePos[k * 3 + 2];
      arr[k * 16 + 12] = 0; arr[k * 16 + 13] = 0; arr[k * 16 + 14] = 0; arr[k * 16 + 15] = 1;
    }
    basementMesh.instanceMatrix.needsUpdate = true;
    if (basementMesh.instanceColor) basementMesh.instanceColor.needsUpdate = true;
  }

  /* ---------- humo de fábricas ---------- */
  var smokePts = null, smokeData = [];
  (function buildSmoke() {
    var list = [];
    B.forEach(function (b) {
      if (b.hub < 60 || !b._smokeAnchor) return;
      for (var k = 0; k < 14; k++) {
        list.push({ bi: b.id, a: b._smokeAnchor, t: Math.random(), sp: 0.28 + Math.random() * 0.28, r: 0.9 + Math.random() * 1.6 });
      }
    });
    if (!list.length) return;
    smokeData = list;
    var pos = new Float32Array(list.length * 3), col = new Float32Array(list.length * 3);
    list.forEach(function (p, k) {
      col[k * 3] = 0.75; col[k * 3 + 1] = 0.8; col[k * 3 + 2] = 0.9;
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    smokePts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.4, vertexColors: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    scene.add(smokePts);
  })();
  function updateSmoke(dt) {
    if (!smokePts || !smokeOn) return;
    var pos = smokePts.geometry.attributes.position.array;
    for (var k = 0; k < smokeData.length; k++) {
      var p = smokeData[k];
      p.t += p.sp * dt * (reducedMotion ? 0.3 : 1);
      if (p.t > 1) p.t -= 1;
      pos[k * 3] = p.a.x + Math.sin(p.t * 9 + k) * 0.6;
      pos[k * 3 + 1] = p.a.y + 2 + p.t * 11;
      pos[k * 3 + 2] = p.a.z + Math.cos(p.t * 7 + k) * 0.6;
    }
    smokePts.geometry.attributes.position.needsUpdate = true;
  }

  /* ---------- conexiones ---------- */
  var lineSegs = null;
  var hlLine = null;
  (function buildLinks() {
    var lpos = new Float32Array(L.length * 6), lcol = new Float32Array(L.length * 6);
    var cH = new THREE.Color(0x1b2740);
    L.forEach(function (l, i) {
      var a = nodePos(l[0]), b2 = nodePos(l[1]);
      lpos[i * 6] = a[0]; lpos[i * 6 + 1] = a[1]; lpos[i * 6 + 2] = a[2];
      lpos[i * 6 + 3] = b2[0]; lpos[i * 6 + 4] = b2[1]; lpos[i * 6 + 5] = b2[2];
      lcol[i * 6] = cH.r; lcol[i * 6 + 1] = cH.g; lcol[i * 6 + 2] = cH.b;
      lcol[i * 6 + 3] = cH.r; lcol[i * 6 + 4] = cH.g; lcol[i * 6 + 5] = cH.b;
    });
    var lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    lg.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
    lineSegs = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false }));
    lineSegs.frustumCulled = false;
    scene.add(lineSegs);
  })();

  /* posición mundo de un nodo */
  function nodePos(i) {
    var n = N[i], b = B[n[5]];
    if (n[9] === 1) return [b.x + n[6], -3.6, b.z + n[8]];
    return [b.x + n[6], b.h * n[7], b.z + n[8]];
  }
  var _np = [];
  function npx(i) { var p = nodePos(i); return p[0]; }
  function npy(i) { var p = nodePos(i); return p[1]; }
  function npz(i) { var p = nodePos(i); return p[2]; }

  /* vecinos por nodo */
  var adj = {};
  L.forEach(function (l) {
    (adj[l[0]] = adj[l[0]] || []).push(l);
    (adj[l[1]] = adj[l[1]] || []).push(l);
  });
  function neighborsOf(i) { return adj[i] || []; }

  /* ---------- highlight de vecinos ---------- */
  var HIGHLIGHT = 0x22c55e;
  function setWinHighlight(idxSet, mode) {
    if (!winMesh) return;
    var arr = winMesh.instanceColor.array;
    winIdx.forEach(function (i, k) {
      var n = N[i];
      var c;
      if (mode === 'on') {
        c = idxSet.has(i) ? new THREE.Color(0x22c55e) : new THREE.Color(0x0a0f1c);
      } else {
        c = n[4] >= 50 ? new THREE.Color(0xffd166) : colorFor(n[5], true);
      }
      arr[k * 3] = c.r; arr[k * 3 + 1] = c.g; arr[k * 3 + 2] = c.b;
    });
    winMesh.instanceColor.needsUpdate = true;
  }
  function setBaseHighlight(idxSet, mode) {
    if (!basementMesh) return;
    var arr = basementMesh.instanceColor.array;
    baseIdx.forEach(function (i, k) {
      var c;
      if (mode === 'on') {
        c = idxSet.has(i) ? new THREE.Color(0x22c55e) : new THREE.Color(0x070a12);
      } else {
        c = colorFor(N[i][5], false);
      }
      arr[k * 3] = c.r; arr[k * 3 + 1] = c.g; arr[k * 3 + 2] = c.b;
    });
    basementMesh.instanceColor.needsUpdate = true;
  }
  function setBuildingHighlight(bi, mode) {
    buildingMeshes.forEach(function (m, k2) {
      if (!m.material) return;
      var on = mode === 'on' && m.userData.bi === bi;
      m.material.color.setHSL(m.userData.bi === bi ? B[m.userData.bi].hue / 360 : 0.6, on ? 0.55 : 0.12, on ? 0.5 : 0.15);
    });
  }
  function buildHlLines(ni) {
    if (hlLine) { scene.remove(hlLine); hlLine = null; }
    var nbrs = neighborsOf(ni).filter(function (l) {
      var o = l[0] === ni ? l[1] : l[0];
      return N[o][9] === 1 ? basementOn : true;
    });
    if (!nbrs.length) return;
    var pos = new Float32Array(nbrs.length * 6), col = new Float32Array(nbrs.length * 6);
    var base = nodePos(ni), cH = new THREE.Color(0x4ade80);
    nbrs.forEach(function (l, k) {
      var o = l[0] === ni ? l[1] : l[0];
      var p = nodePos(o);
      pos[k * 6] = base[0]; pos[k * 6 + 1] = base[1]; pos[k * 6 + 2] = base[2];
      pos[k * 6 + 3] = p[0]; pos[k * 6 + 4] = p[1]; pos[k * 6 + 5] = p[2];
      col[k * 6] = cH.r; col[k * 6 + 1] = cH.g; col[k * 6 + 2] = cH.b;
      col[k * 6 + 3] = cH.r; col[k * 6 + 4] = cH.g; col[k * 6 + 5] = cH.b;
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    hlLine = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
    hlLine.frustumCulled = false;
    scene.add(hlLine);
  }

  /* ---------- cámara / órbita ---------- */
  function applyCam() {
    var sp = Math.sin(cam.phi);
    camera.position.set(
      cam.tx + cam.radius * sp * Math.cos(cam.theta),
      cam.ty + cam.radius * Math.cos(cam.phi),
      cam.tz + cam.radius * sp * Math.sin(cam.theta));
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    var d = cam.radius;
    var lod = d > 380 ? 0 : (d > 110 ? 1 : 2);
    if (lod === 0) {
      if (winMesh) winMesh.visible = false;
      if (basementMesh) basementMesh.visible = false;
      if (lineSegs) lineSegs.visible = linesOn;
    } else {
      if (winMesh) winMesh.visible = true;
      if (basementMesh) basementMesh.visible = basementOn;
      if (lineSegs) lineSegs.visible = linesOn;
    }
    colonyLabels.forEach(function (l) { l.visible = lod !== 2 || true; });
    buildingLOD.forEach(function (o) { o.mesh.visible = lod >= o.lod; });
  }
  function flyTo(x, y, z, radius) {
    cam.dtx = x; cam.dty = y; cam.dtz = z; cam.dr = clamp(radius, 10, 4000);
    cam.anim = true;
  }
  function panCam(ddx, ddy) {
    var fx = cam.tx - camera.position.x, fy = cam.ty - camera.position.y, fz = cam.tz - camera.position.z;
    var fl = Math.hypot(fx, fy, fz) || 1;
    fx /= fl; fy /= fl; fz /= fl;
    var rx = fz, rz = -fx;
    var rl = Math.hypot(rx, rz);
    if (rl < 1e-4) { rx = 1; rz = 0; rl = 1; }
    rx /= rl; rz /= rl;
    var ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
    var k = cam.radius * 0.0016;
    cam.tx += (-rx * ddx + ux * ddy) * k;
    cam.ty += (0 * ddx + uy * ddy) * k;
    cam.tz += (-rz * ddx + uz * ddy) * k;
    cam.anim = false;
  }
  function resetView() {
    cam.dtx = 0.5 * ((COLS[0].cx + COLS[COLS.length - 1].cx) / 2) || 0;
    cam.dty = 0; cam.dtz = 0; cam.dr = 760; cam.anim = true;
    hilitColonyRow(-1);
  }
  function flyColony(ci) {
    var c = COLS[ci];
    flyTo(c.cx, 60, c.cz, clamp(170 + Math.sqrt(c.size) * 2.4, 190, 430));
    hilitColonyRow(ci);
    toast('🏙 Colonio <b>' + c.name + '</b>');
  }
  function flyBuilding(bi) {
    var b = B[bi];
    flyTo(b.x, b.h / 2, b.z, clamp(b.h * 3.4 + 16, 26, 150));
    hilitBuildingRow(bi);
    toast('🏢 <b>' + b.name + '</b>');
  }
  function flyNode(ni) {
    var p = nodePos(ni);
    flyTo(p[0], p[1], p[2], clamp(N[ni][9] === 1 ? 16 : 14, 7, 40));
  }
  function stopTour() {
    if (tourOn) { tourOn = false; clearInterval(tourTimer); }
  }
  function userInteract() { stopTour(); }
  applyCam();

  /* ---------- raycast manual (consistente con three r128) ---------- */
  function hitNodes(px, py, includeBase) {
    pointer.x = (px / innerWidth) * 2 - 1;
    pointer.y = -(py / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var o = raycaster.ray.origin, d = raycaster.ray.direction;
    var hit = -1, best = Infinity;
    function scan(list, rScale) {
      for (var k = 0; k < list.length; k++) {
        var i = list[k], n = N[i];
        var p = nodePos(i);
        var ocx = p[0] - o.x, ocy = p[1] - o.y, ocz = p[2] - o.z;
        var tca = ocx * d.x + ocy * d.y + ocz * d.z;
        if (tca < 0) continue;
        var d2 = ocx * ocx + ocy * ocy + ocz * ocz - tca * tca;
        var r2 = 0.84 * 0.84 * rScale;
        if (d2 > r2) continue;
        var t = tca - Math.sqrt(r2 - d2);
        if (t < best) { best = t; hit = i; }
      }
    }
    scan(winIdx, 1.6);
    if (includeBase && basementOn) scan(baseIdx, 1.6);
    return hit;
  }
  function buildingAt(px, py) {
    pointer.x = (px / innerWidth) * 2 - 1;
    pointer.y = -(py / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hs = raycaster.intersectObjects(buildingMeshes, false);
    if (hs.length) return hs[0].object.userData.bi;
    return -1;
  }
  function colonyAt(px, py) {
    pointer.x = (px / innerWidth) * 2 - 1;
    pointer.y = -(py / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hs = raycaster.intersectObjects(colonyLabels, false);
    if (hs.length) return hs[0].object.userData.ci;
    return -1;
  }

  var hoverCheck = function (e) {
    if (dragging) return;
    var ni = hitNodes(e.clientX, e.clientY, true);
    var bi = ni === -1 ? (buildingAt(e.clientX, e.clientY) !== -1 ? buildingAt(e.clientX, e.clientY) : -1) : -1;
    if (ni !== hoverNi || bi !== hoverBi) {
      hoverNi = ni; hoverBi = bi;
      renderer.domElement.style.cursor = (ni >= 0 || bi >= 0) ? 'pointer' : 'grab';
      if (ni >= 0) {
        var set = new Set();
        neighborsOf(ni).forEach(function (l) { set.add(l[0]); set.add(l[1]); });
        setWinHighlight(set, 'on');
        setBaseHighlight(set, 'on');
        buildHlLines(ni);
      } else {
        setWinHighlight(null, 'off');
        setBaseHighlight(null, 'off');
        if (hlLine) { scene.remove(hlLine); hlLine = null; }
      }
      updateHoverUI();
    }
  };
  function updateHoverUI() {
    var tp = $('tooltip');
    if (hoverNi >= 0) {
      var n = N[hoverNi], b = B[n[5]];
      tp.innerHTML = '';
      tp.appendChild(el('div', 'tt-name', (n[4] >= 50 ? '🌟 ' : n[9] === 1 ? '🏚 ' : '🪟 ') + esc(n[1])));
      tp.appendChild(el('div', 'tt-sub', esc(n[3] || '') + ' · ' + fmt(n[4]) + ' conexiones'));
      tp.appendChild(el('div', 'tt-file', esc(n[2] || '')));
      tp.appendChild(el('div', 'tt-chip', esc(b.name) + ' · ' + esc(colonyNameOf(b.id))));
      tp.style.display = 'block';
    } else if (hoverBi >= 0) {
      var b2 = B[hoverBi];
      tp.innerHTML = '';
      tp.appendChild(el('div', 'tt-name', '🏢 ' + esc(b2.name)));
      tp.appendChild(el('div', 'tt-sub', fmt(b2.size) + ' nodos · hub ' + fmt(b2.hub) + ' · ' + esc(colonyNameOf(b2.id))));
      tp.style.display = 'block';
    } else {
      tp.style.display = 'none';
    }
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- detalle ---------- */
  function showInfo(ni) {
    selNi = ni;
    var n = N[ni], b = B[n[5]];
    $('d-title').textContent = n[1];
    $('d-galaxy').textContent = b.name;
    $('d-colony').textContent = colonyNameOf(b.id);
    $('d-type').textContent = n[9] === 1 ? 'Sótano (hoja, 1 o 0 conexiones)' : (n[4] >= 50 ? 'Hub de ciudad' : n[3] || '');
    $('d-file').textContent = n[2] || '';
    $('d-filetype').textContent = n[3] || '';
    $('d-deg').textContent = fmt(n[4]);
    var nb = neighborsOf(ni).length;
    $('d-rel').textContent = fmt(nb);
    $('d-go-building').style.display = 'none';
    $('detail').style.display = 'block';
    var list = $('neighbors-list');
    list.innerHTML = '';
    var nbrs = neighborsOf(ni).slice(0, 40);
    if (!nbrs.length) {
      list.appendChild(el('div', 'nd-none', 'Sin vecinos visibles'));
    } else {
      nbrs.forEach(function (l) {
        var o = l[0] === ni ? l[1] : l[0];
        var on = N[o];
        var btn = el('button', 'nd-row',
          '<span class="nd-lbl">' + (on[4] >= 50 ? '🌟 ' : '') + esc(on[1]) + '</span>' +
          '<span class="nd-rel">' + relIcon(REL[l[2]]) + '</span>');
        btn.dataset.nid = o;
        list.appendChild(btn);
      });
    }
    flyNode(ni);
  }
  document.addEventListener('click', function (e) {
    var el2 = e.target.closest('.nd-row');
    if (el2 && el2.dataset.nid !== undefined) {
      focusNode(el2.dataset.nid);
    }
  });
  function focusNode(i) {
    setWinHighlight(null, 'off'); setBaseHighlight(null, 'off');
    if (hlLine) { scene.remove(hlLine); hlLine = null; }
    showInfo(i);
  }

  /* ---------- input ---------- */
  renderer.domElement.addEventListener('pointerdown', function (e) {
    pointerDown = true; pointerMoved = 0; lastDX = e.clientX; lastDY = e.clientY; touchPts = null;
  });
  addEventListener('pointermove', function (e) {
    if (!pointerDown) { hoverCheck(e); return; }
    var dx = e.clientX - lastDX, dy = e.clientY - lastDY;
    lastDX = e.clientX; lastDY = e.clientY;
    pointerMoved += Math.abs(dx) + Math.abs(dy);
    if (pointerMoved < 4) return;
    if (e.shiftKey || e.buttons === 2) panCam(dx, dy);
    else { cam.theta -= dx * 0.0048; cam.phi = clamp(cam.phi - dy * 0.0048, 0.08, 1.55); cam.anim = false; }
    userInteract();
  });
  renderer.domElement.addEventListener('pointerup', function (e) {
    pointerDown = false;
    if (pointerMoved < 4) {
      var ni = hitNodes(e.clientX, e.clientY, true);
      if (ni >= 0) { showInfo(ni); }
      else {
        var bi = buildingAt(e.clientX, e.clientY);
        if (bi >= 0) { flyBuilding(bi); return; }
        var ci = colonyAt(e.clientX, e.clientY);
        if (ci >= 0) { flyColony(ci); }
      }
    }
  });
  addEventListener('contextmenu', function (e) { e.preventDefault(); });
  renderer.domElement.addEventListener('wheel', function (e) {
    cam.radius = clamp(cam.radius * (1 + e.deltaY * 0.0011), 14, 2600);
    cam.anim = false; userInteract();
  }, { passive: true });

  /* táctil */
  renderer.domElement.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) { pointerDown = true; pointerMoved = 0; lastDX = e.touches[0].clientX; lastDY = e.touches[0].clientY; }
    else if (e.touches.length === 2) {
      touchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchPts = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
    }
  }, { passive: true });
  renderer.domElement.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && touchDist > 0) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      cam.radius = clamp(cam.radius * touchDist / d, 14, 2600);
      touchDist = d;
      var p = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
      panCam(p.x - touchPts.x, p.y - touchPts.y);
      touchPts = p;
      cam.anim = false; userInteract();
    } else if (e.touches.length === 1 && pointerDown) {
      var dx = e.touches[0].clientX - lastDX, dy = e.touches[0].clientY - lastDY;
      lastDX = e.touches[0].clientX; lastDY = e.touches[0].clientY;
      pointerMoved += Math.abs(dx) + Math.abs(dy);
      if (pointerMoved < 4) return;
      cam.theta -= dx * 0.0048; cam.phi = clamp(cam.phi - dy * 0.0048, 0.08, 1.55); cam.anim = false; userInteract();
    }
  }, { passive: true });
  renderer.domElement.addEventListener('touchend', function (e) {
    if (touchDist > 0) { touchDist = -1; touchPts = null; }
    if (pointerDown && pointerMoved < 4 && e.changedTouches.length) {
      var t = e.changedTouches[0];
      var ni = hitNodes(t.clientX, t.clientY, true);
      if (ni >= 0) showInfo(ni);
    }
    pointerDown = false;
  }, { passive: true });

  /* teclas */
  var keys = {};
  addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    var k = e.key.toLowerCase();
    keys[k] = true;
    if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 'l') { $('btnLines').click(); }
    else if (k === 'b') { $('btnBasement').click(); }
    else if (k === 's') { $('btnSmoke').click(); }
    else if (k === 'r') { resetView(); }
    else if (k === 'h') { $('btnHelp').click(); }
    else if (k === 'escape') { $('d-close').click(); $('help').style.display = 'none'; }
    else if (k === 't') { $('btnTour').click(); }
  });
  addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  var moveWithKeys = function (dt) {
    var f = 0;
    if (keys['w'] || keys['arrowup']) f += 1;
    if (keys['s'] || keys['arrowdown']) f -= 1;
    var strafe = 0;
    if (keys['a'] || keys['arrowleft']) strafe -= 1;
    if (keys['d'] || keys['arrowright']) strafe += 1;
    var up = 0;
    if (keys['q']) up += 1;
    if (keys['e']) up -= 1;
    if (!f && !strafe && !up) return;
    var sp = Math.sin(cam.phi);
    var fx = sp * Math.cos(cam.theta), fy = Math.cos(cam.phi), fz = sp * Math.sin(cam.theta);
    var rx = fz, rz = -fx;
    var k = cam.radius * 0.55 * dt;
    cam.tx += (fx * f + rx * strafe) * k;
    cam.ty += (fy * f + up) * k * 0.7;
    cam.tz += (fz * f + rz * strafe) * k;
    cam.anim = false; userInteract();
  };

  /* ---------- tour por colonias ---------- */
  function startTour() {
    stopTour();
    tourIdx = 0;
    tourOn = true;
    flyColony(0);
    tourTimer = setInterval(function () {
      tourIdx = (tourIdx + 1) % COLS.length;
      flyColony(tourIdx);
    }, 3400);
  }
  function syncTourBtn() {
    var b = $('btnTour');
    if (b) b.classList.toggle('on', tourOn);
  }

  /* ---------- HUD ---------- */
  function toast(html) {
    var t = el('div', 'toast', html);
    $('toasts').appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .5s'; }, 1600);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function togglePause() {
    paused = !paused;
    var b = $('btnPause');
    if (b) b.classList.toggle('on', !paused);
  }

  /* ---------- búsqueda ---------- */
  var searchInput = $('search');
  var searchResults = $('searchresults');
  searchInput.addEventListener('input', function () {
    var q = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = '';
    if (!q) { $('searchbox').classList.remove('open'); return; }
    var matches = N.filter(function (n) { return String(n[1]).toLowerCase().includes(q); }).slice(0, 20);
    if (!matches.length) {
      searchResults.appendChild(el('div', 'sb-none', 'Sin resultados'));
      $('searchbox').classList.add('open');
      return;
    }
    $('searchbox').classList.add('open');
    matches.forEach(function (n, k) {
      if (k > 14) return;
      var b = B[n[5]];
      var sub = b ? '· ' + b.name : '';
      var row = el('button', 'sb-row',
        '<span class="sb-ico">' + (n[9] === 1 ? '🏚' : n[4] >= 50 ? '🌟' : '🪟') + '</span>' +
        '<span class="sb-lbl">' + esc(n[1]) + '</span><span class="sb-sub">' + esc(sub) + '</span>');
      row.dataset.nid = n[0];
      row.addEventListener('click', function () {
        var idx = N.indexOf(n);
        if (idx >= 0) { showInfo(idx); }
        searchResults.innerHTML = '';
        $('searchbox').classList.remove('open');
        searchInput.value = '';
      });
      searchResults.appendChild(row);
    });
  });
  document.addEventListener('click', function (e) {
    if (!searchResults.contains(e.target) && e.target !== searchInput)
      $('searchbox').classList.remove('open');
  });

  /* ---------- leyenda de colonias ---------- */
  function hilitColonyRow(ci) {
    document.querySelectorAll('#legend .lg-row').forEach(function (r) {
      r.classList.toggle('cur', r.dataset.ci === String(ci));
    });
  }
  function hilitBuildingRow(bi) {
    document.querySelectorAll('#legend .lg-row').forEach(function (r) {
      r.classList.toggle('cur', r.dataset.bi === String(bi));
    });
  }
  (function buildLegend() {
    var lg = $('legend');
    lg.innerHTML = '<div class="lg-title">🏙 Colonias <small>· clic para viajar</small></div>';
    COLS.forEach(function (c, ci) {
      var count = B.filter(function (b) { return b.colony === ci; }).length;
      var row = el('button', 'lg-row', '<span class="lg-name">' + esc(c.name) + '</span><span class="lg-count">' + fmt(c.size) + ' nodos · ' + count + ' edificios</span>');
      row.dataset.ci = ci;
      row.addEventListener('click', function () { flyColony(ci); userInteract(); });
      lg.appendChild(row);
    });
    lg.innerHTML += '<div class="lg-title" style="margin-top:12px">🏢 Edificios top <small>· clic para viajar</small></div>';
    var topB = B.slice().sort(function (a, b2) { return (b2.hub - a.hub) || (b2.size - a.size); }).slice(0, 22);
    topB.forEach(function (b, k) {
      var row = el('button', 'lg-row', '<span class="lg-name">' + esc(b.name) + '</span><span class="lg-count">' + fmt(b.size) + ' nodos · hub ' + fmt(b.hub) + '</span>');
      row.dataset.bi = b.id;
      row.style.borderLeft = '3px solid hsl(' + b.hue + ',60%,60%)';
      row.addEventListener('click', function () { flyBuilding(b.id); userInteract(); });
      lg.appendChild(row);
    });
  })();

  /* ---------- botones ---------- */
  $('btnPause').onclick = function () { togglePause(); userInteract(); };
  $('btnLines').onclick = function () {
    linesOn = !linesOn;
    if (lineSegs) lineSegs.visible = linesOn;
    this.classList.toggle('on', linesOn); userInteract();
  };
  $('btnBasement').onclick = function () {
    basementOn = !basementOn;
    if (basementMesh) { basementMesh.visible = basementOn; basementMesh.material.opacity = basementOn ? 0.9 : 0.0; }
    this.classList.toggle('on', basementOn);
    userInteract();
    toast(basementOn ? '🕳 Sótano visible: ' + fmt(baseIdx.length) + ' hojas enterradas' : '🕳 Sótano oculto');
  };
  $('btnSmoke').onclick = function () {
    smokeOn = !smokeOn;
    if (smokePts) smokePts.visible = smokeOn;
    this.classList.toggle('on', smokeOn); userInteract();
  };
  $('btnRot').onclick = function () {
    autorot = !autorot;
    this.classList.toggle('on', autorot); userInteract();
  };
  $('btnReset').onclick = function () { resetView(); userInteract(); };
  $('btnTour').onclick = function () { tourOn ? stopTour() : startTour(); syncTourBtn(); userInteract(); };
  $('btnHelp').onclick = function () {
    var h = $('help');
    h.style.display = h.style.display === 'flex' ? 'none' : 'flex';
  };
  $('helpClose').onclick = function () { $('help').style.display = 'none'; };
  $('d-close').onclick = function () {
    $('detail').style.display = 'none';
    selNi = -1;
    setWinHighlight(null, 'off'); setBaseHighlight(null, 'off');
    if (hlLine) { scene.remove(hlLine); hlLine = null; }
    if (ringSel) ringSel.visible = false;
  };

  /* ---------- anillo de selección ---------- */
  var ringSel, ringHov;
  (function () {
    var geo = new THREE.RingGeometry(1, 1.35, 26);
    var mk = function () {
      return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    };
    ringSel = mk(); ringSel.visible = false; scene.add(ringSel);
    ringHov = mk(); ringHov.visible = false; ringHov.material.opacity = .45; scene.add(ringHov);
  })();

  function updateRings() {
    var idx = selNi >= 0 ? selNi : (hoverNi >= 0 ? hoverNi : -1);
    ringSel.visible = selNi >= 0;
    if (selNi >= 0) {
      var p = nodePos(selNi);
      ringSel.position.set(p[0], p[1] + 0.1, p[2]);
      ringSel.lookAt(camera.position);
    }
    ringHov.visible = hoverNi >= 0 && selNi === -1;
    if (hoverNi >= 0 && selNi === -1) {
      var p2 = nodePos(hoverNi);
      ringHov.position.set(p2[0], p2[1] + 0.1, p2[2]);
      ringHov.lookAt(camera.position);
    }
  }

  /* ---------- stats ---------- */
  $('stats').textContent = 'CIUDAD BURGERS.EXE · ' + fmt(N.length) + ' nodos · ' + fmt(L.length) + ' rutas · ' + B.length + ' edificios · ' + COLS.length + ' colonias';

  /* ---------- frame loop ---------- */
  function animate() {
    requestAnimationFrame(animate);
    var now = performance.now();
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (document.hidden) return;
    fpsAcc += dt; fpsN++;
    if (fpsAcc >= 1) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; var f = $('fps'); if (f) f.textContent = fps + ' fps'; }
    if (!paused) {
      time += dt;
      var cs = reducedMotion ? 0.3 : 1;
      if (autorot) cam.theta += dt * 0.05 * cs;
      if (cam.anim) {
        var fl = 1 - Math.exp(-dt * 2.6);
        cam.tx += (cam.dtx - cam.tx) * fl;
        cam.ty += (cam.dty - cam.ty) * fl;
        cam.tz += (cam.dtz - cam.tz) * fl;
        cam.radius += (cam.dr - cam.radius) * fl;
        if (Math.abs(cam.dtx - cam.tx) < .4 && Math.abs(cam.radius - cam.dr) < .4 && Math.abs(cam.dty - cam.ty) < .4 && Math.abs(cam.dtz - cam.tz) < .4) cam.anim = false;
      }
      updateSmoke(dt);
      moveWithKeys(dt);
    }
    updateRings();
    applyCam();
    renderer.render(scene, camera);
  }

  /* ---------- resize ---------- */
  addEventListener('resize', function () {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ---------- API pública (debug / tests) ---------- */
  window.U = {
    flyColony: flyColony, flyBuilding: flyBuilding, flyNode: flyNode,
    showInfo: showInfo,
    resetView: resetView, pan: panCam, deselect: function () { $('d-close').click(); },
    proj: function (i) {
      var p = new THREE.Vector3(npx(i), npy(i), npz(i)).project(camera);
      return { x: (p.x + 1) / 2 * innerWidth, y: (-p.y + 1) / 2 * innerHeight, visible: p.z < 1 };
    },
    hit: function (x, y) { return hitNodes(x, y, true); },
    hitBuilding: function (x, y) { return buildingAt(x, y); },
    camPos: function () { return { x: camera.position.x, y: camera.position.y, z: camera.position.z }; },
    dist: function (i) { return Math.hypot(npx(i) - camera.position.x, npy(i) - camera.position.y, npz(i) - camera.position.z); },
    data: DATA,
    get fps() { return fps; },
    get selected() { return selNi; },
    get hovered() { return hoverNi; },
    get basement() { return basementOn; },
    get anim() { return cam.anim; },
    get camState() { return { radius: Math.round(cam.radius), dr: Math.round(cam.dr), tx: Math.round(cam.tx), dtx: Math.round(cam.dtx), ty: Math.round(cam.ty), dty: Math.round(cam.dty), tz: Math.round(cam.tz), dtz: Math.round(cam.dtz), theta: +cam.theta.toFixed(2), phi: +cam.phi.toFixed(2) }; },
    toggleBasement: function () { $('btnBasement').click(); },
    get lines() { return linesOn; }
  };

  animate();
})();