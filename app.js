// Weather for Wear - Controller
import * as Logic from './js/logic.js';

// Configuration
const CONFIG = {
    apiBase: 'https://api.open-meteo.com/v1/forecast',
    geoBase: 'https://geocoding-api.open-meteo.com/v1/search',
    defaultLat: 51.5074,
    defaultLon: -0.1278
};

// Global State
let state = {
    lat: CONFIG.defaultLat,
    lon: CONFIG.defaultLon,
    city: null,
    country: null,
    source: null,
    timezone: "GMT", // Default
    units: 'metric', // 'metric' (C) or 'imperial' (F)
    weatherData: null // Store last fetch for re-rendering units
};

// DOM Elements
const ui = {
    location: document.getElementById('location-display'),
    geoSource: document.getElementById('geo-source'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    searchCancel: document.getElementById('search-cancel'),
    suggestions: document.getElementById('suggestions-list'),
    useGpsBtn: document.getElementById('use-gps-btn'),
    unitToggle: document.getElementById('unit-toggle'),
    
    clothing: document.getElementById('clothing-recommendation'),
    accessories: document.getElementById('accessories-recommendation'),
    timeline: document.getElementById('timeline-display'),
    
    temp: document.getElementById('temp-display'),
    feelsLike: document.getElementById('feels-like-display'),
    wind: document.getElementById('wind-display'),
    rain: document.getElementById('rain-display'),
    status: document.getElementById('status-msg'),
    refreshBtn: document.getElementById('refresh-btn')
};

// --- Storage Logic ---
const STORAGE_KEY = 'weather_app_loc';

function saveLocation(lat, lon, city, country, source) {
    const data = { lat, lon, city, country, source, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadSavedLocation() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

// --- Controller Logic ---

function formatTemp(celsius) {
    if (state.units === 'imperial') {
        const f = Logic.celsiusToFahrenheit(celsius);
        return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
}

function updateTimelineUI(hourly) {
    // Logic: Find the *current hour* in the *target timezone*
    // The API returns 'time' as ISO strings. Logic.formatLocalTime handles the zone.
    
    const hoursToCheck = [3, 6, 9, 12];
    let html = '';
    
    // We need to find the index that corresponds to "Now" in the data?
    // Open-Meteo hourly data starts at 00:00 Today (usually).
    // But simplistic approach: Just take the next few slots relative to *Now*.
    // Better: Filter for future times.
    
    const now = new Date();
    // This part is tricky. 'hourly.time' is array of ISO strings.
    // We just want to show the next few representative slots.
    // Let's stick to the offset method but check bounds.
    
    // Find index of current hour? 
    // Actually, Open-Meteo current=temperature_2m gives us Right Now.
    // The hourly array is 24h for today.
    // Let's just pick hours: 9am, 12pm, 6pm, 9pm? 
    // Or just +3, +6 from now (System time).
    
    const currentHourIndex = now.getHours(); // 0-23 (Approx matches array index if data is today)
    
    hoursToCheck.forEach(offset => {
        const targetIndex = currentHourIndex + offset;
        if (targetIndex >= hourly.time.length) return; // End of day

        const timeStr = hourly.time[targetIndex];
        // FIX 1.1: Use Timezone
        const hourLabel = Logic.formatLocalTime(timeStr, state.timezone);
        
        const temp = hourly.apparent_temperature[targetIndex];
        const rain = hourly.precipitation_probability[targetIndex];
        const wind = hourly.wind_speed_10m[targetIndex];
        const weatherCode = hourly.weather_code ? hourly.weather_code[targetIndex] : 0;

        // Use Logic for Verdict
        const warmScore = Logic.calculateWarmthScore(temp, wind || 0, rain);
        const verdict = Logic.getClothingVerdict(warmScore, wind || 0, rain);
        
        // FIX 1.3: Use WMO Icons
        // If rain > 50, force rain icon, else use code
        let iconClass = Logic.getWeatherIcon(weatherCode);
        if (rain > 50) iconClass = 'ph-cloud-rain'; // Override

        html += `
            <div class="shrink-0 bg-zinc-900 border border-zinc-800 p-3 rounded w-32 flex flex-col justify-between">
                <div class="text-xs text-zinc-500 font-mono mb-1">${hourLabel}</div>
                <div class="font-bold text-sm leading-tight mb-1">${verdict.main}</div>
                <div class="text-[10px] text-zinc-400 flex items-center gap-1">
                    <i class="ph ${iconClass}"></i> ${formatTemp(temp)}
                </div>
            </div>
        `;
    });
    
    ui.timeline.innerHTML = html;
}

function render() {
    if (!state.weatherData) return;
    const data = state.weatherData;
    const current = data.current;
    
    // 1. Calc Verdict
    const next6HoursRain = data.hourly.precipitation_probability.slice(0, 6);
    const rainChance = Math.max(...next6HoursRain);
    
    const warmScore = Logic.calculateWarmthScore(current.apparent_temperature, current.wind_speed_10m, rainChance);
    const verdict = Logic.getClothingVerdict(warmScore, current.wind_speed_10m, rainChance);

    ui.clothing.innerText = verdict.main;
    ui.accessories.innerText = verdict.sub;

    // 2. Timeline
    updateTimelineUI(data.hourly);

    // 3. Stats (with Unit Conv)
    ui.temp.innerText = formatTemp(current.temperature_2m);
    ui.feelsLike.innerText = formatTemp(current.apparent_temperature);
    ui.wind.innerText = `${Math.round(current.wind_speed_10m)} km/h`; // Wind usually km/h default
    ui.rain.innerText = `${rainChance}%`;
    
    // 4. Unit Toggle State
    ui.unitToggle.innerText = state.units === 'metric' ? '°C' : '°F';
    ui.unitToggle.classList.toggle('text-white', state.units === 'imperial');
}

async function fetchWeather(lat, lon, sourceLabel, cityName = null, country = null) {
    ui.status.innerText = "Fetching...";
    ui.geoSource.innerText = sourceLabel;
    
    state.lat = lat;
    state.lon = lon;
    state.source = sourceLabel;
    if (cityName) { state.city = cityName; state.country = country; }
    
    if (cityName) {
        ui.location.innerHTML = `${cityName}, ${country || ''} <i class="ph ph-pencil-simple text-sm text-zinc-600"></i>`;
    }

    try {
        // REQUEST TIMEZONE & WMO CODES
        const url = `${CONFIG.apiBase}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m&hourly=precipitation_probability,apparent_temperature,wind_speed_10m,weather_code&forecast_days=1&timezone=auto`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();
        
        // Store Data & Timezone
        state.weatherData = data;
        state.timezone = data.timezone; // API returns "Europe/London" etc.
        
        render(); // Update UI
        
        ui.status.innerText = `Updated: ${new Date().toLocaleTimeString()}`;
        
    } catch (error) {
        console.error(error);
        ui.status.innerText = "Error.";
        ui.clothing.innerText = "Offline?";
    }
}

// --- Search Logic ---
// ... (Keeping existing Search/Autocomplete Logic mostly as-is, just compacting)
async function fetchSuggestions(query) {
    if (query.length < 2) { ui.suggestions.classList.add('hidden'); return; }
    try {
        const res = await fetch(`${CONFIG.geoBase}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await res.json();
        if (data.results) renderSuggestions(data.results);
    } catch (e) {}
}

function renderSuggestions(places) {
    ui.suggestions.innerHTML = places.map(p => `
        <li class="p-2 hover:bg-zinc-800 cursor-pointer text-sm flex flex-col border-b border-zinc-800" 
            data-lat="${p.latitude}" data-lon="${p.longitude}" data-name="${p.name}" data-country="${p.country_code}">
            <span class="font-bold text-white">${p.name}</span>
            <span class="text-[10px] text-zinc-500">${p.admin1 || ''}, ${p.country || ''}</span>
        </li>`).join('');
    ui.suggestions.classList.remove('hidden');
    Array.from(ui.suggestions.children).forEach(li => {
        li.addEventListener('click', () => {
            ui.searchForm.classList.add('hidden');
            ui.searchInput.value = '';
            fetchWeather(li.dataset.lat, li.dataset.lon, "Manual", li.dataset.name, li.dataset.country);
            saveLocation(li.dataset.lat, li.dataset.lon, li.dataset.name, li.dataset.country, "Manual");
        });
    });
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- Init ---
async function init(forceLocate = false) {
    if (!forceLocate) {
        const saved = loadSavedLocation();
        if (saved) {
            fetchWeather(saved.lat, saved.lon, saved.source, saved.city, saved.country);
            return;
        }
    }
    
    ui.status.innerText = "Locating...";
    try {
        const pos = await getBrowserLocation();
        const { latitude: lat, longitude: lon } = pos.coords;
        
        // Reverse Geo
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
            .then(r => r.json())
            .then(d => {
                const city = d.city || d.locality;
                fetchWeather(lat, lon, "GPS", city, d.countryCode);
                saveLocation(lat, lon, city, d.countryCode, "GPS");
            });

    } catch (e) {
        try {
            const ip = await (await fetch('https://ipapi.co/json/')).json();
            fetchWeather(ip.latitude, ip.longitude, "IP", ip.city, ip.country_code);
            saveLocation(ip.latitude, ip.longitude, ip.city, ip.country_code, "IP");
        } catch (err) {
            fetchWeather(CONFIG.defaultLat, CONFIG.defaultLon, "Default", "London", "GB");
        }
    }
}

function getBrowserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject();
        const t = setTimeout(() => reject(), 10000);
        navigator.geolocation.getCurrentPosition(p => { clearTimeout(t); resolve(p); }, e => { clearTimeout(t); reject(e); }, { timeout: 10000 });
    });
}

// Listeners
ui.location.addEventListener('click', () => { ui.searchForm.classList.remove('hidden'); ui.searchInput.focus(); });
ui.searchCancel.addEventListener('click', () => ui.searchForm.classList.add('hidden'));
ui.searchInput.addEventListener('input', debounce((e) => fetchSuggestions(e.target.value), 300));
ui.refreshBtn.addEventListener('click', () => fetchWeather(state.lat, state.lon, state.source, state.city, state.country));
ui.useGpsBtn.addEventListener('click', () => { ui.searchForm.classList.add('hidden'); localStorage.removeItem(STORAGE_KEY); init(true); });

// Unit Toggle Listener
ui.unitToggle.addEventListener('click', () => {
    state.units = state.units === 'metric' ? 'imperial' : 'metric';
    render(); // Re-render without fetching
});

init();
