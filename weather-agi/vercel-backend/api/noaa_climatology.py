"""
NOAA Climatology Data Integration
Using rnoaa API for historical weather and climate data

Service API: https://www.ncei.noaa.gov/access/services/search/v1/data
Data Endpoint: https://www.ncei.noaa.gov/access/services/data/v1
"""

import os
import httpx
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
import logging

logger = logging.getLogger(__name__)

class NOAAClimatologyAPI:
    """NOAA Climate Data Online (CDO) API integration for climatological data"""
    
    def __init__(self):
        self.base_url = "https://www.ncdc.noaa.gov/cdo-web/api/v2"
        self.search_url = "https://www.ncei.noaa.gov/access/services/search/v1/data"
        self.data_url = "https://www.ncei.noaa.gov/access/services/data/v1"
        
        self.email = "cclot1@brockport.edu"
        self.token = os.getenv("NOAA_TOKEN")
        
        # Headers for API requests
        self.headers = {
            "token": self.token,
            "User-Agent": f"Weather-AGI/2.0 ({self.email})",
            "Accept": "application/json"
        }
        
        # Common data types for weather analysis
        self.weather_datatypes = [
            "TMAX",  # Maximum temperature
            "TMIN",  # Minimum temperature
            "TAVG",  # Average temperature
            "PRCP",  # Precipitation
            "SNOW",  # Snowfall
            "SNWD",  # Snow depth
            "AWND",  # Average wind speed
            "WSF2",  # Fastest 2-minute wind speed
            "PRES",  # Average pressure
        ]

    async def get_nearest_stations(self, lat: float, lon: float, limit: int = 10) -> List[Dict[str, Any]]:
        """Find weather stations near the given coordinates"""
        
        try:
            params = {
                "datasetid": "GHCND",  # Global Historical Climatology Network Daily
                "locationid": f"FIPS:US",  # United States
                "limit": limit,
                "offset": 1,
                "sortfield": "name",
                "sortorder": "asc"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/stations",
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    stations = data.get("results", [])
                    
                    # Calculate distance and sort by proximity
                    for station in stations:
                        if station.get("latitude") and station.get("longitude"):
                            dist = self._calculate_distance(
                                lat, lon, 
                                station["latitude"], 
                                station["longitude"]
                            )
                            station["distance_km"] = dist
                    
                    # Sort by distance
                    stations.sort(key=lambda s: s.get("distance_km", float('inf')))
                    
                    return stations[:limit]
                else:
                    logger.error(f"NOAA stations API error: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Failed to fetch NOAA stations: {str(e)}")
            return []

    async def get_historical_data(
        self, 
        lat: float, 
        lon: float,
        start_date: str,
        end_date: str,
        datatypes: List[str] = None
    ) -> Dict[str, Any]:
        """Get historical weather data for a location"""
        
        if datatypes is None:
            datatypes = self.weather_datatypes
        
        try:
            # First, find nearby stations
            stations = await self.get_nearest_stations(lat, lon, limit=5)
            if not stations:
                return {"error": "No stations found near location"}
            
            # Get data from the closest station
            station_id = stations[0]["id"]
            
            params = {
                "datasetid": "GHCND",
                "stationid": station_id,
                "startdate": start_date,
                "enddate": end_date,
                "datatypeid": ",".join(datatypes),
                "limit": 1000,
                "offset": 1,
                "units": "standard"  # Fahrenheit, inches, etc.
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/data",
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "station": stations[0],
                        "location": [lat, lon],
                        "data": data.get("results", []),
                        "metadata": data.get("metadata", {}),
                        "request_info": {
                            "start_date": start_date,
                            "end_date": end_date,
                            "datatypes": datatypes
                        }
                    }
                else:
                    logger.error(f"NOAA data API error: {response.status_code}")
                    return {"error": f"API error: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Failed to fetch NOAA historical data: {str(e)}")
            return {"error": str(e)}

    async def get_climate_normals(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get 30-year climate normals for a location"""
        
        try:
            # Find stations with climate normals
            params = {
                "datasetid": "NORMAL_ANN",  # Annual climate normals
                "locationid": f"FIPS:US",
                "limit": 25,
                "offset": 1
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/stations",
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code != 200:
                    return {"error": "Failed to fetch climate normals stations"}
                
                stations_data = response.json()
                stations = stations_data.get("results", [])
                
                # Find closest station with normals data
                closest_station = None
                min_distance = float('inf')
                
                for station in stations:
                    if station.get("latitude") and station.get("longitude"):
                        dist = self._calculate_distance(
                            lat, lon,
                            station["latitude"],
                            station["longitude"]
                        )
                        if dist < min_distance:
                            min_distance = dist
                            closest_station = station
                
                if not closest_station:
                    return {"error": "No climate normals stations found"}
                
                # Get climate normals data
                normals_params = {
                    "datasetid": "NORMAL_ANN",
                    "stationid": closest_station["id"],
                    "startdate": "2010-01-01",
                    "enddate": "2010-12-31",
                    "limit": 1000,
                    "offset": 1,
                    "units": "standard"
                }
                
                normals_response = await client.get(
                    f"{self.base_url}/data",
                    headers=self.headers,
                    params=normals_params
                )
                
                if normals_response.status_code == 200:
                    normals_data = normals_response.json()
                    return {
                        "station": closest_station,
                        "location": [lat, lon],
                        "normals": normals_data.get("results", []),
                        "metadata": normals_data.get("metadata", {}),
                        "distance_km": min_distance
                    }
                else:
                    return {"error": f"Failed to fetch normals data: {normals_response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Failed to fetch climate normals: {str(e)}")
            return {"error": str(e)}

    async def get_climate_summary(self, lat: float, lon: float, year: int = None) -> Dict[str, Any]:
        """Get comprehensive climate summary for a location"""
        
        if year is None:
            year = datetime.now().year - 1  # Previous complete year
        
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"
        
        # Get historical data and climate normals
        historical_task = self.get_historical_data(lat, lon, start_date, end_date)
        normals_task = self.get_climate_normals(lat, lon)
        
        historical_data, normals_data = await asyncio.gather(
            historical_task, normals_task, return_exceptions=True
        )
        
        # Process and summarize the data
        summary = {
            "location": [lat, lon],
            "year": year,
            "timestamp": datetime.utcnow().isoformat(),
            "historical_data": historical_data if not isinstance(historical_data, Exception) else {"error": str(historical_data)},
            "climate_normals": normals_data if not isinstance(normals_data, Exception) else {"error": str(normals_data)}
        }
        
        # Calculate climate statistics if we have data
        if not isinstance(historical_data, Exception) and "data" in historical_data:
            summary["climate_stats"] = self._calculate_climate_stats(historical_data["data"])
        
        return summary

    async def get_extreme_events(self, lat: float, lon: float, days_back: int = 30) -> Dict[str, Any]:
        """Get recent extreme weather events for analysis"""
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        # Focus on extreme weather datatypes
        extreme_datatypes = [
            "TMAX", "TMIN",  # Temperature extremes
            "PRCP",          # Precipitation
            "WSF2", "WSF5",  # Wind speed extremes
            "WT01", "WT02", "WT03", "WT04", "WT05",  # Weather type indicators
        ]
        
        data = await self.get_historical_data(lat, lon, start_str, end_str, extreme_datatypes)
        
        if "data" in data:
            # Identify extreme events
            extreme_events = self._identify_extreme_events(data["data"])
            data["extreme_events"] = extreme_events
        
        return data

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        import math
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in kilometers
        r = 6371
        
        return c * r

    def _calculate_climate_stats(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate climate statistics from historical data"""
        
        stats = {
            "temperature": {"max": [], "min": [], "avg": []},
            "precipitation": [],
            "wind": []
        }
        
        for record in data:
            datatype = record.get("datatype")
            value = record.get("value")
            
            if value is None:
                continue
                
            if datatype == "TMAX":
                stats["temperature"]["max"].append(value)
            elif datatype == "TMIN":
                stats["temperature"]["min"].append(value)
            elif datatype == "TAVG":
                stats["temperature"]["avg"].append(value)
            elif datatype == "PRCP":
                stats["precipitation"].append(value)
            elif datatype in ["AWND", "WSF2"]:
                stats["wind"].append(value)
        
        # Calculate summary statistics
        summary_stats = {}
        
        for category, values_dict in stats.items():
            if isinstance(values_dict, dict):
                category_stats = {}
                for subcategory, values in values_dict.items():
                    if values:
                        category_stats[subcategory] = {
                            "mean": sum(values) / len(values),
                            "max": max(values),
                            "min": min(values),
                            "count": len(values)
                        }
                summary_stats[category] = category_stats
            else:
                if values_dict:
                    summary_stats[category] = {
                        "mean": sum(values_dict) / len(values_dict),
                        "max": max(values_dict),
                        "min": min(values_dict),
                        "count": len(values_dict),
                        "total": sum(values_dict) if category == "precipitation" else None
                    }
        
        return summary_stats

    def _identify_extreme_events(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify extreme weather events from historical data"""
        
        extreme_events = []
        
        # Group data by date
        daily_data = {}
        for record in data:
            date = record.get("date")
            if date:
                if date not in daily_data:
                    daily_data[date] = {}
                daily_data[date][record.get("datatype")] = record.get("value")
        
        # Check each day for extreme conditions
        for date, day_data in daily_data.items():
            events = []
            
            # Temperature extremes
            tmax = day_data.get("TMAX")
            tmin = day_data.get("TMIN")
            
            if tmax and tmax >= 100:  # >= 100°F
                events.append({"type": "extreme_heat", "value": tmax, "unit": "°F"})
            
            if tmin and tmin <= 0:  # <= 0°F
                events.append({"type": "extreme_cold", "value": tmin, "unit": "°F"})
            
            # Precipitation extremes
            prcp = day_data.get("PRCP")
            if prcp and prcp >= 2.0:  # >= 2 inches
                events.append({"type": "heavy_precipitation", "value": prcp, "unit": "inches"})
            
            # Wind extremes
            wsf2 = day_data.get("WSF2")
            if wsf2 and wsf2 >= 50:  # >= 50 mph
                events.append({"type": "high_winds", "value": wsf2, "unit": "mph"})
            
            if events:
                extreme_events.append({
                    "date": date,
                    "events": events
                })
        
        return extreme_events

    async def get_seasonal_outlook(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get seasonal climate outlook based on historical patterns"""
        
        current_date = datetime.now()
        
        # Get data for same time period over multiple years
        historical_seasons = []
        
        for year_offset in range(1, 6):  # Last 5 years
            year = current_date.year - year_offset
            start_date = current_date.replace(year=year) - timedelta(days=30)
            end_date = current_date.replace(year=year) + timedelta(days=60)
            
            season_data = await self.get_historical_data(
                lat, lon,
                start_date.strftime("%Y-%m-%d"),
                end_date.strftime("%Y-%m-%d")
            )
            
            if "data" in season_data:
                historical_seasons.append({
                    "year": year,
                    "data": season_data["data"]
                })
        
        # Analyze patterns and create outlook
        outlook = {
            "location": [lat, lon],
            "forecast_date": current_date.isoformat(),
            "historical_analysis": historical_seasons,
            "seasonal_patterns": self._analyze_seasonal_patterns(historical_seasons),
            "outlook_summary": "Based on historical climate patterns for this location"
        }
        
        return outlook

    def _analyze_seasonal_patterns(self, seasons_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze seasonal climate patterns"""
        
        patterns = {
            "temperature_trend": "stable",
            "precipitation_pattern": "normal",
            "extreme_event_frequency": "typical",
            "confidence": 0.7
        }
        
        # This would include sophisticated climate pattern analysis
        # For now, return basic structure
        
        return patterns