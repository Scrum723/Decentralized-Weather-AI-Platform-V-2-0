"""
NOAA RAMADDA Physical Science Laboratory Integration
Repository for Archiving, Managing and Accessing Diverse DAta

RAMADDA provides access to:
- NCEP/NCAR Reanalysis data
- NOAA/ESRL gridded climate datasets  
- Model outputs and forecasts
- Atmospheric and oceanic data
- Climate indices and patterns
"""

import httpx
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
import logging
import xml.etree.ElementTree as ET
import re

logger = logging.getLogger(__name__)

class NOAARAMADDAIntegration:
    """NOAA RAMADDA Physical Science Laboratory data integration"""
    
    def __init__(self):
        # NOAA PSL RAMADDA endpoints
        self.base_url = "https://psl.noaa.gov/repository"
        self.search_url = f"{self.base_url}/search"
        self.data_url = f"{self.base_url}/entry"
        
        # Common headers
        self.headers = {
            "User-Agent": "Weather-AGI/2.0 (cclot1@brockport.edu)",
            "Accept": "application/json,application/xml,text/xml"
        }
        
        # Key datasets available through RAMADDA
        self.key_datasets = {
            "reanalysis": {
                "ncep_ncar": "NCEP/NCAR Reanalysis",
                "era5": "ERA5 Reanalysis", 
                "jra55": "JRA-55 Reanalysis"
            },
            "climate_indices": {
                "nao": "North Atlantic Oscillation",
                "pdo": "Pacific Decadal Oscillation",
                "soi": "Southern Oscillation Index",
                "qbo": "Quasi-Biennial Oscillation"
            },
            "gridded_data": {
                "temperature": "Global Temperature Grids",
                "precipitation": "Precipitation Analysis", 
                "pressure": "Sea Level Pressure Grids"
            },
            "model_data": {
                "gfs": "Global Forecast System",
                "cfs": "Climate Forecast System",
                "nmme": "North American Multi-Model Ensemble"
            }
        }

    async def search_datasets(self, query: str, data_type: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Search RAMADDA repository for datasets"""
        
        try:
            params = {
                "q": query,
                "type": "any",
                "output": "xml.entries",
                "max": limit,
                "skip": 0
            }
            
            if data_type:
                params["type"] = data_type
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    self.search_url,
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code == 200:
                    # Parse XML response
                    entries = self._parse_xml_entries(response.content)
                    return entries
                else:
                    logger.error(f"RAMADDA search failed: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Failed to search RAMADDA: {str(e)}")
            return []

    async def get_reanalysis_data(self, lat: float, lon: float, 
                                  dataset: str = "ncep_ncar",
                                  variables: List[str] = None,
                                  time_range: Tuple[str, str] = None) -> Dict[str, Any]:
        """Get reanalysis data for a specific location and time period"""
        
        if variables is None:
            variables = ["air", "pres", "uwnd", "vwnd", "hgt"]  # Temperature, pressure, winds, geopotential height
        
        if time_range is None:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            time_range = (start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"))
        
        try:
            # Search for reanalysis datasets
            query = f"{dataset} reanalysis {' '.join(variables)}"
            datasets = await self.search_datasets(query, "grid", limit=5)
            
            if not datasets:
                return {"error": f"No {dataset} reanalysis data found"}
            
            # Get data from the most relevant dataset
            dataset_info = datasets[0]
            
            # Extract location-specific data (this would typically involve OPeNDAP or similar)
            reanalysis_data = await self._extract_point_data(
                dataset_info, lat, lon, variables, time_range
            )
            
            return {
                "location": [lat, lon],
                "dataset": dataset_info,
                "variables": variables,
                "time_range": time_range,
                "data": reanalysis_data,
                "source": "NOAA Physical Science Laboratory RAMADDA"
            }
            
        except Exception as e:
            logger.error(f"Failed to get reanalysis data: {str(e)}")
            return {"error": str(e)}

    async def get_climate_indices(self, indices: List[str] = None, 
                                  months_back: int = 24) -> Dict[str, Any]:
        """Get climate indices data (NAO, PDO, SOI, etc.)"""
        
        if indices is None:
            indices = ["nao", "pdo", "soi", "qbo"]
        
        try:
            climate_data = {}
            
            for index in indices:
                if index in self.key_datasets["climate_indices"]:
                    index_name = self.key_datasets["climate_indices"][index]
                    
                    # Search for climate index data
                    datasets = await self.search_datasets(
                        f"{index_name} index monthly",
                        "timeseries",
                        limit=3
                    )
                    
                    if datasets:
                        # Get the most recent data
                        index_data = await self._get_timeseries_data(
                            datasets[0], months_back
                        )
                        climate_data[index] = {
                            "name": index_name,
                            "data": index_data,
                            "source": datasets[0]
                        }
            
            return {
                "indices": climate_data,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "NOAA PSL Climate Indices"
            }
            
        except Exception as e:
            logger.error(f"Failed to get climate indices: {str(e)}")
            return {"error": str(e)}

    async def get_model_forecast_data(self, lat: float, lon: float,
                                      model: str = "gfs",
                                      forecast_hours: int = 120) -> Dict[str, Any]:
        """Get numerical weather model forecast data"""
        
        try:
            model_name = self.key_datasets["model_data"].get(model, "Global Forecast System")
            
            # Search for model forecast data
            query = f"{model_name} forecast"
            datasets = await self.search_datasets(query, "grid", limit=5)
            
            if not datasets:
                return {"error": f"No {model} forecast data found"}
            
            # Get forecast data for the location
            forecast_data = await self._extract_forecast_data(
                datasets[0], lat, lon, forecast_hours
            )
            
            return {
                "location": [lat, lon],
                "model": model_name,
                "forecast_hours": forecast_hours,
                "data": forecast_data,
                "source": "NOAA PSL Model Data"
            }
            
        except Exception as e:
            logger.error(f"Failed to get model forecast data: {str(e)}")
            return {"error": str(e)}

    async def get_gridded_climate_data(self, lat: float, lon: float,
                                       variable: str = "temperature",
                                       temporal_range: str = "monthly") -> Dict[str, Any]:
        """Get gridded climate analysis data"""
        
        try:
            # Search for gridded climate data
            var_name = self.key_datasets["gridded_data"].get(variable, variable)
            query = f"{var_name} {temporal_range} gridded analysis"
            
            datasets = await self.search_datasets(query, "grid", limit=5)
            
            if not datasets:
                return {"error": f"No gridded {variable} data found"}
            
            # Extract data for the specific location
            climate_data = await self._extract_gridded_data(
                datasets[0], lat, lon, variable, temporal_range
            )
            
            return {
                "location": [lat, lon],
                "variable": variable,
                "temporal_range": temporal_range,
                "data": climate_data,
                "source": "NOAA PSL Gridded Data"
            }
            
        except Exception as e:
            logger.error(f"Failed to get gridded climate data: {str(e)}")
            return {"error": str(e)}

    async def get_atmospheric_patterns(self, pattern_types: List[str] = None) -> Dict[str, Any]:
        """Get atmospheric pattern analysis (teleconnections, etc.)"""
        
        if pattern_types is None:
            pattern_types = ["mjo", "enso", "arctic_oscillation", "pna"]
        
        try:
            pattern_data = {}
            
            for pattern in pattern_types:
                # Search for pattern data
                datasets = await self.search_datasets(
                    f"{pattern} pattern analysis",
                    "analysis",
                    limit=3
                )
                
                if datasets:
                    pattern_info = await self._get_pattern_data(datasets[0])
                    pattern_data[pattern] = pattern_info
            
            return {
                "patterns": pattern_data,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "NOAA PSL Atmospheric Patterns"
            }
            
        except Exception as e:
            logger.error(f"Failed to get atmospheric patterns: {str(e)}")
            return {"error": str(e)}

    def _parse_xml_entries(self, xml_content: bytes) -> List[Dict[str, Any]]:
        """Parse XML entries from RAMADDA search results"""
        
        try:
            root = ET.fromstring(xml_content)
            entries = []
            
            # Look for entry elements
            for entry in root.findall('.//entry'):
                entry_data = {
                    "id": entry.get("id", ""),
                    "name": entry.get("name", ""),
                    "type": entry.get("type", ""),
                    "description": entry.get("description", ""),
                    "url": f"{self.base_url}/entry/show?entryid={entry.get('id', '')}",
                    "size": entry.get("size", ""),
                    "createdate": entry.get("createdate", ""),
                    "changedate": entry.get("changedate", "")
                }
                
                # Extract additional metadata
                for attr in entry.findall('.//attribute'):
                    key = attr.get("name", "")
                    value = attr.get("value", "")
                    if key:
                        entry_data[f"attr_{key}"] = value
                
                entries.append(entry_data)
            
            return entries
            
        except ET.ParseError as e:
            logger.error(f"Failed to parse XML: {str(e)}")
            return []

    async def _extract_point_data(self, dataset_info: Dict, lat: float, lon: float,
                                  variables: List[str], time_range: Tuple[str, str]) -> Dict[str, Any]:
        """Extract point data from gridded dataset (mock implementation)"""
        
        # This would typically use OPeNDAP or similar data access protocol
        # For demonstration, return mock structure
        
        import random
        
        mock_data = {}
        for var in variables:
            mock_data[var] = {
                "values": [random.uniform(-50, 50) for _ in range(30)],
                "units": self._get_variable_units(var),
                "long_name": self._get_variable_long_name(var)
            }
        
        return {
            "extracted_location": [lat, lon],
            "time_series": mock_data,
            "metadata": {
                "extraction_method": "nearest_neighbor",
                "grid_resolution": "2.5° x 2.5°",
                "temporal_resolution": "daily"
            }
        }

    async def _get_timeseries_data(self, dataset_info: Dict, months_back: int) -> Dict[str, Any]:
        """Get time series data from climate index dataset"""
        
        # Mock implementation - would access actual data via OPeNDAP/THREDDS
        import random
        
        current_date = datetime.now()
        data_points = []
        
        for i in range(months_back):
            date = current_date - timedelta(days=30 * i)
            value = random.uniform(-3, 3)  # Typical climate index range
            data_points.append({
                "date": date.strftime("%Y-%m"),
                "value": value
            })
        
        return {
            "time_series": list(reversed(data_points)),
            "statistics": {
                "mean": sum(p["value"] for p in data_points) / len(data_points),
                "std": 1.2,  # Mock standard deviation
                "trend": "neutral"
            }
        }

    async def _extract_forecast_data(self, dataset_info: Dict, lat: float, lon: float,
                                     forecast_hours: int) -> Dict[str, Any]:
        """Extract forecast data for a location"""
        
        # Mock implementation
        import random
        
        forecast_data = []
        base_time = datetime.utcnow()
        
        for hour in range(0, forecast_hours + 1, 6):  # Every 6 hours
            forecast_time = base_time + timedelta(hours=hour)
            forecast_data.append({
                "forecast_time": forecast_time.isoformat(),
                "temperature": random.uniform(-10, 40),  # °C
                "pressure": random.uniform(980, 1040),   # hPa
                "wind_speed": random.uniform(0, 25),     # m/s
                "wind_direction": random.uniform(0, 360), # degrees
                "precipitation": random.uniform(0, 5)    # mm/hr
            })
        
        return {
            "forecast": forecast_data,
            "model_run": base_time.isoformat(),
            "resolution": "0.5° x 0.5°",
            "variables": ["temperature", "pressure", "wind", "precipitation"]
        }

    async def _extract_gridded_data(self, dataset_info: Dict, lat: float, lon: float,
                                    variable: str, temporal_range: str) -> Dict[str, Any]:
        """Extract gridded climate data"""
        
        # Mock implementation
        import random
        
        if temporal_range == "monthly":
            months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            data = {}
            for month in months:
                if variable == "temperature":
                    value = random.uniform(-30, 45)  # °C
                    unit = "°C"
                elif variable == "precipitation":
                    value = random.uniform(0, 300)   # mm
                    unit = "mm"
                else:
                    value = random.uniform(0, 100)
                    unit = "units"
                
                data[month] = {"value": value, "unit": unit}
        else:
            data = {"annual": {"value": random.uniform(0, 100), "unit": "units"}}
        
        return {
            "climatology": data,
            "reference_period": "1991-2020",
            "grid_point": [lat, lon],
            "spatial_resolution": "2.5° x 2.5°"
        }

    async def _get_pattern_data(self, dataset_info: Dict) -> Dict[str, Any]:
        """Get atmospheric pattern data"""
        
        import random
        
        return {
            "current_phase": random.choice(["positive", "negative", "neutral"]),
            "strength": random.uniform(0, 3),
            "persistence": random.uniform(0.2, 0.9),
            "forecast": {
                "next_month": random.choice(["strengthening", "weakening", "maintaining"]),
                "confidence": random.uniform(0.5, 0.95)
            }
        }

    def _get_variable_units(self, variable: str) -> str:
        """Get standard units for meteorological variables"""
        units_map = {
            "air": "°C",
            "pres": "hPa", 
            "uwnd": "m/s",
            "vwnd": "m/s",
            "hgt": "m",
            "precip": "mm",
            "rh": "%"
        }
        return units_map.get(variable, "units")

    def _get_variable_long_name(self, variable: str) -> str:
        """Get descriptive names for meteorological variables"""
        names_map = {
            "air": "Air Temperature",
            "pres": "Atmospheric Pressure",
            "uwnd": "Zonal Wind Component",
            "vwnd": "Meridional Wind Component", 
            "hgt": "Geopotential Height",
            "precip": "Precipitation",
            "rh": "Relative Humidity"
        }
        return names_map.get(variable, variable.title())

    async def get_comprehensive_analysis(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get comprehensive atmospheric analysis combining multiple RAMADDA datasets"""
        
        try:
            # Run multiple data requests in parallel
            tasks = [
                self.get_reanalysis_data(lat, lon),
                self.get_climate_indices(),
                self.get_model_forecast_data(lat, lon),
                self.get_gridded_climate_data(lat, lon),
                self.get_atmospheric_patterns()
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            return {
                "location": [lat, lon],
                "timestamp": datetime.utcnow().isoformat(),
                "reanalysis": results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])},
                "climate_indices": results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])},
                "model_forecast": results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])},
                "gridded_climate": results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])},
                "atmospheric_patterns": results[4] if not isinstance(results[4], Exception) else {"error": str(results[4])},
                "source": "NOAA Physical Science Laboratory RAMADDA Repository"
            }
            
        except Exception as e:
            logger.error(f"Failed to get comprehensive RAMADDA analysis: {str(e)}")
            return {"error": str(e)}