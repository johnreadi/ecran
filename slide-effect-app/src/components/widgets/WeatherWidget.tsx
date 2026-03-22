import { useState, useEffect } from 'react';
import type { SlideElement } from '../../types';

interface WeatherWidgetProps {
  element: SlideElement;
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  city: string;
  country: string;
}

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '🌨️', '13n': '🌨️',
  '50d': '🌫️', '50n': '🌫️',
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ element }) => {
  const config = element.config || {};
  const city = config.weatherCity ?? 'Paris';
  const apiKey = config.weatherApiKey ?? '';
  const unit = config.weatherUnit ?? 'celsius';
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!apiKey) {
        // Demo data when no API key
        setWeather({
          temperature: unit === 'celsius' ? 18 : 64,
          feelsLike: unit === 'celsius' ? 16 : 61,
          description: 'Partiellement nuageux',
          humidity: 65,
          windSpeed: 15,
          icon: '02d',
          city: city,
          country: 'FR',
        });
        setLoading(false);
        return;
      }

      try {
        const unitParam = unit === 'celsius' ? 'metric' : 'imperial';
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unitParam}&lang=fr`
        );
        if (!res.ok) throw new Error('Ville non trouvée');
        const data = await res.json();
        setWeather({
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6),
          icon: data.weather[0].icon,
          city: data.name,
          country: data.sys.country,
        });
        setError(null);
      } catch (err) {
        setError('Météo indisponible');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [city, apiKey, unit]);

  const color = element.style.color ?? '#ffffff';
  const fontSize = element.style.fontSize ?? 24;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: element.style.backgroundColor || 'rgba(30, 64, 175, 0.6)',
        borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '20px',
        padding: element.style.padding ? `${element.style.padding}px` : '20px',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.15)',
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div style={{ color, opacity: 0.7, fontSize: `${fontSize * 0.7}px` }}>
          Chargement météo...
        </div>
      )}
      {error && (
        <div style={{ color: '#fca5a5', fontSize: `${fontSize * 0.7}px`, textAlign: 'center' }}>
          ⚠️ {error}<br />
          <span style={{ fontSize: `${fontSize * 0.5}px`, opacity: 0.7 }}>Ajoutez une clé API OpenWeatherMap</span>
        </div>
      )}
      {weather && !error && (
        <>
          {/* City */}
          <div style={{ color, fontSize: `${fontSize * 0.7}px`, opacity: 0.8, fontWeight: '500', letterSpacing: '0.05em' }}>
            📍 {weather.city}, {weather.country}
          </div>

          {/* Main temp + icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: `${fontSize * 2.5}px` }}>
              {WEATHER_ICONS[weather.icon] ?? '🌡️'}
            </span>
            <div>
              <div style={{ color, fontSize: `${fontSize * 2}px`, fontWeight: 'bold', lineHeight: 1 }}>
                {weather.temperature}°{unit === 'celsius' ? 'C' : 'F'}
              </div>
              <div style={{ color, fontSize: `${fontSize * 0.6}px`, opacity: 0.7, textTransform: 'capitalize' }}>
                {weather.description}
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', gap: '16px', fontSize: `${fontSize * 0.55}px`, color, opacity: 0.8, marginTop: '4px' }}>
            <span>💧 {weather.humidity}%</span>
            <span>💨 {weather.windSpeed} km/h</span>
            <span>🌡️ Ressenti {weather.feelsLike}°</span>
          </div>

          {!apiKey && (
            <div style={{ fontSize: `${fontSize * 0.4}px`, color, opacity: 0.4, marginTop: '4px' }}>
              Données démo — Ajoutez une clé API
            </div>
          )}
        </>
      )}
    </div>
  );
};
