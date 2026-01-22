"use client";

import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Wind, CloudSnow, CloudDrizzle, Cloudy } from "lucide-react";

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | undefined;
      
      try {
        // Timeout de 8 secondes
        timeoutId = setTimeout(() => {
          controller.abort(new Error('Request timeout'));
        }, 8000);
        
        // API Open-Meteo (gratuite, fiable, sans clé API)
        // Coordonnées de Marseille : 43.2965°N, 5.3698°E
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=43.2965&longitude=5.3698&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe%2FParis',
          { 
            signal: controller.signal,
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const current = data.current;
          
          // Mapper les codes météo en descriptions françaises
          const getWeatherDescription = (code: number): string => {
            const weatherCodes: Record<number, string> = {
              0: 'Ciel dégagé',
              1: 'Principalement dégagé',
              2: 'Partiellement nuageux',
              3: 'Couvert',
              45: 'Brouillard',
              48: 'Brouillard givrant',
              51: 'Bruine légère',
              53: 'Bruine modérée',
              55: 'Bruine dense',
              61: 'Pluie légère',
              63: 'Pluie modérée',
              65: 'Pluie forte',
              71: 'Neige légère',
              73: 'Neige modérée',
              75: 'Neige forte',
              80: 'Averses légères',
              81: 'Averses modérées',
              82: 'Averses fortes',
              95: 'Orage',
              96: 'Orage avec grêle légère',
              99: 'Orage avec grêle forte'
            };
            return weatherCodes[code] || 'Conditions variables';
          };
          
          setWeather({
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            description: getWeatherDescription(current.weather_code),
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            weatherCode: current.weather_code,
          });
        } else {
          setWeather(null);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Erreur API météo:", error);
        }
        setWeather(null);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Rafraîchir toutes les 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Cloud className="h-8 w-8 animate-pulse text-muted-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">Chargement météo...</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center justify-center gap-2">
        <Sun className="h-5 w-5 text-yellow-500" />
        <span className="text-sm text-muted-foreground">Météo indisponible</span>
      </div>
    );
  }

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) {
      return <Sun className="h-6 w-6 text-yellow-500" />;
    } else if (code === 2 || code === 3) {
      return <Cloudy className="h-6 w-6 text-gray-500" />;
    } else if (code >= 51 && code <= 55) {
      return <CloudDrizzle className="h-6 w-6 text-blue-400" />;
    } else if (code >= 61 && code <= 65 || code >= 80 && code <= 82) {
      return <CloudRain className="h-6 w-6 text-blue-600" />;
    } else if (code >= 71 && code <= 75) {
      return <CloudSnow className="h-6 w-6 text-blue-300" />;
    } else if (code >= 45 && code <= 48) {
      return <Cloud className="h-6 w-6 text-gray-400" />;
    } else if (code >= 95) {
      return <CloudRain className="h-6 w-6 text-purple-600" />;
    } else {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {getWeatherIcon(weather.weatherCode)}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {weather.temp}°C
          </span>
          <span className="text-xs text-muted-foreground">
            (ressenti {weather.feelsLike}°C)
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {weather.description}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Wind className="h-3.5 w-3.5" />
          <span>{weather.windSpeed} km/h</span>
        </div>
        <span>•</span>
        <span>{weather.humidity}%</span>
      </div>
    </div>
  );
}

