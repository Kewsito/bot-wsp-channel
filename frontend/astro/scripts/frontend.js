// logica-frontend.js
// Lógica del mapa de operativos. Se carga desde index.astro como script externo.
// Requiere: Leaflet ya cargado en el head, y el div #map presente en el DOM.

document.addEventListener('DOMContentLoaded', function () {

  // --- DATOS HARDCODEADOS (paso 1 — reemplazar por fetchOperativos() cuando la API esté lista) ---
  /*var operativosHardcode = [
    {
      ubicacion: 'Lateral Circunvalación y España',
      lat: -31.5270,
      lng: -68.5300,
      timestamp: new Date().toISOString()
    },
    {
      ubicacion: 'Calle Salta antes de Saavedra',
      lat: -31.5350,
      lng: -68.5220,
      timestamp: new Date().toISOString()
    },
    {
      ubicacion: 'Ruta 40 pasando Calle 5. Norte.',
      lat: -31.5480,
      lng: -68.5430,
      timestamp: new Date().toISOString()
    }
  ];
*/
  // --- MAPA ---
  var map = L.map('map', {
    center: [-31.5375, -68.5364],
    zoom: 13,
  });
 
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
 
  var markersLayer = L.layerGroup().addTo(map);
 
  // --- HELPERS ---
  function makeIcon() {
    return L.divIcon({
      className: '',
      html: '<div style="width:13px;height:13px;border-radius:50%;background:#ef4444;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.35);"></div>',
      iconSize: [13, 13],
      iconAnchor: [6, 6],
      popupAnchor: [0, -10]
    });
  }
 
  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
 
  // --- RENDER ---
  function renderOperativos(data) {
    markersLayer.clearLayers();
 
    var list     = document.getElementById('list');
    var statTime = document.getElementById('stat-time');
    var statTotal = document.getElementById('stat-total');
    var counter  = document.getElementById('counter');
 
    if (statTime) {
      statTime.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
 
    if (!data || data.length === 0) {
      if (list)      list.innerHTML = '<div class="p-4 text-sm text-center text-slate-400">Sin operativos activos</div>';
      if (statTotal) statTotal.textContent = '0';
      if (counter)   counter.textContent = '0 activos';
      return;
    }
 
    if (statTotal) statTotal.textContent = data.length;
    if (counter)   counter.textContent = data.length + ' activo' + (data.length !== 1 ? 's' : '');
    if (list)      list.innerHTML = '';
 
    data.forEach(function (op) {
      var marker = null;
 
      if (op.lat && op.lng) {
        marker = L.marker([op.lat, op.lng], { icon: makeIcon() })
          .addTo(markersLayer)
          .bindPopup('<strong class="text-sm">' + (op.ubicacion || 'Operativo') + '</strong>');
      }
 
      var item = document.createElement('div');
      item.className = [
        'flex items-start gap-2.5 px-4 py-2.5',
        'border-b border-slate-100 dark:border-slate-800',
        'cursor-pointer transition-colors duration-100',
        'hover:bg-slate-50 dark:hover:bg-slate-800/60'
      ].join(' ');
 
      item.innerHTML =
        '<div class="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>' +
        '<div>' +
          '<p class="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">' +
            (op.ubicacion || 'Sin descripción') +
          '</p>' +
          '<p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">' +
            (op.timestamp ? formatTime(op.timestamp) : '') +
          '</p>' +
        '</div>';
 
      if (marker) {
        item.addEventListener('click', function () {
          map.setView([op.lat, op.lng], 16);
          marker.openPopup();
        });
      }
 
      if (list) list.appendChild(item);
    });
  }
 


  // --- ARRANQUE ---
  renderOperativos(fetchOperativos);

  var refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      renderOperativos(fetchOperativos);
    });
  }

  //TODO (paso 2): descomentar para conectar con la API real
  var API_URL = 'http://localhost:3001';
  async function fetchOperativos() {
    var badge = document.getElementById('badge');
    try {
      var res = await fetch(API_URL + '/api/operativos');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      var arr = data.mensajes || data.operativos || (Array.isArray(data) ? data : []);
      renderOperativos(arr);
    } catch(e) {
      if (badge) { badge.className = 'badge offline'; badge.textContent = 'OFFLINE'; }
      renderOperativos([]);
    }
  }
  fetchOperativos();
  setInterval(fetchOperativos, 60000);
});