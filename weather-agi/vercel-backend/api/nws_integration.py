"""
NWS (National Weather Service) API Integration for Weather AGI
Official US government weather data - FREE and comprehensive!
"""
import httpx
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
import logging

logger = logging.getLogger(__name__)

class NWSWeatherAPI:
    """Integration with the National Weather Service API"""
    
    def __init__(self):
        self.base_url = "https://api.weather.gov"
        self.session = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "WeatherAGI/2.0 (contact: weather-agi@example.com) Professional Meteorological Analysis System",
                "Accept": "application/geo+json, application/ld+json"
            }
        )
    
    async def close(self):
        """Close the HTTP session"""
        await self.session.aclose()
    
    async def get_point_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get NWS point data for a location - essential for all other calls"""
        try:
            url = f"{self.base_url}/points/{lat:.4f},{lon:.4f}"
            response = await self.session.get(url)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"NWS point data failed: {response.status_code}")
                return {}
        except Exception as e:
            logger.error(f"NWS point data error: {e}")
            return {}
    
    async def get_active_alerts(self, lat: float, lon: float, radius: int = 25) -> List[Dict[str, Any]]:
        """Get active weather alerts for a location"""
        try:
            url = f"{self.base_url}/alerts/active"
            params = {
                "point": f"{lat},{lon}",
                "status": "actual",
                "message_type": "alert"
            }
            
            response = await self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                features = data.get('features', [])
                
                alerts = []
                for feature in features:
                    props = feature.get('properties', {})
                    alert = {
                        'id': props.get('id', ''),
                        'type': self._map_nws_event_to_type(props.get('event', '')),
                        'severity': self._map_nws_severity(props.get('severity', '')),
                        'urgency': props.get('urgency', '').lower(),
                        'certainty': props.get('certainty', '').lower(),
                        'title': props.get('headline', ''),
                        'description': props.get('description', ''),
                        'instruction': props.get('instruction', ''),
                        'area': props.get('areaDesc', ''),
                        'effective': props.get('effective', ''),
                        'expires': props.get('expires', ''),
                        'sent': props.get('sent', ''),
                        'event': props.get('event', ''),
                        'sender': props.get('senderName', ''),
                        'zones': props.get('geocode', {}).get('UGC', [])
                    }
                    alerts.append(alert)
                
                return alerts
            else:
                logger.warning(f"NWS alerts failed: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"NWS alerts error: {e}")
            return []
    
    async def get_current_observations(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get current weather observations from nearest station"""
        try:
            # First get point data to find nearby stations
            point_data = await self.get_point_data(lat, lon)
            if not point_data:
                return {}
            
            # Get observation stations URL
            stations_url = point_data.get('properties', {}).get('observationStations', '')
            if not stations_url:
                return {}
            
            # Get list of stations
            response = await self.session.get(stations_url)
            if response.status_code != 200:
                return {}
            
            stations_data = response.json()
            stations = stations_data.get('features', [])
            
            if not stations:
                return {}
            
            # Get latest observation from first station
            station_id = stations[0].get('properties', {}).get('stationIdentifier', '')
            if not station_id:
                return {}
            
            obs_url = f"{self.base_url}/stations/{station_id}/observations/latest"
            response = await self.session.get(obs_url)
            
            if response.status_code == 200:
                obs_data = response.json()
                props = obs_data.get('properties', {})
                
                # Convert NWS observation format to our standard format
                observation = {
                    'station_id': station_id,
                    'timestamp': props.get('timestamp', ''),
                    'temperature': self._extract_value(props.get('temperature')),
                    'dewpoint': self._extract_value(props.get('dewpoint')),
                    'wind_direction': self._extract_value(props.get('windDirection')),
                    'wind_speed': self._extract_value(props.get('windSpeed')),
                    'wind_gust': self._extract_value(props.get('windGust')),
                    'pressure': self._extract_value(props.get('barometricPressure')),
                    'sea_level_pressure': self._extract_value(props.get('seaLevelPressure')),
                    'visibility': self._extract_value(props.get('visibility')),
                    'relative_humidity': self._extract_value(props.get('relativeHumidity')),
                    'heat_index': self._extract_value(props.get('heatIndex')),
                    'wind_chill': self._extract_value(props.get('windChill')),
                    'precipitation_last_hour': self._extract_value(props.get('precipitationLastHour')),
                    'raw_metar': props.get('rawMessage', ''),
                    'text_description': props.get('textDescription', ''),
                    'cloud_layers': props.get('cloudLayers', []),
                    'present_weather': props.get('presentWeather', [])
                }
                
                return observation
            else:
                return {}
                
        except Exception as e:
            logger.error(f"NWS observations error: {e}")
            return {}
    
    async def get_gridpoint_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get detailed gridpoint forecast data"""
        try:
            # Get point data first
            point_data = await self.get_point_data(lat, lon)
            if not point_data:
                return {}
            
            props = point_data.get('properties', {})
            grid_id = props.get('gridId', '')
            grid_x = props.get('gridX', 0)
            grid_y = props.get('gridY', 0)
            
            if not all([grid_id, grid_x, grid_y]):
                return {}
            
            # Get gridpoint data
            grid_url = f"{self.base_url}/gridpoints/{grid_id}/{grid_x},{grid_y}"
            response = await self.session.get(grid_url)
            
            if response.status_code == 200:
                grid_data = response.json()
                return grid_data.get('properties', {})
            else:
                return {}
                
        except Exception as e:
            logger.error(f"NWS gridpoint forecast error: {e}")
            return {}
    
    async def get_forecast_periods(self, lat: float, lon: float, hourly: bool = False) -> List[Dict[str, Any]]:
        """Get forecast periods (12-hour or hourly)"""
        try:
            # Get point data first
            point_data = await self.get_point_data(lat, lon)
            if not point_data:
                return []
            
            props = point_data.get('properties', {})
            forecast_url = props.get('forecastHourly' if hourly else 'forecast', '')
            
            if not forecast_url:
                return []
            
            response = await self.session.get(forecast_url)
            
            if response.status_code == 200:
                forecast_data = response.json()
                return forecast_data.get('properties', {}).get('periods', [])
            else:
                return []
                
        except Exception as e:
            logger.error(f"NWS forecast periods error: {e}")
            return []
    
    async def get_weather_hazards(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        """Extract weather hazards from gridpoint data"""
        try:
            gridpoint_data = await self.get_gridpoint_forecast(lat, lon)
            if not gridpoint_data:
                return []
            
            hazards_data = gridpoint_data.get('hazards', {})
            hazard_values = hazards_data.get('values', [])
            
            hazards = []
            for hazard_period in hazard_values:
                valid_time = hazard_period.get('validTime', '')
                hazard_list = hazard_period.get('value', [])
                
                for hazard in hazard_list:
                    hazards.append({
                        'valid_time': valid_time,
                        'phenomenon': hazard.get('phenomenon', ''),
                        'significance': hazard.get('significance', ''),
                        'event_number': hazard.get('event_number'),
                        'description': self._decode_hazard(
                            hazard.get('phenomenon', ''), 
                            hazard.get('significance', '')
                        )
                    })
            
            return hazards
            
        except Exception as e:
            logger.error(f"NWS weather hazards error: {e}")
            return []
    
    async def get_radar_stations(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        """Get nearby radar stations"""
        try:
            url = f"{self.base_url}/radar/stations"
            response = await self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                stations = data.get('features', [])
                
                # Calculate distance to each station (simplified)
                nearby_stations = []
                for station in stations:
                    props = station.get('properties', {})
                    geometry = station.get('geometry', {})
                    coords = geometry.get('coordinates', [])
                    
                    if len(coords) >= 2:
                        station_info = {
                            'id': props.get('stationIdentifier', ''),
                            'name': props.get('name', ''),
                            'lat': coords[1],
                            'lon': coords[0],
                            'elevation': props.get('elevation', {}),
                            'distance': self._calculate_distance(lat, lon, coords[1], coords[0])
                        }
                        nearby_stations.append(station_info)
                
                # Sort by distance
                nearby_stations.sort(key=lambda x: x['distance'])
                return nearby_stations[:5]  # Return 5 closest
            else:
                return []
                
        except Exception as e:
            logger.error(f"NWS radar stations error: {e}")
            return []
    
    def _extract_value(self, value_obj: Optional[Dict]) -> Optional[float]:
        """Extract numeric value from NWS QuantitativeValue object"""
        if not value_obj or not isinstance(value_obj, dict):
            return None
        return value_obj.get('value')
    
    def _map_nws_event_to_type(self, event: str) -> str:
        """Map NWS event names to our alert types"""
        event_lower = event.lower()
        
        if any(word in event_lower for word in ['tornado', 'funnel']):
            return 'tornado'
        elif any(word in event_lower for word in ['thunderstorm', 'severe', 'squall', 'wind']):
            return 'severe_thunderstorm'  
        elif any(word in event_lower for word in ['flood', 'flash']):
            return 'flash_flood'
        elif any(word in event_lower for word in ['winter', 'snow', 'ice', 'blizzard', 'freezing']):
            return 'winter_weather'
        else:
            return 'general'
    
    def _map_nws_severity(self, severity: str) -> str:
        """Map NWS severity to our standard format"""
        severity_map = {
            'Extreme': 'warning',
            'Severe': 'warning', 
            'Moderate': 'watch',
            'Minor': 'advisory',
            'Unknown': 'advisory'
        }
        return severity_map.get(severity, 'advisory')
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate approximate distance between two points in km"""
        # Simplified distance calculation (not accounting for Earth's curvature)
        import math
        
        lat_diff = lat2 - lat1
        lon_diff = lon2 - lon1
        
        # Convert to km (very rough approximation)
        lat_km = lat_diff * 111  # 1 degree lat ≈ 111 km
        lon_km = lon_diff * 111 * math.cos(math.radians(lat1))  # Adjust for longitude
        
        return math.sqrt(lat_km**2 + lon_km**2)
    
    def _decode_hazard(self, phenomenon: str, significance: str) -> str:
        """Decode NWS hazard phenomenon and significance codes"""
        # P-VTEC phenomenon codes
        phenomenon_codes = {
            'TO': 'Tornado',
            'SV': 'Severe Thunderstorm',
            'FF': 'Flash Flood',
            'WS': 'Winter Storm',
            'BZ': 'Blizzard',
            'IS': 'Ice Storm',
            'HS': 'Heavy Snow',
            'WW': 'Winter Weather',
            'HT': 'Heat',
            'EH': 'Excessive Heat',
            'WC': 'Wind Chill',
            'FG': 'Dense Fog',
            'SM': 'Dense Smoke',
            'DU': 'Blowing Dust',
            'EC': 'Extreme Cold',
            'FZ': 'Freeze',
            'HW': 'High Wind',
            'LW': 'Lake Wind',
            'SU': 'High Surf',
            'RB': 'Small Craft',
            'SC': 'Small Craft',
            'GL': 'Gale',
            'SR': 'Storm',
            'HU': 'Hurricane Force Wind',
            'TY': 'Typhoon',
            'HF': 'Hurricane',
            'TR': 'Tropical Storm',
        }
        
        # Significance codes
        significance_codes = {
            'W': 'Warning',
            'A': 'Watch', 
            'Y': 'Advisory',
            'S': 'Statement',
            'F': 'Forecast',
            'O': 'Outlook',
            'N': 'Synopsis'
        }
        
        phenomenon_name = phenomenon_codes.get(phenomenon, phenomenon)
        significance_name = significance_codes.get(significance, significance)
        
        return f"{phenomenon_name} {significance_name}"

# Enhanced Weather AGI with NWS Integration
class WeatherAGIWithNWS:
    """Weather AGI enhanced with National Weather Service data"""
    
    def __init__(self):
        self.nws = NWSWeatherAPI()
    
    async def close(self):
        """Close NWS API session"""
        await self.nws.close()
    
    async def get_comprehensive_weather_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get comprehensive weather data from NWS for a location"""
        
        # Run multiple API calls in parallel for efficiency
        results = await asyncio.gather(
            self.nws.get_active_alerts(lat, lon),
            self.nws.get_current_observations(lat, lon),
            self.nws.get_forecast_periods(lat, lon),
            self.nws.get_forecast_periods(lat, lon, hourly=True),
            self.nws.get_weather_hazards(lat, lon),
            self.nws.get_radar_stations(lat, lon),
            return_exceptions=True
        )
        
        alerts, observations, forecast, hourly_forecast, hazards, radar_stations = results
        
        # Handle any errors in individual calls
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"NWS API call {i} failed: {result}")
        
        return {
            'location': [lat, lon],
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'NWS (National Weather Service)',
            'alerts': alerts if not isinstance(alerts, Exception) else [],
            'current_observations': observations if not isinstance(observations, Exception) else {},
            'forecast_periods': forecast if not isinstance(forecast, Exception) else [],
            'hourly_forecast': hourly_forecast if not isinstance(hourly_forecast, Exception) else [],
            'weather_hazards': hazards if not isinstance(hazards, Exception) else [],
            'nearby_radar_stations': radar_stations if not isinstance(radar_stations, Exception) else [],
            'data_quality': 'official_government_source'
        }
    
    async def get_severe_weather_analysis(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get severe weather specific analysis using NWS data"""
        
        comprehensive_data = await self.get_comprehensive_weather_data(lat, lon)
        
        # Extract severe weather relevant information
        severe_analysis = {
            'location': [lat, lon],
            'analysis_time': datetime.utcnow().isoformat(),
            'data_source': 'NWS Official',
            
            # Active severe weather alerts
            'active_severe_alerts': [
                alert for alert in comprehensive_data['alerts']
                if alert['type'] in ['tornado', 'severe_thunderstorm', 'flash_flood']
            ],
            
            # Current atmospheric conditions
            'current_conditions': self._extract_severe_weather_conditions(
                comprehensive_data['current_observations']
            ),
            
            # Weather hazards from gridpoint data
            'forecast_hazards': comprehensive_data['weather_hazards'],
            
            # Nearest radar for storm tracking
            'primary_radar': comprehensive_data['nearby_radar_stations'][0] 
                            if comprehensive_data['nearby_radar_stations'] else None,
            
            # Severe weather outlook from forecast
            'severe_outlook': self._analyze_severe_potential(comprehensive_data['forecast_periods'])
        }
        
        return severe_analysis
    
    def _extract_severe_weather_conditions(self, observations: Dict[str, Any]) -> Dict[str, Any]:
        """Extract conditions relevant to severe weather from observations"""
        if not observations:
            return {}
        
        return {
            'temperature_f': self._convert_celsius_to_fahrenheit(observations.get('temperature')),
            'dewpoint_f': self._convert_celsius_to_fahrenheit(observations.get('dewpoint')),
            'wind_speed_mph': self._convert_mps_to_mph(observations.get('wind_speed')),
            'wind_gust_mph': self._convert_mps_to_mph(observations.get('wind_gust')),
            'wind_direction': observations.get('wind_direction'),
            'pressure_inhg': self._convert_pa_to_inhg(observations.get('pressure')),
            'relative_humidity': observations.get('relative_humidity'),
            'visibility_miles': self._convert_m_to_miles(observations.get('visibility')),
            'present_weather': observations.get('present_weather', []),
            'cloud_coverage': len(observations.get('cloud_layers', [])),
            'observation_time': observations.get('timestamp'),
            'station': observations.get('station_id')
        }
    
    def _analyze_severe_potential(self, forecast_periods: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze severe weather potential from forecast periods"""
        if not forecast_periods:
            return {}
        
        severe_indicators = []
        for period in forecast_periods[:4]:  # Next 2 days
            short_forecast = period.get('shortForecast', '').lower()
            detailed_forecast = period.get('detailedForecast', '').lower()
            
            # Look for severe weather keywords
            severe_keywords = [
                'thunderstorm', 'severe', 'tornado', 'hail', 'damaging wind',
                'flash flood', 'heavy rain', 'strong wind', 'gusty'
            ]
            
            found_keywords = [
                keyword for keyword in severe_keywords
                if keyword in short_forecast or keyword in detailed_forecast
            ]
            
            if found_keywords:
                severe_indicators.append({
                    'period': period.get('name', ''),
                    'start_time': period.get('startTime', ''),
                    'indicators': found_keywords,
                    'forecast_text': period.get('detailedForecast', '')
                })
        
        return {
            'periods_with_severe_potential': len(severe_indicators),
            'severe_indicators': severe_indicators,
            'outlook_summary': f"{len(severe_indicators)} forecast periods show severe weather potential"
        }
    
    def _convert_celsius_to_fahrenheit(self, celsius: Optional[float]) -> Optional[float]:
        """Convert Celsius to Fahrenheit"""
        return (celsius * 9/5) + 32 if celsius is not None else None
    
    def _convert_mps_to_mph(self, mps: Optional[float]) -> Optional[float]:
        """Convert meters per second to miles per hour"""
        return mps * 2.237 if mps is not None else None
    
    def _convert_pa_to_inhg(self, pascals: Optional[float]) -> Optional[float]:
        """Convert Pascals to inches of mercury"""
        return pascals * 0.0002953 if pascals is not None else None
    
    def _convert_m_to_miles(self, meters: Optional[float]) -> Optional[float]:
        """Convert meters to miles"""
        return meters * 0.000621371 if meters is not None else None

# Test function
async def test_nws_integration(lat: float = 35.2271, lon: float = -97.4890):
    """Test NWS API integration (Moore, OK - tornado alley)"""
    
    print("Testing NWS (National Weather Service) API Integration")
    print("=" * 60)
    
    weather_agi = WeatherAGIWithNWS()
    
    try:
        # Get comprehensive weather data
        print("Fetching comprehensive NWS weather data...")
        data = await weather_agi.get_comprehensive_weather_data(lat, lon)
        
        print(f"Location: {lat}°N, {abs(lon)}°W")
        print(f"Data Source: {data['source']}")
        print(f"Analysis Time: {data['timestamp']}")
        print()
        
        # Display alerts
        alerts = data['alerts']
        print(f"Active Alerts: {len(alerts)}")
        for alert in alerts[:3]:  # Show first 3
            print(f"  - {alert['title']} ({alert['severity'].upper()})")
        print()
        
        # Display current conditions
        obs = data['current_observations']
        if obs:
            print("Current Conditions:")
            print(f"  Temperature: {obs.get('temperature', 'N/A')}°C")
            print(f"  Wind: {obs.get('wind_speed', 'N/A')} m/s from {obs.get('wind_direction', 'N/A')}°")
            print(f"  Pressure: {obs.get('pressure', 'N/A')} Pa")
            print(f"  Humidity: {obs.get('relative_humidity', 'N/A')}%")
        print()
        
        # Display forecast
        forecast = data['forecast_periods']
        print(f"Forecast Periods: {len(forecast)}")
        for period in forecast[:2]:  # Show first 2
            print(f"  - {period.get('name', 'N/A')}: {period.get('shortForecast', 'N/A')}")
        print()
        
        # Display hazards
        hazards = data['weather_hazards']
        print(f"Weather Hazards: {len(hazards)}")
        for hazard in hazards[:3]:
            print(f"  - {hazard.get('description', 'N/A')}")
        print()
        
        # Severe weather analysis
        print("Getting severe weather analysis...")
        severe_data = await weather_agi.get_severe_weather_analysis(lat, lon)
        
        severe_alerts = severe_data['active_severe_alerts']
        print(f"Severe Weather Alerts: {len(severe_alerts)}")
        
        severe_outlook = severe_data['severe_outlook']
        print(f"Severe Weather Outlook: {severe_outlook.get('outlook_summary', 'None')}")
        
        print("\n" + "=" * 60)
        print("✅ NWS API Integration Test Complete!")
        print("Your Weather AGI now has access to official US government weather data!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        await weather_agi.close()

if __name__ == "__main__":
    # Test the NWS integration
    asyncio.run(test_nws_integration())