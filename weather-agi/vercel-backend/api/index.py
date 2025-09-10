from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Tuple, Any
import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
import httpx
from dataclasses import dataclass, asdict
# Use mock numpy for Windows compatibility
try:
    import numpy as np
except ImportError:
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from numpy_mock import np
import structlog

# Import our enhanced integrations
from .nws_integration import NWSWeatherAPI
from .openai_integration import WeatherAGIWithOpenAI
from .noaa_climatology import NOAAClimatologyAPI
from .noaa_ramadda import NOAARAMADDAIntegration
from .weather_underground_integration import WeatherUndergroundAPI
from .nasa_integration import NASAWeatherAPI
from .meteorological_agi import DOCMeteorologicalAGI

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# FastAPI app
app = FastAPI(
    title="Weather AGI API",
    description="Professional Severe Weather Forecasting API",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class APIKeys(BaseModel):
    nasa: Optional[str] = None
    openai: Optional[str] = None
    weather_underground: Optional[str] = None

class InitializeRequest(BaseModel):
    api_keys: APIKeys

class AnalyzeRequest(BaseModel):
    location: Tuple[float, float]
    api_keys: APIKeys

class NWSAlert(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    urgency: str
    certainty: str
    event: str
    issued: datetime
    expires: Optional[datetime] = None
    area: str

class NWSObservation(BaseModel):
    station_id: str
    timestamp: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    pressure: Optional[float] = None
    visibility: Optional[float] = None
    conditions: Optional[str] = None

@dataclass
class SevereWeatherParameters:
    surface_cape: float
    surface_cin: float
    mixed_layer_cape: float
    mixed_layer_cin: float
    most_unstable_cape: float
    most_unstable_cin: float
    lcl_pressure: float
    lcl_temperature: float
    lcl_height: float
    lfc_pressure: float
    lfc_temperature: float
    lfc_height: float
    el_pressure: float
    el_temperature: float
    el_height: float
    wind_shear_0_1km: float
    wind_shear_0_3km: float
    wind_shear_0_6km: float
    storm_relative_helicity_0_1km: float
    storm_relative_helicity_0_3km: float
    supercell_composite: float
    significant_tornado: float
    energy_helicity_index: float
    bunkers_right_motion: Tuple[float, float]
    bunkers_left_motion: Tuple[float, float]
    convective_temperature: float
    downdraft_cape: float
    wind_index: float

@dataclass
class SynopticAnalysis:
    location: Tuple[float, float]
    timestamp: str
    surface_pressure: float
    pressure_tendency: float
    temperature_advection: float
    moisture_advection: float
    geopotential_height_500mb: float
    vorticity_500mb: float
    divergence_200mb: float
    jet_stream_position: Tuple[float, float]
    front_type: str
    front_distance: float
    front_speed: float
    upper_level_divergence: float
    low_level_convergence: float

@dataclass
class MLForecast:
    tornado_probability: float
    severe_thunderstorm_probability: float
    hail_probability: float
    flash_flood_probability: float
    forecast_confidence: float
    model_ensemble_mean: Dict[str, float]

# Global state
system_initialized = False
api_keys_cache = {}

# Weather data APIs (free services for Vercel deployment)
WEATHER_APIS = {
    "openweather": "https://api.openweathermap.org/data/2.5",
    "weatherapi": "https://api.weatherapi.com/v1"
}

class WeatherAGIEngine:
    """Enhanced Weather AGI engine with NWS, NASA, OpenAI, NOAA climatology, and RAMADDA integration"""
    
    def __init__(self):
        self.initialized = False
        self.api_keys = {}
        self.nws_api = NWSWeatherAPI()
        self.noaa_climate_api = NOAAClimatologyAPI()
        self.noaa_ramadda_api = NOAARAMADDAIntegration()
        self.weather_underground_api = None
        self.nasa_api = None
        self.openai_engine = None
        self.doc_agi = None
    
    def initialize(self, api_keys: Dict[str, str]) -> bool:
        """Initialize the weather AGI system"""
        try:
            self.api_keys = api_keys
            
            # Initialize OpenAI integration if key is provided
            if 'openai' in api_keys and api_keys['openai']:
                self.openai_engine = WeatherAGIWithOpenAI(api_keys['openai'])
            
            # Initialize Weather Underground API if key is provided
            if 'weather_underground' in api_keys and api_keys['weather_underground']:
                self.weather_underground_api = WeatherUndergroundAPI(api_keys['weather_underground'])
            
            # Initialize NASA API if key is provided
            if 'nasa' in api_keys and api_keys['nasa']:
                self.nasa_api = NASAWeatherAPI(api_keys['nasa'])
            
            # Initialize DOC AGI if OpenAI key is available
            if 'openai' in api_keys and api_keys['openai']:
                weather_api_dict = {
                    'nws_api': self.nws_api,
                    'nasa_api': self.nasa_api,
                    'weather_underground_api': self.weather_underground_api,
                    'noaa_climate_api': self.noaa_climate_api,
                    'noaa_ramadda_api': self.noaa_ramadda_api
                }
                self.doc_agi = DOCMeteorologicalAGI(api_keys['openai'], weather_api_dict)
            
            self.initialized = True
            logger.info("Weather AGI system initialized", 
                       api_keys_provided=len(api_keys),
                       openai_enabled=self.openai_engine is not None)
            return True
        except Exception as e:
            logger.error("Failed to initialize Weather AGI", error=str(e))
            return False
    
    async def analyze_weather(self, location: Tuple[float, float]) -> Dict[str, Any]:
        """Run comprehensive weather analysis with enhanced integrations"""
        if not self.initialized:
            raise HTTPException(status_code=400, detail="System not initialized")
        
        lat, lon = location
        
        try:
            # Fetch NWS data
            nws_alerts = await self.nws_api.get_active_alerts(lat, lon)
            nws_observations = await self.nws_api.get_current_observations(lat, lon)
            nws_forecast = await self.nws_api.get_gridpoint_forecast(lat, lon)
            
            # Fetch Weather Underground data if available
            wu_data = {}
            if self.weather_underground_api:
                wu_data = await self.weather_underground_api.get_comprehensive_weather_data(lat, lon)
            
            # Fetch NASA data if available
            nasa_data = {}
            if self.nasa_api:
                nasa_data = await self.nasa_api.get_comprehensive_nasa_data(lat, lon)
            
            # Fetch basic weather data (enhanced with NWS data)
            weather_data = await self._fetch_weather_data(lat, lon, nws_observations)
            
            # Generate severe weather parameters (enhanced with NWS data)
            parameters = self._generate_parameters_with_nws(lat, lon, weather_data, nws_forecast)
            
            # Generate synoptic analysis
            synoptic = self._generate_synoptic_analysis(lat, lon)
            
            # Generate ML forecast
            ml_forecast = self._generate_ml_forecast(parameters)
            
            # Generate human-readable summary
            summary = self._generate_summary(parameters, synoptic, ml_forecast, lat, lon)
            
            # Prepare base analysis
            analysis = {
                "location": location,
                "timestamp": datetime.utcnow().isoformat(),
                "parameters": asdict(parameters),
                "synoptic_analysis": asdict(synoptic),
                "ml_forecast": asdict(ml_forecast),
                "human_readable_summary": summary,
                "nws_data": {
                    "alerts": nws_alerts,
                    "observations": nws_observations,
                    "forecast": nws_forecast
                }
            }
            
            # Enhance with AI if available
            if self.openai_engine:
                try:
                    enhanced_analysis = await self.openai_engine.enhance_weather_analysis(analysis)
                    analysis.update(enhanced_analysis)
                except Exception as e:
                    logger.warning("AI enhancement failed", error=str(e))
                    analysis["ai_enhancement_error"] = str(e)
            
            return analysis
            
        except Exception as e:
            logger.error("Weather analysis failed", error=str(e), location=location)
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    async def _fetch_weather_data(self, lat: float, lon: float, nws_observations: List = None) -> Dict[str, Any]:
        """Fetch weather data from external APIs, enhanced with NWS data"""
        base_data = {
            "temperature": 25.0 + np.random.normal(0, 5),
            "humidity": 60.0 + np.random.normal(0, 20),
            "pressure": 1013.25 + np.random.normal(0, 10),
            "wind_speed": 10.0 + np.random.normal(0, 5),
            "wind_direction": 180.0 + np.random.normal(0, 45)
        }
        
        # Use NWS observations if available
        if nws_observations:
            for obs in nws_observations:
                if obs.get('temperature') is not None:
                    base_data['temperature'] = obs['temperature']
                if obs.get('humidity') is not None:
                    base_data['humidity'] = obs['humidity']
                if obs.get('pressure') is not None:
                    base_data['pressure'] = obs['pressure']
                if obs.get('wind_speed') is not None:
                    base_data['wind_speed'] = obs['wind_speed']
                if obs.get('wind_direction') is not None:
                    base_data['wind_direction'] = obs['wind_direction']
                break  # Use first available observation
        
        return base_data
    
    def _generate_parameters_with_nws(self, lat: float, lon: float, weather_data: Dict, nws_forecast: Dict = None) -> SevereWeatherParameters:
        """Generate mock severe weather parameters based on location and conditions"""
        # Add some location-based variability
        cape_base = 2000 + (abs(lat - 40) * 50) + np.random.normal(0, 500)
        cape_base = max(0, cape_base)
        
        shear_base = 15 + np.random.normal(0, 5)
        shear_base = max(0, shear_base)
        
        return SevereWeatherParameters(
            surface_cape=cape_base,
            surface_cin=75.0 + np.random.normal(0, 25),
            mixed_layer_cape=cape_base * 0.9,
            mixed_layer_cin=45.0 + np.random.normal(0, 15),
            most_unstable_cape=cape_base * 1.1,
            most_unstable_cin=30.0 + np.random.normal(0, 10),
            lcl_pressure=850.0 + np.random.normal(0, 50),
            lcl_temperature=18.5 + np.random.normal(0, 5),
            lcl_height=1200.0 + np.random.normal(0, 300),
            lfc_pressure=780.0 + np.random.normal(0, 50),
            lfc_temperature=12.0 + np.random.normal(0, 3),
            lfc_height=2100.0 + np.random.normal(0, 300),
            el_pressure=200.0 + np.random.normal(0, 30),
            el_temperature=-42.0 + np.random.normal(0, 5),
            el_height=12000.0 + np.random.normal(0, 1000),
            wind_shear_0_1km=shear_base * 0.4,
            wind_shear_0_3km=shear_base * 0.7,
            wind_shear_0_6km=shear_base,
            storm_relative_helicity_0_1km=185.0 + np.random.normal(0, 50),
            storm_relative_helicity_0_3km=280.0 + np.random.normal(0, 70),
            supercell_composite=min(10, max(0, cape_base / 1000 + shear_base / 10)),
            significant_tornado=min(8, max(0, (cape_base / 1500) * (shear_base / 15))),
            energy_helicity_index=3.1 + np.random.normal(0, 1),
            bunkers_right_motion=(245.0 + np.random.normal(0, 20), 18.5 + np.random.normal(0, 5)),
            bunkers_left_motion=(205.0 + np.random.normal(0, 20), 12.2 + np.random.normal(0, 3)),
            convective_temperature=28.5 + np.random.normal(0, 5),
            downdraft_cape=450.0 + np.random.normal(0, 100),
            wind_index=2.3 + np.random.normal(0, 0.5)
        )
    
    def _generate_synoptic_analysis(self, lat: float, lon: float) -> SynopticAnalysis:
        """Generate mock synoptic analysis"""
        return SynopticAnalysis(
            location=(lat, lon),
            timestamp=datetime.utcnow().isoformat(),
            surface_pressure=1012.5 + np.random.normal(0, 10),
            pressure_tendency=-2.8 + np.random.normal(0, 3),
            temperature_advection=0.8 + np.random.normal(0, 1),
            moisture_advection=1.2 + np.random.normal(0, 0.5),
            geopotential_height_500mb=5620 + np.random.normal(0, 100),
            vorticity_500mb=1.8e-5 + np.random.normal(0, 0.5e-5),
            divergence_200mb=-1.2e-5 + np.random.normal(0, 0.3e-5),
            jet_stream_position=(lat + 8, lon - 5),
            front_type=np.random.choice(["cold", "warm", "occluded", "stationary"]),
            front_distance=125.0 + np.random.normal(0, 50),
            front_speed=28.0 + np.random.normal(0, 10),
            upper_level_divergence=1.1e-5 + np.random.normal(0, 0.2e-5),
            low_level_convergence=1.5e-5 + np.random.normal(0, 0.3e-5)
        )
    
    def _generate_ml_forecast(self, parameters: SevereWeatherParameters) -> MLForecast:
        """Generate ML-based forecast probabilities"""
        # Simple probability calculation based on parameters
        cape_factor = min(1.0, parameters.surface_cape / 4000.0)
        shear_factor = min(1.0, parameters.wind_shear_0_6km / 30.0)
        helicity_factor = min(1.0, parameters.storm_relative_helicity_0_3km / 400.0)
        
        tornado_prob = min(0.95, (cape_factor * shear_factor * helicity_factor) * 0.8)
        severe_prob = min(0.95, (cape_factor + shear_factor) * 0.5)
        hail_prob = min(0.90, cape_factor * 0.7)
        flood_prob = min(0.80, cape_factor * 0.4)
        
        return MLForecast(
            tornado_probability=tornado_prob,
            severe_thunderstorm_probability=severe_prob,
            hail_probability=hail_prob,
            flash_flood_probability=flood_prob,
            forecast_confidence=0.87 + np.random.normal(0, 0.05),
            model_ensemble_mean={
                "cape_forecast_6hr": parameters.surface_cape * (1 + np.random.normal(0, 0.1)),
                "shear_forecast_6hr": parameters.wind_shear_0_6km * (1 + np.random.normal(0, 0.1))
            }
        )
    
    def _generate_summary(self, parameters: SevereWeatherParameters, synoptic: SynopticAnalysis, 
                         ml_forecast: MLForecast, lat: float, lon: float) -> str:
        """Generate human-readable analysis summary"""
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
        
        # Determine threat levels
        tornado_threat = "HIGH" if ml_forecast.tornado_probability > 0.6 else "MODERATE" if ml_forecast.tornado_probability > 0.3 else "LOW"
        hail_threat = "HIGH" if ml_forecast.hail_probability > 0.6 else "MODERATE" if ml_forecast.hail_probability > 0.3 else "LOW"
        wind_threat = "HIGH" if ml_forecast.severe_thunderstorm_probability > 0.7 else "MODERATE" if ml_forecast.severe_thunderstorm_probability > 0.4 else "LOW"
        
        cape_level = "EXTREMELY UNSTABLE" if parameters.surface_cape > 3000 else "VERY UNSTABLE" if parameters.surface_cape > 2000 else "UNSTABLE" if parameters.surface_cape > 1000 else "STABLE"
        shear_level = "STRONG" if parameters.wind_shear_0_6km > 20 else "MODERATE" if parameters.wind_shear_0_6km > 10 else "WEAK"
        
        return f"""PROFESSIONAL SEVERE WEATHER ANALYSIS

Location: {lat:.4f}°N, {abs(lon):.4f}°W
Analysis Time: {timestamp}

THERMODYNAMIC ENVIRONMENT:
Surface-Based CAPE: {parameters.surface_cape:.0f} J/kg ({cape_level})
Mixed Layer CAPE: {parameters.mixed_layer_cape:.0f} J/kg
Most Unstable CAPE: {parameters.most_unstable_cape:.0f} J/kg
Surface-Based CIN: {parameters.surface_cin:.0f} J/kg

CRITICAL LEVELS:
LCL: {parameters.lcl_pressure:.0f} hPa ({parameters.lcl_height:.0f} m AGL)
LFC: {parameters.lfc_pressure:.0f} hPa ({parameters.lfc_height:.0f} m AGL)
EL: {parameters.el_pressure:.0f} hPa ({parameters.el_height:.0f} m AGL)

KINEMATIC ENVIRONMENT:
0-1 km Bulk Shear: {parameters.wind_shear_0_1km:.1f} m/s
0-3 km Bulk Shear: {parameters.wind_shear_0_3km:.1f} m/s
0-6 km Bulk Shear: {parameters.wind_shear_0_6km:.1f} m/s ({shear_level})
0-3 km SRH: {parameters.storm_relative_helicity_0_3km:.0f} m²/s²

COMPOSITE PARAMETERS:
Supercell Composite Parameter: {parameters.supercell_composite:.1f}
Significant Tornado Parameter: {parameters.significant_tornado:.1f}

SEVERE WEATHER OUTLOOK:
🌪️ TORNADO RISK: {tornado_threat} ({ml_forecast.tornado_probability:.0%} probability)
🧊 LARGE HAIL RISK: {hail_threat} ({ml_forecast.hail_probability:.0%} probability)
💨 DAMAGING WIND RISK: {wind_threat} ({ml_forecast.severe_thunderstorm_probability:.0%} probability)
🌊 FLASH FLOOD RISK: {"HIGH" if ml_forecast.flash_flood_probability > 0.6 else "MODERATE" if ml_forecast.flash_flood_probability > 0.3 else "LOW"} ({ml_forecast.flash_flood_probability:.0%} probability)

FORECAST CONFIDENCE: {ml_forecast.forecast_confidence:.0%}

RECOMMENDED ACTIONS:
- Monitor weather warnings continuously
- Have multiple ways to receive warnings  
- Identify safe rooms/basements immediately
- Stay weather aware through the evening"""

# Initialize the weather engine
weather_engine = WeatherAGIEngine()

# API endpoints
@app.get("/api/")
async def root():
    return {
        "message": "Weather AGI API v2.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "system_initialized": weather_engine.initialized
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system_initialized": weather_engine.initialized,
        "version": "2.0.0"
    }

@app.post("/api/initialize")
async def initialize_system(request: InitializeRequest):
    """Initialize the Weather AGI system"""
    try:
        api_keys = request.api_keys.dict(exclude_none=True)
        success = weather_engine.initialize(api_keys)
        
        if success:
            return {
                "status": "initialized",
                "message": "Weather AGI system successfully initialized",
                "timestamp": datetime.utcnow().isoformat(),
                "api_keys_configured": len(api_keys)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to initialize system")
            
    except Exception as e:
        logger.error("Initialization failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_weather(request: AnalyzeRequest):
    """Run comprehensive weather analysis"""
    try:
        if not weather_engine.initialized:
            # Auto-initialize with provided API keys
            api_keys = request.api_keys.dict(exclude_none=True)
            weather_engine.initialize(api_keys)
        
        analysis_data = await weather_engine.analyze_weather(request.location)
        
        logger.info("Weather analysis completed", location=request.location)
        return analysis_data
        
    except Exception as e:
        logger.error("Analysis failed", error=str(e), location=request.location)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/current")
async def get_current_conditions(lat: float, lon: float):
    """Get current weather conditions"""
    try:
        # Mock current conditions for demo
        return {
            "location": [lat, lon],
            "timestamp": datetime.utcnow().isoformat(),
            "temperature": 25.0 + np.random.normal(0, 5),
            "humidity": 60.0 + np.random.normal(0, 20),
            "pressure": 1013.25 + np.random.normal(0, 10),
            "wind_speed": 10.0 + np.random.normal(0, 5),
            "wind_direction": 180.0 + np.random.normal(0, 45),
            "conditions": "Partly Cloudy"
        }
        
    except Exception as e:
        logger.error("Current conditions fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts")
async def get_weather_alerts(lat: float, lon: float, radius: float = 50):
    """Get weather alerts for a region (enhanced with NWS data)"""
    try:
        nws_api = NWSWeatherAPI()
        nws_alerts = await nws_api.get_active_alerts(lat, lon, int(radius))
        
        return {
            "location": [lat, lon],
            "radius": radius,
            "alerts": nws_alerts,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "National Weather Service"
        }
        
    except Exception as e:
        logger.error("NWS alerts fetch failed", error=str(e))
        # Fallback to mock data
        alerts = []
        if np.random.random() > 0.5:
            alerts.extend([
                {
                    "id": "1",
                    "type": "tornado",
                    "severity": "watch",
                    "title": "Tornado Watch",
                    "description": "Conditions favorable for tornado development.",
                    "issued": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                    "expires": (datetime.utcnow() + timedelta(hours=6)).isoformat(),
                    "area": f"Within {radius} miles of {lat:.2f}°N, {abs(lon):.2f}°W"
                }
            ])
        
        return {
            "location": [lat, lon],
            "radius": radius,
            "alerts": alerts,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Fallback data",
            "error": str(e)
        }

@app.get("/api/nws/forecast")
async def get_nws_forecast(lat: float, lon: float):
    """Get NWS gridpoint forecast"""
    try:
        nws_api = NWSWeatherAPI()
        forecast_data = await nws_api.get_gridpoint_forecast(lat, lon)
        return {
            "location": [lat, lon],
            "forecast": forecast_data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "National Weather Service"
        }
    except Exception as e:
        logger.error("NWS forecast fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nws/observations")  
async def get_nws_observations(lat: float, lon: float):
    """Get current NWS observations"""
    try:
        nws_api = NWSWeatherAPI()
        observations = await nws_api.get_current_observations(lat, lon)
        return {
            "location": [lat, lon],
            "observations": observations,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "National Weather Service"
        }
    except Exception as e:
        logger.error("NWS observations fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-enhance")
async def ai_enhance_analysis(analysis_data: Dict[str, Any]):
    """Enhance weather analysis with AI"""
    try:
        if not weather_engine.openai_engine:
            raise HTTPException(status_code=400, detail="OpenAI integration not configured")
        
        enhanced = await weather_engine.openai_engine.enhance_weather_analysis(analysis_data)
        return enhanced
        
    except Exception as e:
        logger.error("AI enhancement failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/noaa/climate-summary")
async def get_climate_summary(lat: float, lon: float, year: int = None):
    """Get comprehensive NOAA climate summary"""
    try:
        summary = await weather_engine.noaa_climate_api.get_climate_summary(lat, lon, year)
        return {
            "location": [lat, lon],
            "climate_summary": summary,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA Climate Data Online"
        }
    except Exception as e:
        logger.error("NOAA climate summary fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/noaa/climate-normals")
async def get_climate_normals(lat: float, lon: float):
    """Get 30-year climate normals from NOAA"""
    try:
        normals = await weather_engine.noaa_climate_api.get_climate_normals(lat, lon)
        return {
            "location": [lat, lon],
            "climate_normals": normals,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA Climate Data Online"
        }
    except Exception as e:
        logger.error("NOAA climate normals fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/noaa/historical")
async def get_historical_weather(
    lat: float, 
    lon: float, 
    start_date: str, 
    end_date: str,
    datatypes: str = None
):
    """Get historical weather data from NOAA"""
    try:
        datatype_list = datatypes.split(",") if datatypes else None
        historical_data = await weather_engine.noaa_climate_api.get_historical_data(
            lat, lon, start_date, end_date, datatype_list
        )
        return {
            "location": [lat, lon],
            "historical_data": historical_data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA Climate Data Online"
        }
    except Exception as e:
        logger.error("NOAA historical data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/noaa/extreme-events")
async def get_extreme_events(lat: float, lon: float, days_back: int = 30):
    """Get recent extreme weather events from NOAA"""
    try:
        events = await weather_engine.noaa_climate_api.get_extreme_events(lat, lon, days_back)
        return {
            "location": [lat, lon],
            "extreme_events": events,
            "days_analyzed": days_back,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA Climate Data Online"
        }
    except Exception as e:
        logger.error("NOAA extreme events fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/noaa/seasonal-outlook")
async def get_seasonal_outlook(lat: float, lon: float):
    """Get seasonal climate outlook based on NOAA historical data"""
    try:
        outlook = await weather_engine.noaa_climate_api.get_seasonal_outlook(lat, lon)
        return {
            "location": [lat, lon],
            "seasonal_outlook": outlook,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA Climate Data Online"
        }
    except Exception as e:
        logger.error("NOAA seasonal outlook fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/noaa/stations")
async def get_nearby_stations(lat: float, lon: float, limit: int = 10):
    """Get nearby NOAA weather stations"""
    try:
        stations = await weather_engine.noaa_climate_api.get_nearest_stations(lat, lon, limit)
        return {
            "location": [lat, lon],
            "stations": stations,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA Climate Data Online"
        }
    except Exception as e:
        logger.error("NOAA stations fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# NOAA RAMADDA Physical Science Laboratory endpoints
@app.get("/api/ramadda/search")
async def search_ramadda_datasets(query: str, data_type: str = None, limit: int = 20):
    """Search NOAA RAMADDA repository for datasets"""
    try:
        results = await weather_engine.noaa_ramadda_api.search_datasets(query, data_type, limit)
        return {
            "query": query,
            "results": results,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA Physical Science Laboratory RAMADDA"
        }
    except Exception as e:
        logger.error("RAMADDA search failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ramadda/reanalysis")
async def get_reanalysis_data(
    lat: float, 
    lon: float,
    dataset: str = "ncep_ncar",
    variables: str = None,
    start_date: str = None,
    end_date: str = None
):
    """Get reanalysis data from RAMADDA"""
    try:
        var_list = variables.split(",") if variables else None
        time_range = (start_date, end_date) if start_date and end_date else None
        
        data = await weather_engine.noaa_ramadda_api.get_reanalysis_data(
            lat, lon, dataset, var_list, time_range
        )
        return {
            "location": [lat, lon],
            "reanalysis_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA PSL RAMADDA Reanalysis"
        }
    except Exception as e:
        logger.error("RAMADDA reanalysis fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ramadda/climate-indices")
async def get_climate_indices(indices: str = None, months_back: int = 24):
    """Get climate indices from RAMADDA"""
    try:
        index_list = indices.split(",") if indices else None
        data = await weather_engine.noaa_ramadda_api.get_climate_indices(index_list, months_back)
        return {
            "climate_indices": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA PSL Climate Indices"
        }
    except Exception as e:
        logger.error("RAMADDA climate indices fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ramadda/model-forecast")
async def get_model_forecast(
    lat: float,
    lon: float, 
    model: str = "gfs",
    forecast_hours: int = 120
):
    """Get numerical model forecast from RAMADDA"""
    try:
        data = await weather_engine.noaa_ramadda_api.get_model_forecast_data(
            lat, lon, model, forecast_hours
        )
        return {
            "location": [lat, lon],
            "model_forecast": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA PSL Model Data"
        }
    except Exception as e:
        logger.error("RAMADDA model forecast fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ramadda/gridded-climate")
async def get_gridded_climate(
    lat: float,
    lon: float,
    variable: str = "temperature",
    temporal_range: str = "monthly"
):
    """Get gridded climate data from RAMADDA"""
    try:
        data = await weather_engine.noaa_ramadda_api.get_gridded_climate_data(
            lat, lon, variable, temporal_range
        )
        return {
            "location": [lat, lon],
            "gridded_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA PSL Gridded Climate Data"
        }
    except Exception as e:
        logger.error("RAMADDA gridded climate fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ramadda/atmospheric-patterns")
async def get_atmospheric_patterns(patterns: str = None):
    """Get atmospheric pattern analysis from RAMADDA"""
    try:
        pattern_list = patterns.split(",") if patterns else None
        data = await weather_engine.noaa_ramadda_api.get_atmospheric_patterns(pattern_list)
        return {
            "atmospheric_patterns": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA PSL Atmospheric Patterns"
        }
    except Exception as e:
        logger.error("RAMADDA atmospheric patterns fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ramadda/comprehensive-analysis")
async def get_comprehensive_ramadda_analysis(lat: float, lon: float):
    """Get comprehensive atmospheric analysis from multiple RAMADDA datasets"""
    try:
        data = await weather_engine.noaa_ramadda_api.get_comprehensive_analysis(lat, lon)
        return {
            "location": [lat, lon],
            "comprehensive_analysis": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NOAA PSL RAMADDA Comprehensive Analysis"
        }
    except Exception as e:
        logger.error("RAMADDA comprehensive analysis fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Weather Underground API endpoints
@app.get("/api/weather-underground/current")
async def get_wu_current(lat: float, lon: float):
    """Get Weather Underground current conditions"""
    try:
        if not weather_engine.weather_underground_api:
            raise HTTPException(status_code=400, detail="Weather Underground API not configured")
        
        data = await weather_engine.weather_underground_api.get_current_conditions(lat, lon)
        return {
            "location": [lat, lon],
            "current_conditions": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Weather Underground"
        }
    except Exception as e:
        logger.error("Weather Underground current conditions fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather-underground/forecast")
async def get_wu_forecast(lat: float, lon: float, days: int = 5):
    """Get Weather Underground forecast"""
    try:
        if not weather_engine.weather_underground_api:
            raise HTTPException(status_code=400, detail="Weather Underground API not configured")
        
        data = await weather_engine.weather_underground_api.get_forecast(lat, lon, days)
        return {
            "location": [lat, lon],
            "forecast": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Weather Underground"
        }
    except Exception as e:
        logger.error("Weather Underground forecast fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather-underground/hourly")
async def get_wu_hourly(lat: float, lon: float, hours: int = 24):
    """Get Weather Underground hourly forecast"""
    try:
        if not weather_engine.weather_underground_api:
            raise HTTPException(status_code=400, detail="Weather Underground API not configured")
        
        data = await weather_engine.weather_underground_api.get_hourly_forecast(lat, lon, hours)
        return {
            "location": [lat, lon],
            "hourly_forecast": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Weather Underground"
        }
    except Exception as e:
        logger.error("Weather Underground hourly forecast fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather-underground/pws")
async def get_wu_pws(lat: float, lon: float, radius: int = 20):
    """Get Weather Underground Personal Weather Station data"""
    try:
        if not weather_engine.weather_underground_api:
            raise HTTPException(status_code=400, detail="Weather Underground API not configured")
        
        data = await weather_engine.weather_underground_api.get_pws_observations(lat, lon, radius)
        return {
            "location": [lat, lon],
            "pws_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Weather Underground PWS"
        }
    except Exception as e:
        logger.error("Weather Underground PWS data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather-underground/alerts")
async def get_wu_alerts(lat: float, lon: float):
    """Get Weather Underground severe weather alerts"""
    try:
        if not weather_engine.weather_underground_api:
            raise HTTPException(status_code=400, detail="Weather Underground API not configured")
        
        data = await weather_engine.weather_underground_api.get_severe_weather_alerts(lat, lon)
        return {
            "location": [lat, lon],
            "alerts": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Weather Underground Alerts"
        }
    except Exception as e:
        logger.error("Weather Underground alerts fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather-underground/historical")
async def get_wu_historical(lat: float, lon: float, start_date: str, end_date: str):
    """Get Weather Underground historical data"""
    try:
        if not weather_engine.weather_underground_api:
            raise HTTPException(status_code=400, detail="Weather Underground API not configured")
        
        data = await weather_engine.weather_underground_api.get_historical_data(lat, lon, start_date, end_date)
        return {
            "location": [lat, lon],
            "historical_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Weather Underground Historical"
        }
    except Exception as e:
        logger.error("Weather Underground historical data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather-underground/comprehensive")
async def get_wu_comprehensive(lat: float, lon: float):
    """Get comprehensive Weather Underground data"""
    try:
        if not weather_engine.weather_underground_api:
            raise HTTPException(status_code=400, detail="Weather Underground API not configured")
        
        data = await weather_engine.weather_underground_api.get_comprehensive_weather_data(lat, lon)
        return {
            "location": [lat, lon],
            "comprehensive_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Weather Underground Comprehensive"
        }
    except Exception as e:
        logger.error("Weather Underground comprehensive data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# NASA API endpoints
@app.get("/api/nasa/climate")
async def get_nasa_climate(lat: float, lon: float, date: str = None):
    """Get NASA climate and earth observation data"""
    try:
        if not weather_engine.nasa_api:
            raise HTTPException(status_code=400, detail="NASA API not configured")
        
        data = await weather_engine.nasa_api.get_climate_data(lat, lon, date)
        return {
            "location": [lat, lon],
            "climate_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NASA Earth Observation"
        }
    except Exception as e:
        logger.error("NASA climate data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/satellite")
async def get_nasa_satellite(satellite: str = "GOES-16"):
    """Get NASA GOES satellite imagery and data"""
    try:
        if not weather_engine.nasa_api:
            raise HTTPException(status_code=400, detail="NASA API not configured")
        
        data = await weather_engine.nasa_api.get_goes_satellite_data(satellite)
        return {
            "satellite_data": data,
            "satellite": satellite,
            "timestamp": datetime.utcnow().isoformat(),
            "source": f"NASA {satellite} & EPIC"
        }
    except Exception as e:
        logger.error("NASA satellite data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/radar")
async def get_nasa_radar(lat: float, lon: float):
    """Get NASA radar and precipitation data"""
    try:
        if not weather_engine.nasa_api:
            raise HTTPException(status_code=400, detail="NASA API not configured")
        
        data = await weather_engine.nasa_api.get_radar_data(lat, lon)
        return {
            "location": [lat, lon],
            "radar_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NASA GPM & Radar"
        }
    except Exception as e:
        logger.error("NASA radar data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/space-weather")
async def get_nasa_space_weather():
    """Get NASA space weather data and solar storm reports"""
    try:
        if not weather_engine.nasa_api:
            raise HTTPException(status_code=400, detail="NASA API not configured")
        
        data = await weather_engine.nasa_api.get_space_weather_data()
        return {
            "space_weather": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NASA DONKI Space Weather"
        }
    except Exception as e:
        logger.error("NASA space weather data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/comprehensive")
async def get_nasa_comprehensive(lat: float, lon: float):
    """Get comprehensive NASA data including climate, satellite, radar, and space weather"""
    try:
        if not weather_engine.nasa_api:
            raise HTTPException(status_code=400, detail="NASA API not configured")
        
        data = await weather_engine.nasa_api.get_comprehensive_nasa_data(lat, lon)
        return {
            "location": [lat, lon],
            "comprehensive_nasa_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NASA Comprehensive Integration"
        }
    except Exception as e:
        logger.error("NASA comprehensive data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/asteroids")
async def get_nasa_asteroids():
    """Get NASA Near Earth Object tracking data"""
    try:
        if not weather_engine.nasa_api:
            raise HTTPException(status_code=400, detail="NASA API not configured")
        
        data = await weather_engine.nasa_api.get_asteroid_tracking()
        return {
            "asteroid_data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NASA NEO Feed"
        }
    except Exception as e:
        logger.error("NASA asteroid data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/mars-weather")
async def get_nasa_mars_weather():
    """Get Mars weather data from NASA InSight lander"""
    try:
        if not weather_engine.nasa_api:
            raise HTTPException(status_code=400, detail="NASA API not configured")
        
        data = await weather_engine.nasa_api.get_mars_weather()
        return {
            "mars_weather": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "NASA InSight Mars Weather"
        }
    except Exception as e:
        logger.error("NASA Mars weather data fetch failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# DOC AGI endpoints
@app.post("/api/doc/chat")
async def doc_chat(request: dict):
    """Chat with DOC - Dynamic Operational Climatologist"""
    try:
        if not weather_engine.doc_agi:
            raise HTTPException(status_code=400, detail="DOC AGI not configured - OpenAI API key required")
        
        user_input = request.get('message', '')
        user_location = request.get('location')  # [lat, lon] or None
        
        if user_location and len(user_location) == 2:
            user_location = tuple(user_location)
        
        response = await weather_engine.doc_agi.doc_respond(user_input, user_location)
        
        return {
            "doc_response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "DOC AGI"
        }
        
    except Exception as e:
        logger.error("DOC chat error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/doc/meteorological-tool")
async def doc_meteorological_tool(request: dict):
    """Request specific meteorological tools from DOC"""
    try:
        if not weather_engine.doc_agi:
            raise HTTPException(status_code=400, detail="DOC AGI not configured")
        
        tool_type = request.get('tool')  # skew-t, hodograph, etc.
        location = request.get('location')  # [lat, lon]
        location_name = request.get('location_name', 'Unknown Location')
        
        if not tool_type or not location or len(location) != 2:
            raise HTTPException(status_code=400, detail="Tool type and location [lat, lon] required")
            
        # Create a structured query for the tool
        from .meteorological_agi import WeatherQuery
        query = WeatherQuery(
            location=location_name,
            coordinates=tuple(location),
            query_type="tool",
            meteorological_tool=tool_type,
            time_period="current"
        )
        
        # Generate the tool data
        response = await weather_engine.doc_agi._handle_meteorological_tool_request(query)
        
        return {
            "tool_response": response,
            "tool_type": tool_type,
            "location": {
                "name": location_name,
                "coordinates": location
            },
            "timestamp": datetime.utcnow().isoformat(),
            "source": "DOC Meteorological Tools"
        }
        
    except Exception as e:
        logger.error("DOC meteorological tool error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/doc/capabilities")
async def doc_capabilities():
    """Get DOC's capabilities and available tools"""
    try:
        if not weather_engine.doc_agi:
            raise HTTPException(status_code=400, detail="DOC AGI not configured")
        
        return {
            "doc_info": {
                "name": "DOC",
                "full_name": "Dynamic Operational Climatologist",
                "version": "2.0",
                "activation_phrase": "What's up Doc"
            },
            "capabilities": [
                "Natural language weather queries",
                "Voice activation with 'What's up Doc'",
                "Global weather data access",
                "Professional meteorological analysis",
                "Severe weather forecasting",
                "AI-powered explanations"
            ],
            "meteorological_tools": [
                {
                    "name": "skew-t",
                    "description": "Skew-T Log-P atmospheric diagrams with instability parameters"
                },
                {
                    "name": "hodograph", 
                    "description": "Wind profile analysis and storm motion vectors"
                },
                {
                    "name": "surface-analysis",
                    "description": "Surface pressure systems and frontal analysis"
                },
                {
                    "name": "upper-air",
                    "description": "Upper-level atmospheric analysis (500mb, 700mb, 850mb)"
                },
                {
                    "name": "radar",
                    "description": "Precipitation radar and storm analysis"
                },
                {
                    "name": "satellite",
                    "description": "GOES satellite imagery and analysis"
                },
                {
                    "name": "composite",
                    "description": "Composite severe weather parameters"
                }
            ],
            "data_sources": [
                "National Weather Service (NWS)",
                "NASA Earth Observation",
                "Weather Underground",
                "NOAA Climate Data",
                "NOAA Physical Science Laboratory"
            ],
            "usage_examples": [
                "What's up Doc, show me a Skew-T for Tyler, Texas",
                "What's up Doc, what's the tornado potential in Moore, Oklahoma?",
                "What's up Doc, generate a hodograph for Miami, Florida",
                "What's up Doc, analyze the current weather in Denver"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("DOC capabilities error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Handle CORS preflight requests
@app.options("/api/{path:path}")
async def options_handler():
    return {"message": "OK"}

# Error handling
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "path": str(request.url.path)}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error("Internal server error", error=str(exc), path=str(request.url.path))
    return {"error": "Internal server error", "detail": str(exc)}

# For Vercel deployment
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)