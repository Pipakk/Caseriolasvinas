/* Caserío Las Viñas — menú, visor de fotos y calendario de tarifas */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TELEFONO = '34649012798';

  /* Hoja de Google del dueño (compartida como «Cualquier persona con el enlace: Lector»).
     Para cambiar de hoja basta con sustituir el identificador: es el tramo largo de su dirección,
     entre /d/ y /edit. Si se deja vacío o la hoja falla, se usa tarifas.json como respaldo. */
  var HOJA_ID = '1xfriYabjZ2htieofYq1OKb1LhdzBviaK';
  var PESTANAS = ['Calendario', 'Precios', 'Temporadas'];
  function urlPestana(nombre) {
    return 'https://docs.google.com/spreadsheets/d/' + HOJA_ID + '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(nombre);
  }

  /* ---------- Menú móvil ---------- */
  var menu = $('menu'), menuBtn = $('menu-btn');
  function cerrarMenu() { menu.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierto');
    menuBtn.setAttribute('aria-expanded', String(abierto));
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) cerrarMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ---------- Barra fija en móvil: aparece al dejar la portada ---------- */
  var barra = document.querySelector('.barra-movil');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      barra.classList.toggle('visible', !entradas[0].isIntersecting);
    }).observe(document.querySelector('.portada'));
  } else { barra.classList.add('visible'); }

  /* ---------- Visor de la galería ---------- */
  var visor = $('visor'), fotos = Array.prototype.slice.call(document.querySelectorAll('#galeria-lista .g')), actual = 0;
  function mostrar(i) {
    actual = (i + fotos.length) % fotos.length;
    var alt = fotos[actual].querySelector('img').alt;
    $('visor-img').src = fotos[actual].href + '?enable-io=true&width=1600';
    $('visor-img').alt = alt;
    $('visor-pie').textContent = alt + ' (' + (actual + 1) + ' de ' + fotos.length + ')';
  }
  if (visor.showModal) {
    fotos.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); mostrar(i); visor.showModal(); });
    });
    $('visor-cerrar').addEventListener('click', function () { visor.close(); });
    $('visor-ant').addEventListener('click', function () { mostrar(actual - 1); });
    $('visor-sig').addEventListener('click', function () { mostrar(actual + 1); });
    visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
    visor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostrar(actual - 1);
      if (e.key === 'ArrowRight') mostrar(actual + 1);
    });
  }

  /* ---------- Disponibilidad y tarifas ----------
     Modelo interno (igual venga de la hoja o de tarifas.json):
       datos.grupos      [{ id, etiqueta }]
       datos.meses       { '2027-03': { 7: true, 8: true } }   meses abiertos y sus días ocupados
       datos.tarifas     { clave: { idGrupo: [precio 2 noches … 7 noches] } }
       datos.normal      clave de la tarifa que se aplica por defecto (la primera)
       datos.temporadas  [{ desde, hasta, tarifa }]             fechas con otra tarifa            */
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var NOCHES = [2, 3, 4, 5, 6, 7];
  var datos, meses = [], mesSel = 0, grupoSel;

  function iso(a, m, d) { return a + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
  function hoyIso() { var h = new Date(); return iso(h.getFullYear(), h.getMonth(), h.getDate()); }
  function diasDelMes(a, m) { return new Date(a, m + 1, 0).getDate(); }
  function euros(n) { return n.toLocaleString('es-ES', { useGrouping: 'always' }) + ' €'; }
  function mayuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function clave(s) { return String(s || '').trim().toLowerCase(); }
  function esLibre(f) {
    var mes = datos.meses[f.slice(0, 7)];
    return !!mes && !mes[+f.slice(8)];
  }
  function tarifaDe(f) {
    for (var i = 0; i < datos.temporadas.length; i++) {
      var t = datos.temporadas[i];
      if (f >= t.desde && f <= t.hasta && datos.tarifas[t.tarifa]) return t.tarifa;
    }
    return datos.normal;
  }

  /* Solo se muestran los meses abiertos en la hoja, desde el mes actual en adelante */
  function prepararMeses() {
    var hoy = hoyIso(), mesActual = hoy.slice(0, 7);
    meses = Object.keys(datos.meses).sort().filter(function (k) { return k >= mesActual; }).map(function (k) {
      var a = +k.slice(0, 4), m = +k.slice(5) - 1, libres = 0;
      for (var d = 1; d <= diasDelMes(a, m); d++) { var f = iso(a, m, d); if (f >= hoy && esLibre(f)) libres++; }
      return { a: a, m: m, libres: libres };
    });
    if (!meses.length) throw new Error('No hay meses abiertos');
    var primero = meses.findIndex(function (x) { return x.libres > 0; });
    mesSel = primero < 0 ? 0 : primero;
  }

  function pintarMeses() {
    var cont = $('meses');
    cont.innerHTML = '';
    meses.forEach(function (x, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mes' + (x.libres ? '' : ' mes--completo');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(i === mesSel));
      b.innerHTML = MESES[x.m].slice(0, 3) + ' ' + x.a + '<small>' + (x.libres ? x.libres + (x.libres === 1 ? ' día libre' : ' días libres') : 'Completo') + '</small>';
      b.addEventListener('click', function () { elegirMes(i); });
      cont.appendChild(b);
    });
  }

  function elegirMes(i) {
    mesSel = Math.max(0, Math.min(meses.length - 1, i));
    Array.prototype.forEach.call($('meses').children, function (b, j) {
      b.setAttribute('aria-selected', String(j === mesSel));
      if (j === mesSel && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    pintarCalendario();
    pintarPrecios();
  }

  function pintarCalendario() {
    var x = meses[mesSel], hoy = hoyIso(), html = '<tr>';
    $('mes-titulo').textContent = mayuscula(MESES[x.m]) + ' de ' + x.a;
    $('mes-ant').disabled = mesSel === 0;
    $('mes-sig').disabled = mesSel === meses.length - 1;
    var hueco = (new Date(x.a, x.m, 1).getDay() + 6) % 7, col = 0;
    for (var i = 0; i < hueco; i++, col++) html += '<td></td>';
    for (var d = 1; d <= diasDelMes(x.a, x.m); d++, col++) {
      if (col === 7) { html += '</tr><tr>'; col = 0; }
      var f = iso(x.a, x.m, d), estado = f < hoy ? 'pasado' : esLibre(f) ? 'libre' : 'ocupado';
      html += '<td class="' + estado + '"><span aria-label="' + d + ', ' + estado + '">' + d + '</span></td>';
    }
    $('cal-dias').innerHTML = html + '</tr>';
  }

  /* Agrupa los días libres del mes por tarifa: «Del 1 al 10 y del 20 al 31 de mayo» */
  function tramosDelMes(x) {
    var hoy = hoyIso(), porTarifa = {}, orden = [], abierto = null;
    for (var d = 1; d <= diasDelMes(x.a, x.m); d++) {
      var f = iso(x.a, x.m, d), t = f >= hoy && esLibre(f) ? tarifaDe(f) : null;
      if (t && abierto && abierto.tarifa === t) { abierto.hasta = d; continue; }
      abierto = t ? { tarifa: t, desde: d, hasta: d } : null;
      if (!abierto) continue;
      if (!porTarifa[t]) { porTarifa[t] = []; orden.push(t); }
      porTarifa[t].push(abierto);
    }
    return orden.map(function (t) {
      var partes = porTarifa[t].map(function (r) { return r.desde === r.hasta ? 'el ' + r.desde : 'del ' + r.desde + ' al ' + r.hasta; });
      var texto = partes.length > 1 ? partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] : partes[0];
      return { tarifa: t, titulo: mayuscula(texto) + ' de ' + MESES[x.m] };
    });
  }

  function pintarPrecios() {
    var x = meses[mesSel], cont = $('periodos');
    var etiqueta = datos.grupos.find(function (g) { return g.id === grupoSel; }).etiqueta;
    var tramos = x.libres ? tramosDelMes(x) : [];
    if (!tramos.length) {
      cont.innerHTML = '<div class="completo"><strong>' + mayuscula(MESES[x.m]) + ' está completo</strong>Pruebe con otro mes o pregúntenos por si hubiera alguna cancelación.</div>';
    } else {
      cont.innerHTML = tramos.map(function (tr) {
        var precios = datos.tarifas[tr.tarifa][grupoSel] || [];
        var celdas = NOCHES.map(function (n, i) {
          return precios[i] == null ? '' : '<li><span>' + n + ' noches</span><strong>' + euros(precios[i]) + '</strong></li>';
        }).join('');
        return '<div class="periodo"><h4>' + tr.titulo + '</h4>' +
          (celdas ? '<ul>' + celdas + '</ul>' : '<p class="nota">Consúltenos el precio para este grupo.</p>') + '</div>';
      }).join('');
    }
    var mensaje = 'Hola, me gustaría reservar en Caserío Las Viñas en ' + MESES[x.m] + ' de ' + x.a + ' para ' + etiqueta + '.';
    $('cta-tarifas').href = 'https://wa.me/' + TELEFONO + '?text=' + encodeURIComponent(mensaje);
  }

  function pintarGrupos() {
    $('grupos').innerHTML = datos.grupos.map(function (g) {
      return '<div><input type="radio" name="grupo" id="g-' + g.id + '" value="' + g.id + '"' + (g.id === grupoSel ? ' checked' : '') + '><label for="g-' + g.id + '">' + g.etiqueta + '</label></div>';
    }).join('');
    $('grupos').addEventListener('change', function (e) { grupoSel = e.target.value; pintarPrecios(); });
  }

  /* ---------- Lectura de la hoja de Google (CSV) ---------- */
  function leerCsv(texto) {
    var filas = [], fila = [], campo = '', comillas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (comillas) {
        if (c !== '"') campo += c;
        else if (texto[i + 1] === '"') { campo += '"'; i++; }
        else comillas = false;
      } else if (c === '"') comillas = true;
      else if (c === ',') { fila.push(campo); campo = ''; }
      else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
      else if (c !== '\r') campo += c;
    }
    if (campo || fila.length) { fila.push(campo); filas.push(fila); }
    return filas;
  }
  /* Admite 27/11/2026, 27-11-2026 y 2026-11-27 */
  function leerFecha(s) {
    s = (s || '').trim();
    var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) return iso(+m[3], +m[2] - 1, +m[1]);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  }
  /* Admite 350, 1.200, 1200 € y 350,00 €; vacío = estancia no ofertada */
  function leerPrecio(s) {
    var n = parseInt(String(s || '').replace(/,\d{1,2}\D*$/, '').replace(/\D/g, ''), 10);
    return isNaN(n) ? null : n;
  }
  /* Admite «marzo 2027», «Mar 2027», «03/2027»… Devuelve '2027-03' */
  function leerMes(s) {
    s = clave(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
    var anio = s.match(/\b(20\d{2})\b/);
    if (!anio) return null;
    var resto = s.replace(anio[1], ''), num = resto.match(/\b(\d{1,2})\b/), m = -1;
    var letras = (resto.match(/[a-z]{3,}/) || [''])[0].slice(0, 3);
    if (letras) m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].indexOf(letras);
    if (m < 0 && letras) m = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(letras);
    if (m < 0 && num) m = +num[1] - 1;
    return m >= 0 && m < 12 ? anio[1] + '-' + String(m + 1).padStart(2, '0') : null;
  }

  function datosDeHoja(csvCalendario, csvPrecios, csvTemporadas) {
    /* Calendario: una fila por mes, una columna por día; cualquier texto en la casilla = ocupado */
    var mesesAbiertos = {};
    leerCsv(csvCalendario).slice(1).forEach(function (f) {
      var k = leerMes(f[0]);
      if (!k) return;
      var ocupados = {}, n = diasDelMes(+k.slice(0, 4), +k.slice(5) - 1);
      for (var d = 1; d <= n; d++) if ((f[d] || '').trim()) ocupados[d] = true;
      mesesAbiertos[k] = ocupados;
    });
    /* Precios: tarifa, personas y precio por noches; el nombre de la tarifa puede dejarse solo en su primera fila */
    var grupos = [], tarifas = {}, normal = null, ultima = '';
    leerCsv(csvPrecios).slice(1).forEach(function (f) {
      var nombre = clave(f[0]) || ultima, personas = (f[1] || '').trim().replace(/\s*(?:[-–]|\ba\b)\s*/i, '–');
      ultima = nombre;
      if (!nombre || !personas) return;
      var id = 'g' + personas.replace(/\D+/g, '_');
      if (!grupos.some(function (g) { return g.id === id; })) {
        grupos.push({ id: id, etiqueta: /persona/i.test(personas) ? personas : personas + ' personas' });
      }
      if (!tarifas[nombre]) { tarifas[nombre] = {}; if (!normal) normal = nombre; }
      tarifas[nombre][id] = NOCHES.map(function (n, i) { return leerPrecio(f[2 + i]); });
    });
    /* Temporadas: fechas en las que se aplica una tarifa distinta de la normal */
    var temporadas = leerCsv(csvTemporadas).slice(1).map(function (f) {
      return { desde: leerFecha(f[0]), hasta: leerFecha(f[1]), tarifa: clave(f[2]) };
    }).filter(function (t) { return t.desde && t.hasta && t.desde <= t.hasta && tarifas[t.tarifa]; });
    if (!normal || !Object.keys(mesesAbiertos).length) throw new Error('La hoja está vacía o incompleta');
    return { grupos: grupos, meses: mesesAbiertos, tarifas: tarifas, normal: normal, temporadas: temporadas };
  }

  function datosDeJson(j) {
    var mesesAbiertos = {}, tarifas = {}, normal = null;
    Object.keys(j.ocupados).forEach(function (k) {
      mesesAbiertos[k] = {};
      j.ocupados[k].forEach(function (d) { mesesAbiertos[k][d] = true; });
    });
    Object.keys(j.tarifas).forEach(function (n) { tarifas[clave(n)] = j.tarifas[n]; if (!normal) normal = clave(n); });
    return {
      grupos: j.grupos, meses: mesesAbiertos, tarifas: tarifas, normal: normal,
      temporadas: j.temporadas.map(function (t) { return { desde: t.desde, hasta: t.hasta, tarifa: clave(t.tarifa) }; })
    };
  }

  function cargarDatos() {
    function respaldo() {
      return fetch('tarifas.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(datosDeJson);
    }
    if (!HOJA_ID) return respaldo();
    return Promise.all(PESTANAS.map(function (nombre) {
      return fetch(urlPestana(nombre), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
    })).then(function (t) {
      var d = datosDeHoja(t[0], t[1], t[2]);
      d.origen = 'hoja';
      return d;
    }).catch(respaldo);
  }

  cargarDatos()
    .then(function (d) {
      datos = d;
      grupoSel = datos.grupos[0].id;
      prepararMeses();
      $('tarifas-app').setAttribute('data-origen', datos.origen || 'respaldo');
      pintarMeses();
      pintarGrupos();
      elegirMes(mesSel);
      $('mes-ant').addEventListener('click', function () { elegirMes(mesSel - 1); });
      $('mes-sig').addEventListener('click', function () { elegirMes(mesSel + 1); });
    })
    .catch(function () {
      $('tarifas-app').innerHTML = '<p>No se ha podido cargar el calendario. <a href="https://wa.me/' + TELEFONO + '">Consúltenos por WhatsApp</a> y le informamos al momento.</p>';
    });
})();
