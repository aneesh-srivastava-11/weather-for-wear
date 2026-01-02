// Weather for Wear - Controller
import * as Logic from './js/logic.js';

const CONFIG = {
    apiBase: 'https://api.open-meteo.com/v1/forecast',
    geoBase: 'https://geocoding-api.open-meteo.com/v1/search',
    defaultLat: 51.5074,
    defaultLon: -0.1278
};

let state = {
    lat: CONFIG.defaultLat,
    lon: CONFIG.defaultLon,
    city: null,
    country: null,
    source: null,
    timezone: "GMT",
    units: 'metric',
    activity: 'walking',
    weatherData: null
};

// DOM Elements
const ui = {
    body: document.body,
    location: document.getElementById('location-display'),
    geoSource: document.getElementById('geo-source'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    searchCancel: document.getElementById('search-cancel'),
    suggestions: document.getElementById('suggestions-list'),
    useGpsBtn: document.getElementById('use-gps-btn'),
    unitToggle: document.getElementById('unit-toggle'),
    activityToggle: document.getElementById('activity-toggle'),
    
    loader: document.getElementById('loader-skeleton'),
    content: document.getElementById('content-area'),
    
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

const STORAGE_KEY = 'weather_app_loc';

function saveLocation(lat, lon, city, country, source) {
    const data = { lat, lon, city, country, source, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadSavedLocation() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

// --- Logic Helpers ---

function setLoading(isLoading) {
    if (isLoading) {
        ui.loader.classList.remove('hidden');
        ui.content.classList.add('hidden');
    } else {
        ui.loader.classList.add('hidden');
        ui.content.classList.remove('hidden');
    }
}

function updateTheme(isDay, weatherCode) {
    // Reset classes
    ui.body.className = "text-white antialiased min-h-screen flex items-center justify-center p-4 transition-colors duration-1000";
    
    let themeClass = "bg-night-clear"; // Default
    
    if (isDay) {
        if (weatherCode >= 51) themeClass = "bg-rain";
        else if (weatherCode >= 1) themeClass = "bg-day-cloud";
        else themeClass = "bg-day-clear";
    } else {
        if (weatherCode >= 51) themeClass = "bg-rain";
        else if (weatherCode >= 1) themeClass = "bg-night-cloud";
        else themeClass = "bg-night-clear";
    }
    
    ui.body.classList.add(themeClass);
}

function formatTemp(celsius) {
    if (state.units === 'imperial') {
        const f = Logic.celsiusToFahrenheit(celsius);
        return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
}

function updateTimelineUI(hourly) {
    const hoursToCheck = [3, 6, 9, 12];
    let html = '';
    const now = new Date();
    const currentHourIndex = now.getHours(); 
    
    hoursToCheck.forEach(offset => {
        const targetIndex = currentHourIndex + offset;
        if (targetIndex >= hourly.time.length) return;

        const timeStr = hourly.time[targetIndex];
        const hourLabel = Logic.formatLocalTime(timeStr, state.timezone);
        const temp = hourly.apparent_temperature[targetIndex];
        const rain = hourly.precipitation_probability[targetIndex];
        const wind = hourly.wind_speed_10m[targetIndex];
        const weatherCode = hourly.weather_code ? hourly.weather_code[targetIndex] : 0;
        
        const hour = new Date(timeStr).getHours();
        const isDay = hour >= 6 && hour <= 18; 

        const warmScore = Logic.calculateWarmthScore(temp, wind || 0, rain, state.activity);
        const verdict = Logic.getClothingVerdict(warmScore, wind || 0, rain, isDay, 0); 
        
        let iconClass = Logic.getWeatherIcon(weatherCode);
        if (rain > 50) iconClass = 'ph-cloud-rain';

        // Timeline Card Design
        html += `
            <div class="shrink-0 glass-panel p-3 rounded-2xl w-28 flex flex-col justify-between items-center text-center snap-center hover:bg-white/10 transition-colors">
                <div class="text-[10px] font-mono opacity-60 mb-1">${hourLabel}</div>
                <div class="font-bold text-xs leading-tight mb-2 h-8 flex items-center justify-center">${verdict.main}</div>
                <div class="text-xs opacity-80 flex items-center gap-1 font-mono">
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
    
    // Theme Update
    updateTheme(current.is_day === 1, current.weather_code);

    // Data Update
    const next6HoursRain = data.hourly.precipitation_probability.slice(0, 6);
    const rainChance = Math.max(...next6HoursRain);
    
    const warmScore = Logic.calculateWarmthScore(current.apparent_temperature, current.wind_speed_10m, rainChance, state.activity);
    const verdict = Logic.getClothingVerdict(warmScore, current.wind_speed_10m, rainChance, current.is_day === 1, current.cloud_cover);

    ui.clothing.innerText = verdict.main;
    ui.accessories.innerText = verdict.sub;

    updateTimelineUI(data.hourly);

    ui.temp.innerText = formatTemp(current.temperature_2m);
    ui.feelsLike.innerText = formatTemp(current.apparent_temperature);
    ui.wind.innerText = `${Math.round(current.wind_speed_10m)}`;
    ui.rain.innerText = `${rainChance}%`;
    
    // UI Toggles
    ui.unitToggle.innerText = state.units === 'metric' ? '°C' : '°F';
    ui.unitToggle.classList.toggle('bg-white', state.units === 'imperial');
    ui.unitToggle.classList.toggle('text-black', state.units === 'imperial');

    const activityBtn = ui.activityToggle;
    if (state.activity === 'running') {
        activityBtn.innerHTML = '<i class="ph ph-person-simple-run text-lg"></i>';
        activityBtn.classList.add('bg-white', 'text-black');
    } else {
        activityBtn.innerHTML = '<i class="ph ph-pedestrian text-lg"></i>';
        activityBtn.classList.remove('bg-white', 'text-black');
    }
}

async function fetchWeather(lat, lon, sourceLabel, cityName = null, country = null) {
    setLoading(true);
    ui.geoSource.innerText = sourceLabel;
    
    state.lat = lat;
    state.lon = lon;
    state.source = sourceLabel;
    if (cityName) { state.city = cityName; state.country = country; }
    
    if (cityName) {
        ui.location.innerHTML = `${cityName} <i class="ph ph-caret-down text-lg opacity-70"></i>`;
    }

    try {
        const url = `${CONFIG.apiBase}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m,is_day,cloud_cover&hourly=precipitation_probability,apparent_temperature,wind_speed_10m,weather_code&forecast_days=1&timezone=auto`;
        
        // Artificial delay for skeleton demo (remove in prod if desired, but good for UX feel)
        await new Promise(r => setTimeout(r, 600)); 
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();
        state.weatherData = data;
        state.timezone = data.timezone;
        
        render();
        ui.status.innerText = `Updated: ${new Date().toLocaleTimeString()}`;
        setLoading(false);
        
    } catch (error) {
        console.error(error);
        ui.status.innerText = "Error.";
        setLoading(false);
    }
}

// --- Search ---
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
        <li class="p-2 hover:bg-white/10 cursor-pointer text-sm flex flex-col border-b border-white/10 last:border-0 rounded-lg transition-colors" 
            data-lat="${p.latitude}" data-lon="${p.longitude}" data-name="${p.name}" data-country="${p.country_code}">
            <span class="font-bold text-white">${p.name}</span>
            <span class="text-[10px] text-white/50">${p.admin1 || ''}, ${p.country || ''}</span>
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

async function init(forceLocate = false) {
    if (!forceLocate) {
        const saved = loadSavedLocation();
        if (saved) {
            fetchWeather(saved.lat, saved.lon, saved.source, saved.city, saved.country);
            return;
        }
    }
    
    setLoading(true);
    ui.status.innerText = "Locating...";
    try {
        const pos = await getBrowserLocation();
        const { latitude: lat, longitude: lon } = pos.coords;
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
ui.location.addEventListener('click', (e) => { 
    e.stopPropagation();
    ui.searchForm.classList.remove('hidden'); 
    ui.searchInput.focus(); 
});
document.addEventListener('click', (e) => {
    if (!ui.searchForm.contains(e.target) && !ui.location.contains(e.target)) {
        ui.searchForm.classList.add('hidden');
    }
});
ui.searchCancel.addEventListener('click', () => ui.searchForm.classList.add('hidden'));
ui.searchInput.addEventListener('input', debounce((e) => fetchSuggestions(e.target.value), 300));
ui.refreshBtn.addEventListener('click', () => fetchWeather(state.lat, state.lon, state.source, state.city, state.country));
ui.useGpsBtn.addEventListener('click', () => { ui.searchForm.classList.add('hidden'); localStorage.removeItem(STORAGE_KEY); init(true); });

ui.unitToggle.addEventListener('click', () => {
    state.units = state.units === 'metric' ? 'imperial' : 'metric';
    render();
});

ui.activityToggle.addEventListener('click', () => {
    state.activity = state.activity === 'walking' ? 'running' : 'walking';
    render();
});

init();
