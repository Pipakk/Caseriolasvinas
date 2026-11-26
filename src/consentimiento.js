/* Caserío Las Viñas — consentimiento de cookies (RGPD / LSSI)
   Nada no esencial se carga hasta que el usuario lo acepta:
   - <iframe data-consentimiento="externos" data-src="…">  (sin src hasta consentir)
   - <script type="text/plain" data-consentimiento="analitica" data-src="…"></script>
   La decisión se guarda en una cookie propia y técnica durante 6 meses. */
(function () {
  'use strict';
  var COOKIE = 'clv_consent';
  var VERSION = '1';            /* subir si cambian las categorías: se volverá a preguntar */
  var DIAS = 180;
  var CATEGORIAS = [
    { id: 'externos', activa: true, titulo: 'Contenido externo',
      texto: 'Permite mostrar el mapa de Google Maps dentro de la página. Al cargarlo, Google puede instalar sus propias cookies y conocer su dirección IP.' },
    /* Poner activa: true el día que se añada una herramienta de analítica */
    { id: 'analitica', activa: false, titulo: 'Analítica',
      texto: 'Permite medir de forma agregada cuántas visitas recibe la web y qué páginas se consultan.' }
  ];
  var activas = CATEGORIAS.filter(function (c) { return c.activa; });

  function leer() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
    if (!m) return null;
    var p = decodeURIComponent(m[1]).split('|');
    if (p[0] !== VERSION) return null;
    var o = {};
    (p[1] || '').split(',').forEach(function (id) { if (id) o[id] = true; });
    return o;
  }
  function guardar(o) {
    var ids = activas.filter(function (c) { return o[c.id]; }).map(function (c) { return c.id; }).join(',');
    document.cookie = COOKIE + '=' + encodeURIComponent(VERSION + '|' + ids) +
      '; Max-Age=' + DIAS * 86400 + '; Path=/; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
  }

  /* Activa o mantiene bloqueado cada recurso marcado con data-consentimiento */
  function aplicar(o) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-consentimiento]'), function (el) {
      var ok = !!(o && o[el.getAttribute('data-consentimiento')]);
      if (el.tagName === 'SCRIPT') {
        if (!ok || el.getAttribute('data-cargado')) return;
        var s = document.createElement('script');
        if (el.getAttribute('data-src')) s.src = el.getAttribute('data-src'); else s.textContent = el.textContent;
        el.setAttribute('data-cargado', '1');
        document.head.appendChild(s);
      } else {
        if (ok && !el.getAttribute('src')) el.setAttribute('src', el.getAttribute('data-src'));
        if (!ok) el.removeAttribute('src');
        el.hidden = !ok;
        var aviso = el.parentNode.querySelector('.bloqueado');
        if (aviso) aviso.hidden = ok;
      }
    });
  }

  function decidir(o) {
    var antes = leer() || {};
    guardar(o);
    banner.hidden = true;
    if (panel.open) panel.close();
    /* Al retirar un permiso ya usado se recarga para descargar lo que estuviera en marcha */
    var retirado = activas.some(function (c) { return antes[c.id] && !o[c.id]; });
    if (retirado) location.reload(); else aplicar(o);
  }
  function todas(valor) {
    var o = {};
    activas.forEach(function (c) { o[c.id] = valor; });
    return o;
  }

  /* ---------- Aviso ---------- */
  var banner = document.createElement('section');
  banner.className = 'cookies';
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.hidden = true;
  banner.innerHTML =
    '<div class="cookies__texto"><h2>Cookies</h2>' +
    '<p>Usamos una cookie propia, necesaria para recordar esta elección. Solo si usted lo acepta cargaremos además contenido externo (el mapa de Google Maps), que puede instalar cookies de terceros. ' +
    '<a href="cookies.html">Política de cookies</a></p></div>' +
    '<div class="cookies__botones">' +
    '<button type="button" class="boton boton--contorno" data-cookies="rechazar">Rechazar</button>' +
    '<button type="button" class="boton boton--contorno" data-cookies="configurar">Configurar</button>' +
    '<button type="button" class="boton boton--contorno" data-cookies="aceptar">Aceptar</button>' +
    '</div>';

  /* ---------- Panel de configuración ---------- */
  var panel = document.createElement('dialog');
  panel.className = 'cookies-panel';
  panel.setAttribute('aria-labelledby', 'cookies-titulo');
  panel.innerHTML =
    '<form method="dialog" id="cookies-form">' +
    '<h2 id="cookies-titulo">Configurar cookies</h2>' +
    '<p>Elija qué permite. Puede cambiarlo cuando quiera desde el enlace «Configurar cookies» del pie de página.</p>' +
    '<div class="cookies-cat"><label><input type="checkbox" checked disabled> <span>Necesarias</span></label>' +
    '<p>Una única cookie propia que guarda esta elección durante 6 meses. No identifica a nadie y no se puede desactivar.</p></div>' +
    activas.map(function (c) {
      return '<div class="cookies-cat"><label><input type="checkbox" name="' + c.id + '"> <span>' + c.titulo + '</span></label><p>' + c.texto + '</p></div>';
    }).join('') +
    '<div class="cookies__botones">' +
    '<button type="button" class="boton boton--contorno" data-cookies="rechazar">Rechazar todas</button>' +
    '<button type="button" class="boton boton--contorno" data-cookies="guardar">Guardar selección</button>' +
    '<button type="button" class="boton boton--contorno" data-cookies="aceptar">Aceptar todas</button>' +
    '</div></form>';

  function abrirPanel() {
    var o = leer() || {};
    activas.forEach(function (c) { panel.querySelector('[name="' + c.id + '"]').checked = !!o[c.id]; });
    if (panel.showModal) panel.showModal(); else panel.setAttribute('open', '');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cookies]');
    if (!b) return;
    var accion = b.getAttribute('data-cookies');
    if (accion === 'aceptar') decidir(todas(true));
    else if (accion === 'rechazar') decidir(todas(false));
    else if (accion === 'configurar') { e.preventDefault(); abrirPanel(); }
    else if (accion === 'guardar') {
      var o = {};
      activas.forEach(function (c) { o[c.id] = panel.querySelector('[name="' + c.id + '"]').checked; });
      decidir(o);
    } else if (accion.indexOf('permitir:') === 0) {      /* p. ej. botón «Mostrar el mapa» */
      var actual = leer() || {};
      actual[accion.slice(9)] = true;
      decidir(actual);
    }
  });

  function iniciar() {
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.appendChild(panel);
    var o = leer();
    aplicar(o);
    banner.hidden = !!o;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
