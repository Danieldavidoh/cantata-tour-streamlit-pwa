let route = [], dates = {}, distances = {}, venues = {};
cities.forEach(c => venues[c] = []);

function startTour() {
  const city = document.getElementById('startCity').value;
  if (route.includes(city)) return;
  route = [city];
  dates[city] = new Date().toISOString().split('T')[0];
  updateUI();
}

function addCity() {
  const city = document.getElementById('nextCity').value;
  if (route.includes(city)) return;
  route.push(city);
  const prev = route[route.length - 2];
  const [lat1, lon1] = coords[prev], [lat2, lon2] = coords[city];
  const km = Math.round(haversine(lat1, lon1, lat2, lon2));
  const hrs = (km / 50).toFixed(1);
  if (!distances[prev]) distances[prev] = {};
  distances[prev][city] = [km, hrs];
  if (!distances[city]) distances[city] = {};
  distances[city][prev] = [km, hrs];
  const prevDate = new Date(dates[prev]);
  prevDate.setHours(prevDate.getHours() + Math.round(hrs));
  dates[city] = prevDate.toISOString().split('T')[0];
  updateUI();
}

function updateUI() {
  document.getElementById('routeSection').style.display = route.length ? 'block' : 'none';
  document.getElementById('routeDisplay').innerText = route.join(' → ');
  let totalKm = 0, totalHrs = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const [km, hrs] = distances[route[i]][route[i+1]];
    totalKm += km; totalHrs += parseFloat(hrs);
  }
  document.getElementById('totalDist').innerText = totalKm;
  document.getElementById('totalTime').innerText = totalHrs.toFixed(1);

  const list = document.getElementById('cityList');
  list.innerHTML = '';
  route.forEach((city, i) => {
    const div = document.createElement('div');
    div.style = 'border:1px solid #ddd; margin:10px 0; padding:15px; border-radius:10px;';
    const dateInput = `<input type="date" value="${dates[city]}" onchange="updateDate('${city}', this.value)">`;
    div.innerHTML = `<h3>${city} ${dateInput}</h3><div id="venues-${city}"></div>`;
    if (i < route.length - 1) {
      const [km, hrs] = distances[city][route[i+1]];
      div.innerHTML += `<p style="text-align:center; color:#666;">↓ ${km}km | ${hrs}h ↓</p>`;
    }
    list.appendChild(div);
    updateVenues(city);
  });
  updateMap();
  updateSelects();
}

function updateDate(city, newDate) {
  dates[city] = newDate;
}

function updateVenues(city) {
  const container = document.getElementById(`venues-${city}`);
  if (!container) return;
  container.innerHTML = '';
  venues[city].forEach((v, idx) => {
    const div = document.createElement('div');
    div.className = 'venue';
    div.innerHTML = `
      <p><strong>${v.venue}</strong> (${v.seats} seats)</p>
      <p><a href="${v.link}" target="_blank">구글 지도 열기</a></p>
      <button onclick="deleteVenue('${city}', ${idx})">삭제</button>
    `;
    container.appendChild(div);
  });
  const form = document.createElement('div');
  form.innerHTML = `
    <input placeholder="공연장 이름" id="v-${city}">
    <input type="number" placeholder="좌석" id="s-${city}" min="1">
    <input placeholder="구글 맵 링크" id="l-${city}">
    <button onclick="addVenue('${city}')">등록</button>
  `;
  container.appendChild(form);
}

function addVenue(city) {
  const venue = document.getElementById(`v-${city}`).value;
  const seats = document.getElementById(`s-${city}`).value;
  const link = document.getElementById(`l-${city}`).value;
  if (venue && seats) {
    venues[city].push({venue, seats, link});
    updateVenues(city);
  }
}

function deleteVenue(city, idx) {
  venues[city].splice(idx, 1);
  updateVenues(city);
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371;
  const dlat = toRad(lat2 - lat1), dlon = toRad(lon2 - lon1);
  const a = Math.sin(dlat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function updateMap() {
  const mapDiv = document.getElementById('map');
  if (!window.myMap) {
    window.myMap = L.map(mapDiv).setView([19.75, 75.71], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.myMap);
  }
  window.myMap.eachLayer(l => l !== window.myMap._tileLayer && window.myMap.removeLayer(l));
  const routeCoords = route.map(c => coords[c]);
  if (routeCoords.length > 1) L.polyline(routeCoords, {color: 'red', weight: 4, dashArray: '5,10'}).addTo(window.myMap);
  route.forEach(city => {
    const marker = L.circleMarker(coords[city], {radius: 12, color: '#2E8B57', fillColor: '#90EE90'}).addTo(window.myMap);
    const popup = `<b>${city}</b><br>날짜: ${dates[city]}`;
    marker.bindPopup(popup);
  });
  if (routeCoords.length) window.myMap.fitBounds(L.latLngBounds(routeCoords.map(c => [c[0], c[1]])));
}

function updateSelects() {
  const startSel = document.getElementById('startCity');
  const nextSel = document.getElementById('nextCity');
  [startSel, nextSel].forEach(sel => {
    sel.innerHTML = '';
    const opts = sel.id === 'startCity' ? cities : cities.filter(c => !route.includes(c));
    opts.forEach(c => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = c;
      if (c === 'Mumbai' && sel.id === 'startCity') opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

function resetAll() {
  if (confirm('전체 초기화할까요?')) {
    route = []; dates = {}; distances = {}; venues = {};
    cities.forEach(c => venues[c] = []);
    document.getElementById('routeSection').style.display = 'none';
    updateSelects();
  }
}

updateSelects();
