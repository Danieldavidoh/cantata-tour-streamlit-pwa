let route = [], dates = {}, distances = {}, venues = {};
for (let c of cities) venues[c] = [];

function startTour() {
  const city = document.getElementById('startCity').value;
  if (!route.includes(city)) {
    route = [city];
    dates[city] = new Date().toISOString().split('T')[0];
    updateUI();
    alert(`${city}에서 투어가 시작되었습니다!`);
  }
}

function addCity() {
  const city = document.getElementById('nextCity').value;
  if (route.includes(city)) return;
  route.push(city);
  const prev = route[route.length-2];
  const [lat1, lon1] = coords[prev], [lat2, lon2] = coords[city];
  const km = Math.round(haversine(lat1, lon1, lat2, lon2));
  const hrs = (km / 50).toFixed(1);
  distances[prev] = distances[prev] || {}; distances[prev][city] = [km, hrs];
  distances[city] = distances[city] || {}; distances[city][prev] = [km, hrs];
  dates[city] = addHours(dates[prev], hrs);
  updateUI();
}

function updateUI() {
  document.getElementById('routeSection').style.display = 'block';
  document.getElementById('routeDisplay').innerText = route.join(' → ');
  const total = route.slice(0, -1).reduce((a, c) => a + (distances[c][route[route.indexOf(c)+1]][0] || 0), 0);
  document.getElementById('totalDist').innerText = total;
  document.getElementById('totalTime').innerText = (total / 50).toFixed(1);

  // 도시 목록
  const list = document.getElementById('cityList');
  list.innerHTML = '';
  route.forEach((city, i) => {
    const div = document.createElement('div');
    div.innerHTML = `<h3>${city} (${dates[city]})</h3><div id="venues-${city}"></div>`;
    list.appendChild(div);
    updateVenues(city);
    if (i < route.length - 1) {
      const [km, hrs] = distances[city][route[i+1]];
      div.innerHTML += `<p style="text-align:center; color:#666;">↓ ${km}km | ${hrs}h ↓</p>`;
    }
  });

  updateMap();
  updateSelects();
}

function updateSelects() {
  const start = document.getElementById('startCity'), next = document.getElementById('nextCity');
  [start, next].forEach(sel => {
    sel.innerHTML = '';
    const opts = sel.id === 'startCity' ? cities : cities.filter(c => !route.includes(c));
    opts.forEach(c => {
      const opt = document.createElement('option');
      opt.value = opt.text = c;
      if (sel.id === 'startCity' && c === 'Mumbai') opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371;
  const dlat = toRad(lat2 - lat1), dlon = toRad(lon2 - lon1);
  const a = Math.sin(dlat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function addHours(dateStr, hrs) {
  const d = new Date(dateStr);
  d.setHours(d.getHours() + Math.round(hrs));
  return d.toISOString().split('T')[0];
}

function updateMap() {
  const mapDiv = document.getElementById('map');
  if (!window.map) {
    window.map = L.map(mapDiv).setView([19.75, 75.71], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
  }
  window.map.eachLayer(l => l !== window.map._tileLayer && window.map.removeLayer(l));
  const routeCoords = route.map(c => coords[c]);
  if (routeCoords.length > 1) L.polyline(routeCoords, {color: 'red', dashArray: '5,10'}).addTo(window.map);
  route.forEach(city => {
    const marker = L.circleMarker(coords[city], {radius: 12, color: '#2E8B57', fillColor: '#90EE90'}).addTo(window.map);
    const popup = `<b>${city}</b><br>날짜: ${dates[city]}`;
    marker.bindPopup(popup);
  });
  if (routeCoords.length) window.map.fitBounds(L.latLngBounds(routeCoords.map(c => [c[0], c[1]])));
}

function resetAll() {
  if (confirm('모든 데이터를 초기화할까요?')) {
    route = []; dates = {}; distances = {}; venues = {};
    for (let c of cities) venues[c] = [];
    document.getElementById('routeSection').style.display = 'none';
    updateSelects();
  }
}

updateSelects();
