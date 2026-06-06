import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles/styles';

// ── 요구사항 5: 날씨 위젯 컴포넌트 ──
export function WeatherWidget({ location }: { location: { latitude: number; longitude: number } | null }) {
  const [weather, setWeather] = useState<{ temp: string; desc: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        // Open-Meteo 무료 API (API 키 불필요)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&hourly=relativehumidity_2m&timezone=Asia%2FSeoul`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.current_weather) {
          const wmo = data.current_weather.weathercode;
          const temp = Math.round(data.current_weather.temperature);
          let icon = '☀️';
          let desc = '맑음';
          if (wmo >= 0 && wmo <= 3) { icon = '☀️'; desc = '맑음'; }
          else if (wmo >= 45 && wmo <= 48) { icon = '🌫️'; desc = '안개'; }
          else if (wmo >= 51 && wmo <= 67) { icon = '🌦️'; desc = '비'; }
          else if (wmo >= 71 && wmo <= 77) { icon = '❄️'; desc = '눈'; }
          else if (wmo >= 80 && wmo <= 82) { icon = '🌧️'; desc = '소나기'; }
          else if (wmo >= 95 && wmo <= 99) { icon = '⛈️'; desc = '뇌우'; }
          else { icon = '🌤️'; desc = '흐림'; }
          setWeather({ temp: `${temp}°C`, desc, icon });
        }
      } catch (e) {
        setWeather({ temp: '--', desc: '날씨 정보 없음', icon: '🌡️' });
      }
      setLoading(false);
    };
    fetchWeather();
  }, [location?.latitude, location?.longitude]);

  return (
    <View style={styles.weatherWidgetContainer}>
      {loading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : weather ? (
        <>
          <Text style={styles.weatherIcon}>{weather.icon}</Text>
          <View>
            <Text style={styles.weatherTemp}>{weather.temp}</Text>
            <Text style={styles.weatherDesc}>{weather.desc}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
