// Pure Business Logic - No DOM Dependency

// 1. Unit Conversion
export function celsiusToFahrenheit(c) {
    return (c * 9/5) + 32;
}

// 2. WMO Weather Code to Icon Mapping
export function getWeatherIcon(code) {
    // Codes: https://open-meteo.com/en/docs
    // 0: Clear, 1-3: Cloudy, 45/48: Fog, 51-57: Drizzle
    // 61-67: Rain, 71-77: Snow, 80-82: Showers, 95-99: Thunder
    
    if (code === 0) return 'ph-sun';
    if (code >= 1 && code <= 3) return 'ph-cloud';
    if (code === 45 || code === 48) return 'ph-cloud-fog';
    if (code >= 51 && code <= 67) return 'ph-cloud-rain';
    if (code >= 71 && code <= 77) return 'ph-snowflake';
    if (code >= 80 && code <= 82) return 'ph-cloud-rain'; // Showers
    if (code >= 95 && code <= 99) return 'ph-cloud-lightning';
    
    return 'ph-question'; // Fallback
}

// 3. Warmth Score Algorithm
export function calculateWarmthScore(feelsLike, windSpeed, rainProb) {
    let score = (22 - feelsLike) / 3.5; // Base
    
    if (feelsLike < 20) {
        score += (windSpeed / 15); // Wind chill penalty
    }
    
    if (rainProb > 40 && feelsLike < 15) {
        score += 1; // Wet penalty
    }
    
    return Math.max(0, score);
}

// 4. Clothing Verdict Map
export function getClothingVerdict(score, windSpeed, rainProb) {
    let main = "";
    let sub = [];

    if (score < 0.5) main = "Shorts & Tee";
    else if (score < 1.5) main = "T-Shirt";
    else if (score < 2.5) main = "Long Sleeves";
    else if (score < 3.5) main = "Hoodie / Light Jacket";
    else if (score < 5.0) main = "Coat or Layers";
    else if (score < 7.0) main = "Heavy Winter Coat";
    else main = "Thermals & Parka";

    // Accessories
    if (windSpeed > 25) sub.push("Windbreaker needed");
    if (rainProb > 50) sub.push("Umbrella Essential ☔");
    else if (rainProb > 20) sub.push("Risk of Rain");
    
    if (score < 1.5 && rainProb < 20 && windSpeed < 15) sub.push("Sunglasses 😎");
    if (score % 1 > 0.8 && score < 6) sub.push("Maybe layer up");

    return { main, sub: sub.join(" • ") };
}

// 5. Timezone Formatter
export function formatLocalTime(isoString, timezone) {
    if (!timezone) return "Unknown Time";
    // Returns "HH:MM" in the specific timezone
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: timezone 
    });
}
