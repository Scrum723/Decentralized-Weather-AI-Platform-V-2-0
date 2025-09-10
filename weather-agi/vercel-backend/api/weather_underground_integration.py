"""
Weather Underground API Integration
Comprehensive weather data from Weather Underground's PWS network
"""
import httpx
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class WeatherUndergroundAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.weather.com/v1"
        self.pws_url = "https://api.weather.com/v2/pws"
        
    async def get_current_conditions(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get current weather conditions"""
        url = f"{self.base_url}/current"
        params = {
            'apikey': self.api_key,
            'geocode': f"{lat},{lon}",
            'units': 'm',  # metric
            'language': 'en-US',
            'format': 'json'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                return {
                    'temperature': data.get('temperature'),
                    'humidity': data.get('humidity'),
                    'pressure': data.get('pressure'),
                    'wind_speed': data.get('windSpeed'),
                    'wind_direction': data.get('windDirection'),
                    'wind_gust': data.get('windGust'),
                    'visibility': data.get('visibility'),
                    'uv_index': data.get('uvIndex'),
                    'weather_condition': data.get('wxPhraseLong'),
                    'weather_icon': data.get('iconCode'),
                    'precipitation_1hr': data.get('precip1Hour'),
                    'precipitation_24hr': data.get('precip24Hour'),
                    'timestamp': datetime.now().isoformat(),
                    'source': 'Weather Underground'
                }
            except Exception as e:
                logger.error(f"Weather Underground current conditions error: {e}")
                return {'error': str(e), 'source': 'Weather Underground'}

    async def get_forecast(self, lat: float, lon: float, days: int = 5) -> Dict[str, Any]:
        """Get weather forecast"""
        url = f"{self.base_url}/forecast/daily/{days}day"
        params = {
            'apikey': self.api_key,
            'geocode': f"{lat},{lon}",
            'units': 'm',
            'language': 'en-US',
            'format': 'json'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                forecast_data = []
                for day in data.get('forecasts', []):
                    forecast_data.append({
                        'date': day.get('fcst_valid_local'),
                        'high_temp': day.get('max_temp'),
                        'low_temp': day.get('min_temp'),
                        'condition': day.get('phrase_32char'),
                        'icon': day.get('icon_code'),
                        'precipitation_probability': day.get('pop'),
                        'precipitation_amount': day.get('qpf'),
                        'humidity': day.get('rh'),
                        'wind_speed': day.get('wspd'),
                        'wind_direction': day.get('wdir'),
                        'uv_index': day.get('uv_index')
                    })
                
                return {
                    'forecast': forecast_data,
                    'location': data.get('location', {}),
                    'timestamp': datetime.now().isoformat(),
                    'source': 'Weather Underground'
                }
            except Exception as e:
                logger.error(f"Weather Underground forecast error: {e}")
                return {'error': str(e), 'source': 'Weather Underground'}

    async def get_hourly_forecast(self, lat: float, lon: float, hours: int = 24) -> Dict[str, Any]:
        """Get hourly weather forecast"""
        url = f"{self.base_url}/forecast/hourly/{hours}hour"
        params = {
            'apikey': self.api_key,
            'geocode': f"{lat},{lon}",
            'units': 'm',
            'language': 'en-US',
            'format': 'json'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                hourly_data = []
                for hour in data.get('forecasts', []):
                    hourly_data.append({
                        'datetime': hour.get('fcst_valid_local'),
                        'temperature': hour.get('temp'),
                        'feels_like': hour.get('feels_like'),
                        'condition': hour.get('phrase_32char'),
                        'icon': hour.get('icon_code'),
                        'precipitation_probability': hour.get('pop'),
                        'precipitation_amount': hour.get('qpf'),
                        'humidity': hour.get('rh'),
                        'wind_speed': hour.get('wspd'),
                        'wind_direction': hour.get('wdir'),
                        'wind_gust': hour.get('gust'),
                        'visibility': hour.get('vis'),
                        'uv_index': hour.get('uv_index'),
                        'pressure': hour.get('mslp')
                    })
                
                return {
                    'hourly_forecast': hourly_data,
                    'location': data.get('location', {}),
                    'timestamp': datetime.now().isoformat(),
                    'source': 'Weather Underground'
                }
            except Exception as e:
                logger.error(f"Weather Underground hourly forecast error: {e}")
                return {'error': str(e), 'source': 'Weather Underground'}

    async def get_pws_observations(self, lat: float, lon: float, radius: int = 20) -> Dict[str, Any]:
        """Get Personal Weather Station observations near location"""
        url = f"{self.pws_url}/observations/current"
        params = {
            'apikey': self.api_key,
            'geocode': f"{lat},{lon}",
            'numericPrecision': 'decimal',
            'format': 'json',
            'units': 'm'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                pws_data = []
                for station in data.get('observations', []):
                    obs = station.get('metric', {})
                    pws_data.append({
                        'station_id': station.get('stationID'),
                        'location': {
                            'lat': station.get('lat'),
                            'lon': station.get('lon'),
                            'elevation': station.get('elevation')
                        },
                        'temperature': obs.get('temp'),
                        'humidity': obs.get('humidity'),
                        'pressure': obs.get('pressure'),
                        'wind_speed': obs.get('windSpeed'),
                        'wind_direction': obs.get('winddir'),
                        'wind_gust': obs.get('windGust'),
                        'precipitation_rate': obs.get('precipRate'),
                        'precipitation_total': obs.get('precipTotal'),
                        'solar_radiation': obs.get('solarRadiation'),
                        'uv': obs.get('uv'),
                        'observation_time': station.get('obsTimeLocal'),
                        'quality_control_status': station.get('qcStatus')
                    })
                
                return {
                    'pws_observations': pws_data,
                    'observation_count': len(pws_data),
                    'timestamp': datetime.now().isoformat(),
                    'source': 'Weather Underground PWS'
                }
            except Exception as e:
                logger.error(f"Weather Underground PWS observations error: {e}")
                return {'error': str(e), 'source': 'Weather Underground PWS'}

    async def get_historical_data(self, lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get historical weather data"""
        url = f"{self.base_url}/history/daily"
        params = {
            'apikey': self.api_key,
            'geocode': f"{lat},{lon}",
            'startDate': start_date,  # YYYYMMDD format
            'endDate': end_date,
            'units': 'm',
            'format': 'json'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                
                historical_data = []
                for day in data.get('observations', []):
                    historical_data.append({
                        'date': day.get('valid_time_gmt'),
                        'high_temp': day.get('max_temp'),
                        'low_temp': day.get('min_temp'),
                        'avg_temp': day.get('avg_temp'),
                        'precipitation': day.get('precip_total'),
                        'snow': day.get('snow_total'),
                        'wind_speed': day.get('avg_wspd'),
                        'wind_direction': day.get('avg_wdir'),
                        'pressure': day.get('avg_pressure'),
                        'humidity': day.get('avg_rh'),
                        'visibility': day.get('avg_vis')
                    })
                
                return {
                    'historical_data': historical_data,
                    'location': data.get('location', {}),
                    'period': {'start': start_date, 'end': end_date},
                    'timestamp': datetime.now().isoformat(),
                    'source': 'Weather Underground Historical'
                }
            except Exception as e:
                logger.error(f"Weather Underground historical data error: {e}")
                return {'error': str(e), 'source': 'Weather Underground Historical'}

    async def get_severe_weather_alerts(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get severe weather alerts for location"""
        url = f"{self.base_url}/alerts"
        params = {
            'apikey': self.api_key,
            'geocode': f"{lat},{lon}",
            'format': 'json'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                alerts = []
                for alert in data.get('alerts', []):
                    alerts.append({
                        'alert_id': alert.get('detailKey'),
                        'office': alert.get('office'),
                        'phenomena': alert.get('phenomena'),
                        'significance': alert.get('significance'),
                        'headline': alert.get('headline'),
                        'description': alert.get('description'),
                        'instruction': alert.get('instruction'),
                        'start_time': alert.get('start_time_local'),
                        'end_time': alert.get('end_time_local'),
                        'urgency': alert.get('urgency'),
                        'severity': alert.get('severity'),
                        'certainty': alert.get('certainty')
                    })
                
                return {
                    'alerts': alerts,
                    'alert_count': len(alerts),
                    'location': data.get('location', {}),
                    'timestamp': datetime.now().isoformat(),
                    'source': 'Weather Underground Alerts'
                }
            except Exception as e:
                logger.error(f"Weather Underground alerts error: {e}")
                return {'error': str(e), 'source': 'Weather Underground Alerts'}

    async def get_comprehensive_weather_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get comprehensive weather data from all Weather Underground endpoints"""
        try:
            # Run all requests concurrently for better performance
            current_task = asyncio.create_task(self.get_current_conditions(lat, lon))
            forecast_task = asyncio.create_task(self.get_forecast(lat, lon))
            hourly_task = asyncio.create_task(self.get_hourly_forecast(lat, lon, 12))
            pws_task = asyncio.create_task(self.get_pws_observations(lat, lon))
            alerts_task = asyncio.create_task(self.get_severe_weather_alerts(lat, lon))
            
            current, forecast, hourly, pws, alerts = await asyncio.gather(
                current_task, forecast_task, hourly_task, pws_task, alerts_task,
                return_exceptions=True
            )
            
            return {
                'current_conditions': current if not isinstance(current, Exception) else {'error': str(current)},
                'forecast': forecast if not isinstance(forecast, Exception) else {'error': str(forecast)},
                'hourly_forecast': hourly if not isinstance(hourly, Exception) else {'error': str(hourly)},
                'pws_observations': pws if not isinstance(pws, Exception) else {'error': str(pws)},
                'severe_alerts': alerts if not isinstance(alerts, Exception) else {'error': str(alerts)},
                'timestamp': datetime.now().isoformat(),
                'location': {'lat': lat, 'lon': lon},
                'source': 'Weather Underground Comprehensive'
            }
        except Exception as e:
            logger.error(f"Weather Underground comprehensive data error: {e}")
            return {'error': str(e), 'source': 'Weather Underground Comprehensive'}