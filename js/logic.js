// Pure Business Logic - No DOM Dependency

// 1. Unit Conversion
export function celsiusToFahrenheit(c) {
    return (c * 9/5) + 32;
}

// 2. WMO Weather Code to Icon Mapping
export function getWeatherIcon(code) {
    if (code === 0) return 'ph-sun';
    if (code >= 1 && code <= 3) return 'ph-cloud';
    if (code === 45 || code === 48) return 'ph-cloud-fog';
    if (code >= 51 && code <= 67) return 'ph-cloud-rain';
    if (code >= 71 && code <= 77) return 'ph-snowflake';
    if (code >= 80 && code <= 82) return 'ph-cloud-rain';
    if (code >= 95 && code <= 99) return 'ph-cloud-lightning';
    return 'ph-question';
}

// 3. Warmth Score Algorithm
/**
 * activity: 'walking' (1.0), 'running' (0.5), 'resting' (1.2)
 */
export function calculateWarmthScore(feelsLike, windSpeed, rainProb, activity = 'walking') {
    let score = (22 - feelsLike) / 3.5;
    
    // Wind penalty
    if (feelsLike < 20) {
        score += (windSpeed / 15);
    }
    
    // Rain penalty
    if (rainProb > 40 && feelsLike < 15) {
        score += 1;
    }

    // Activity Multiplier
    const multi = {
        'resting': 1.2,
        'walking': 1.0,
        'running': 0.6
    };
    
    score = score * (multi[activity] || 1.0);

    return Math.max(0, score);
}

// 4. Clothing Verdict Map
export function getClothingVerdict(score, windSpeed, rainProb, isDay = true, cloudCover = 0) {
    let main = "";
    let sub = [];

    // Map Score to Stylist-Grade Outfits
    if (score < 0.5) main = "Breathable shorts & light cotton tee";
    else if (score < 1.5) main = "Comfortable T-shirt & chinos";
    else if (score < 2.5) main = "Long-sleeve knit or a light sweater";
    else if (score < 3.5) main = "Cozy hoodie or a technical mid-layer";
    else if (score < 5.0) main = "Structured overcoat over mid-weight layers";
    else if (score < 7.0) main = "Insulated puffer jacket & thermal base";
    else main = "Heavy-duty parka & double thermal layers";

    // Detailed Accessories (The "Stylist" touch)
    if (windSpeed > 25) {
        sub.push(score > 3 ? "Wind-blocking shell recommended" : "Light windbreaker");
    }
    
    if (rainProb > 60) {
        sub.push("Full waterproofs & umbrella ☔");
    } else if (rainProb > 30) {
        sub.push("Compact umbrella just in case");
    }

    // Smart Sunglasses
    if (isDay && cloudCover < 50 && score < 4) {
        sub.push("Polarized sunglasses 😎");
    }

    // Nuance advice
    if (score % 1 > 0.8 && score < 6) {
        sub.push("Temperatures are dropping, bring an extra layer");
    }

    return { main, sub: sub.join(" • ") };
}

// 5. Timezone Formatter
export function formatLocalTime(isoString, timezone) {
    if (!timezone) return "Unknown Time";
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: timezone 
    });
}

// 6. Weather Tips (including AQI alerts)
export function getWeatherTips(temp, windSpeed, rainProb, isDay = true, cloudCover = 0, aqi = null) {
    const tips = [];

    // Heat/Cold warnings based on Indian/Regional standards
    if (temp > 35) {
        tips.push("High heat alert. Stay hydrated! Drink plenty of water or electrolytes 💧");
    } else if (temp < 10) {
        tips.push("Cold wave conditions. Layer up appropriately ❄️");
    }
    
    // UV index warning proxy (based on daytime + clear sky + warm temp)
    if (isDay && cloudCover < 40 && temp > 28) {
        tips.push("High UV index. Apply sunscreen (SPF 30+) 🧴");
    }
    
    // Wind warnings
    if (windSpeed > 30) {
        tips.push("High winds. Hold onto light items & hats 💨");
    }
    
    // Rain warnings
    if (rainProb > 60) {
        tips.push("High chance of rain. Carry an umbrella ☔");
    }

    // AQI warnings
    if (aqi !== null && aqi !== undefined) {
        if (aqi > 200) {
            tips.push("Very poor air quality. Swap outdoor workouts for indoor activities 🏢");
        } else if (aqi > 150) {
            tips.push("Poor air quality. Consider wearing an N95 mask outdoors 😷");
        }
    }

    return tips;
}