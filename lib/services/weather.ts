export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy';

export const WEATHER_COORDINATES = {
  'Costa del Este': { lat: -36.4333, lon: -56.7167 },
  'Mar de las Pampas': { lat: -37.3333, lon: -57.0167 },
  'Costa Esmeralda': { lat: -37.1328, lon: -56.7456 }
};

// Map POS numbers to locations
export const POS_LOCATIONS: Record<number, string> = {
  1: 'Costa del Este',
  2: 'Mar de las Pampas',
  3: 'Costa Esmeralda'
};

export const weatherService = {
  async getCurrentWeather(posNumber: number = 3): Promise<WeatherCondition> {
    try {
      const location = POS_LOCATIONS[posNumber] || POS_LOCATIONS[3];
      const coords = WEATHER_COORDINATES[location as keyof typeof WEATHER_COORDINATES];
      
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=weather_code&timezone=America/Argentina/Buenos_Aires`
      );
      
      if (!res.ok) throw new Error('Weather API failed');
      
      const data = await res.json();
      const code = data.current.weather_code;
      
      // Map WMO codes: 
      // 0: Clear sky
      // 1, 2, 3: Mainly clear, partly cloudy, and overcast
      // 45, 48: Fog
      // 51, 53, 55: Drizzle
      // 61, 63, 65: Rain
      // 71, 73, 75: Snow fall
      // 77: Snow grains
      // 80, 81, 82: Rain showers
      // 85, 86: Snow showers
      // 95, 96, 99: Thunderstorm
      
      if (code <= 1) return 'sunny';
      if (code <= 3 || code === 45 || code === 48) return 'cloudy';
      return 'rainy';
    } catch (e) {
      console.error("Weather fetch failed", e);
      return 'sunny'; // Fallback
    }
  }
};
