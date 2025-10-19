import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets } from 'lucide-react';

const WeatherSection = ({ weatherData, loadingWeather }) => {
  const getWeatherIcon = condition => {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun size={24} className='weather-icon sun' />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud size={24} className='weather-icon cloud' />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain size={24} className='weather-icon rain' />;
    } else if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
      return <CloudSnow size={24} className='weather-icon snow' />;
    } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
      return <CloudRain size={24} className='weather-icon storm' />;
    } else {
      return <Cloud size={24} className='weather-icon default' />;
    }
  };

  return (
    <div className='trail-detail-weather-section'>
      <h3>Weather Forecast</h3>
      {loadingWeather ? (
        <div className='trail-detail-loading'>
          <div className='trail-detail-loading-spinner'></div>
          Loading weather data...
        </div>
      ) : weatherData && weatherData.length > 0 ? (
        <div className='trail-detail-weather-forecast'>
          {weatherData.map((day, index) => (
            <div key={index} className='trail-detail-weather-day'>
              <div className='trail-detail-weather-header'>
                <div className='trail-detail-weather-date'>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className='trail-detail-weather-icon'>{getWeatherIcon(day.condition)}</div>
              </div>

              <div className='trail-detail-weather-temps'>
                <span className='trail-detail-weather-high'>{Math.round(day.maxTemp)}°</span>
                <span className='trail-detail-weather-low'>{Math.round(day.minTemp)}°</span>
              </div>

              <div className='trail-detail-weather-condition'>{day.condition}</div>

              <div className='trail-detail-weather-details'>
                <div className='trail-detail-weather-detail-item'>
                  <Droplets size={14} />
                  <span>{day.humidity}%</span>
                </div>
                <div className='trail-detail-weather-detail-item'>
                  <Wind size={14} />
                  <span>{day.windSpeed} m/s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='trail-detail-no-weather'>
          <p>Weather data not available for this location.</p>
          <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
            This could be due to API limits or location data issues.
          </p>
        </div>
      )}
    </div>
  );
};

export default WeatherSection;
