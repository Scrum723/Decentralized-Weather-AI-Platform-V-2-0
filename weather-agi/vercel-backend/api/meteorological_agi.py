"""
Meteorological AGI Core - Advanced Weather Analysis with Natural Language Processing
Handles complex meteorological queries and generates professional weather analysis
"""
import json
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import logging
import asyncio
import httpx
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class WeatherQuery:
    """Structured representation of a weather query"""
    location: str
    coordinates: Optional[Tuple[float, float]] = None
    query_type: str = "general"  # general, forecast, analysis, tool, radar, satellite
    meteorological_tool: Optional[str] = None  # skew-t, hodograph, surface-analysis, etc.
    time_period: str = "current"  # current, hourly, daily, historical
    parameters: List[str] = None
    urgency: str = "normal"  # normal, urgent, severe

class DOCMeteorologicalAGI:
    """DOC - Dynamic Operational Climatologist
    Advanced AGI system for meteorological analysis with voice activation: 'What's up Doc'
    """
    
    def __init__(self, openai_api_key: str, weather_apis: Dict):
        self.openai_api_key = openai_api_key
        self.weather_apis = weather_apis
        self.name = "DOC"
        self.full_name = "Dynamic Operational Climatologist"
        self.activation_phrases = [
            "what's up doc",
            "whats up doc", 
            "hey doc",
            "doc",
            "what's up, doc"
        ]
        self.doc_personality = {
            'style': 'professional but friendly meteorologist',
            'expertise': 'severe weather analysis and forecasting',
            'catchphrases': [
                "Let me analyze the atmospheric conditions for you...",
                "The meteorological data indicates...",
                "Based on current observations...",
                "From a severe weather perspective..."
            ]
        }
        self.meteorological_tools = {
            'skew-t': self._generate_skew_t_data,
            'hodograph': self._generate_hodograph_data, 
            'surface-analysis': self._generate_surface_analysis,
            'upper-air': self._generate_upper_air_analysis,
            'radar': self._generate_radar_analysis,
            'satellite': self._generate_satellite_analysis,
            'sounding': self._generate_sounding_data,
            'composite': self._generate_composite_analysis
        }
        
    def is_doc_activated(self, user_input: str) -> bool:
        """Check if DOC is being activated with trigger phrases"""
        user_input_lower = user_input.lower().strip()
        
        # Remove punctuation and normalize
        import re
        normalized_input = re.sub(r'[^\w\s]', '', user_input_lower)
        
        # Check for activation phrases
        for phrase in self.activation_phrases:
            if phrase in normalized_input:
                return True
                
        return False
        
    def extract_query_after_activation(self, user_input: str) -> str:
        """Extract the actual query after DOC activation phrase"""
        user_input_lower = user_input.lower()
        
        # Find the activation phrase and extract everything after it
        for phrase in self.activation_phrases:
            if phrase in user_input_lower:
                # Find the position after the activation phrase
                phrase_end = user_input_lower.find(phrase) + len(phrase)
                remaining_query = user_input[phrase_end:].strip()
                
                # Remove common connectors
                remaining_query = re.sub(r'^[,.\s]+', '', remaining_query)
                
                return remaining_query
                
        return user_input.strip()
        
    async def doc_respond(self, user_input: str, user_location: Tuple[float, float] = None) -> Dict[str, Any]:
        """Main DOC response method - handles activation and queries"""
        try:
            # Check if DOC is being activated
            if not self.is_doc_activated(user_input):
                return {
                    'activated': False,
                    'response': None,
                    'suggestion': f"Try saying 'What's up Doc' to activate your meteorological assistant!"
                }
                
            # Extract the actual query
            query = self.extract_query_after_activation(user_input)
            
            if not query:
                # DOC was activated but no specific query
                return await self._doc_greeting_response(user_location)
            
            # Process the meteorological query
            response = await self.process_natural_language_query(query, user_location)
            
            # Add DOC branding to response
            response['activated'] = True
            response['doc_info'] = {
                'name': self.name,
                'full_name': self.full_name,
                'version': '2.0'
            }
            
            return response
            
        except Exception as e:
            logger.error(f"DOC response error: {e}")
            return {
                'activated': True,
                'error': str(e),
                'response': "I'm experiencing some technical difficulties analyzing the atmospheric conditions. Please try your query again.",
                'doc_info': {
                    'name': self.name,
                    'full_name': self.full_name,
                    'status': 'error'
                }
            }
            
    async def _doc_greeting_response(self, user_location: Tuple[float, float] = None) -> Dict[str, Any]:
        """DOC's greeting response when activated without specific query"""
        import random
        
        greetings = [
            "Hey there! I'm DOC, your Dynamic Operational Climatologist. What weather conditions can I analyze for you today?",
            "What's up! DOC here, ready to dive into some meteorological analysis. What location interests you?",
            "Greetings! I'm DOC, and I'm here to help with all your severe weather forecasting needs. Where should we look?",
            "Hey! DOC at your service. I can generate Skew-T diagrams, hodographs, and analyze atmospheric conditions anywhere on Earth. What do you need?"
        ]
        
        greeting = random.choice(greetings)
        
        # Add local weather if user location is available
        if user_location:
            try:
                local_data = await self._fetch_comprehensive_weather_data(user_location[0], user_location[1])
                location_insight = await self._generate_location_insight(user_location, local_data)
                greeting += f"\n\n{location_insight}"
            except:
                pass
                
        return {
            'activated': True,
            'response': greeting,
            'doc_info': {
                'name': self.name,
                'full_name': self.full_name,
                'capabilities': [
                    'Skew-T Log-P diagrams',
                    'Hodograph analysis', 
                    'Surface weather analysis',
                    'Satellite imagery',
                    'Radar analysis',
                    'Severe weather forecasting',
                    'Global weather data access'
                ]
            },
            'suggestions': [
                "Show me a Skew-T for Dallas, Texas",
                "What's the tornado potential in Moore, Oklahoma?", 
                "Generate a hodograph for Miami, Florida",
                "Analyze the current weather in Denver, Colorado"
            ]
        }
        
    async def _generate_location_insight(self, location: Tuple[float, float], weather_data: Dict[str, Any]) -> str:
        """Generate a quick insight about the user's current location weather"""
        try:
            # Simple analysis of current conditions
            insight = f"I'm detecting your location at {location[0]:.2f}°N, {location[1]:.2f}°W. "
            
            if weather_data:
                # Add basic current conditions
                insight += "Current atmospheric conditions look interesting for analysis!"
            else:
                insight += "Ready to analyze the atmospheric conditions in your area!"
                
            return insight
            
        except Exception as e:
            return "Ready to analyze atmospheric conditions at your location!"
        
    async def process_natural_language_query(self, user_query: str, user_location: Tuple[float, float] = None) -> Dict[str, Any]:
        """Process natural language meteorological queries"""
        try:
            # Parse the query using OpenAI
            parsed_query = await self._parse_meteorological_query(user_query, user_location)
            
            # Resolve location if needed
            if not parsed_query.coordinates and parsed_query.location:
                parsed_query.coordinates = await self._resolve_location(parsed_query.location)
            
            # Generate appropriate response based on query type
            if parsed_query.meteorological_tool:
                return await self._handle_meteorological_tool_request(parsed_query)
            else:
                return await self._handle_general_weather_query(parsed_query)
                
        except Exception as e:
            logger.error(f"AGI query processing error: {e}")
            return {
                'error': str(e),
                'response': "I apologize, but I encountered an error processing your meteorological query. Please try rephrasing your request.",
                'suggestions': [
                    "Try asking: 'Show me the current weather in Miami'",
                    "Or: 'Generate a Skew-T diagram for Dallas, Texas'",
                    "Or: 'What's the tornado potential in Moore, Oklahoma?'"
                ]
            }

    async def _parse_meteorological_query(self, query: str, user_location: Tuple[float, float] = None) -> WeatherQuery:
        """Use OpenAI to parse complex meteorological queries"""
        
        system_prompt = """You are DOC (Dynamic Operational Climatologist), a professional meteorologist assistant. Parse weather queries and extract:
        1. Location (city, coordinates, or "current location")
        2. Query type (general, forecast, analysis, tool, radar, satellite)  
        3. Meteorological tool requested (skew-t, hodograph, surface-analysis, upper-air, radar, satellite, sounding, composite)
        4. Time period (current, hourly, daily, historical)
        5. Specific parameters (temperature, pressure, wind, precipitation, etc.)
        6. Urgency level (normal, urgent, severe)
        
        Return JSON format with these fields. Be specific about meteorological tools."""
        
        user_prompt = f"Parse this weather query: '{query}'"
        if user_location:
            user_prompt += f" (User's current location: {user_location[0]:.4f}, {user_location[1]:.4f})"
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 500
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content']
                    
                    # Try to extract JSON from the response
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        parsed_data = json.loads(json_match.group())
                        
                        return WeatherQuery(
                            location=parsed_data.get('location', ''),
                            query_type=parsed_data.get('query_type', 'general'),
                            meteorological_tool=parsed_data.get('meteorological_tool'),
                            time_period=parsed_data.get('time_period', 'current'),
                            parameters=parsed_data.get('parameters', []),
                            urgency=parsed_data.get('urgency', 'normal')
                        )
                        
                # Fallback parsing using regex if OpenAI fails
                return self._fallback_query_parsing(query, user_location)
                
        except Exception as e:
            logger.warning(f"OpenAI parsing failed: {e}, using fallback")
            return self._fallback_query_parsing(query, user_location)

    def _fallback_query_parsing(self, query: str, user_location: Tuple[float, float] = None) -> WeatherQuery:
        """Fallback query parsing using regex patterns"""
        query_lower = query.lower()
        
        # Extract meteorological tools
        tool_patterns = {
            'skew-t': r'skew.*t|sounding|atmospheric profile|instability',
            'hodograph': r'hodograph|wind profile|shear vector',
            'surface-analysis': r'surface analysis|surface map|pressure system',
            'upper-air': r'upper.*air|500.*mb|700.*mb|850.*mb',
            'radar': r'radar|reflectivity|precipitation|storm',
            'satellite': r'satellite|goes|infrared|visible|water vapor'
        }
        
        meteorological_tool = None
        for tool, pattern in tool_patterns.items():
            if re.search(pattern, query_lower):
                meteorological_tool = tool
                break
                
        # Extract location
        location = ""
        location_patterns = [
            r'in ([^,]+(?:,\s*[A-Z]{2})?)',  # "in Dallas, TX"
            r'at ([^,]+(?:,\s*[A-Z]{2})?)',  # "at Miami, FL"  
            r'for ([^,]+(?:,\s*[A-Z]{2})?)', # "for Tyler, Texas"
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                location = match.group(1).strip()
                break
                
        if not location and "current location" in query_lower:
            location = "current"
            
        # Determine query type
        query_type = "general"
        if meteorological_tool:
            query_type = "tool"
        elif any(word in query_lower for word in ['forecast', 'prediction', 'future']):
            query_type = "forecast"  
        elif any(word in query_lower for word in ['analysis', 'analyze', 'assessment']):
            query_type = "analysis"
            
        return WeatherQuery(
            location=location,
            coordinates=user_location if location == "current" else None,
            query_type=query_type,
            meteorological_tool=meteorological_tool,
            time_period="current",
            parameters=[],
            urgency="normal"
        )

    async def _resolve_location(self, location_string: str) -> Optional[Tuple[float, float]]:
        """Resolve location string to coordinates using geocoding"""
        try:
            # Use a free geocoding service (OpenStreetMap Nominatim)
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={
                        'q': location_string,
                        'format': 'json',
                        'limit': 1
                    },
                    headers={'User-Agent': 'WeatherAGI/2.0'},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    results = response.json()
                    if results:
                        return (float(results[0]['lat']), float(results[0]['lon']))
                        
        except Exception as e:
            logger.error(f"Location resolution error: {e}")
            
        return None

    async def _handle_meteorological_tool_request(self, query: WeatherQuery) -> Dict[str, Any]:
        """Handle requests for specific meteorological tools"""
        if not query.coordinates:
            return {
                'error': 'Location required',
                'response': f"I need a specific location to generate a {query.meteorological_tool} diagram. Could you provide coordinates or a city name?",
                'tool': query.meteorological_tool
            }
            
        try:
            # Get the tool-specific data
            tool_function = self.meteorological_tools.get(query.meteorological_tool)
            if tool_function:
                tool_data = await tool_function(query.coordinates[0], query.coordinates[1])
                
                # Generate AI explanation
                explanation = await self._generate_tool_explanation(query, tool_data)
                
                return {
                    'response': explanation,
                    'tool_type': query.meteorological_tool,
                    'tool_data': tool_data,
                    'location': {
                        'name': query.location,
                        'coordinates': query.coordinates
                    },
                    'timestamp': datetime.now().isoformat(),
                    'source': 'Meteorological AGI'
                }
            else:
                return {
                    'error': 'Tool not supported',
                    'response': f"The {query.meteorological_tool} tool is not yet implemented. Available tools: {list(self.meteorological_tools.keys())}",
                    'available_tools': list(self.meteorological_tools.keys())
                }
                
        except Exception as e:
            logger.error(f"Tool request error: {e}")
            return {
                'error': str(e),
                'response': f"I encountered an error generating the {query.meteorological_tool} diagram. The weather data service may be temporarily unavailable."
            }

    async def _handle_general_weather_query(self, query: WeatherQuery) -> Dict[str, Any]:
        """Handle general weather questions"""
        if not query.coordinates:
            return {
                'error': 'Location required',
                'response': "I need a specific location to provide weather information. Could you specify a city or coordinates?"
            }
            
        try:
            # Fetch comprehensive weather data
            weather_data = await self._fetch_comprehensive_weather_data(
                query.coordinates[0], query.coordinates[1]
            )
            
            # Generate AI response
            ai_response = await self._generate_weather_explanation(query, weather_data)
            
            return {
                'response': ai_response,
                'weather_data': weather_data,
                'location': {
                    'name': query.location,
                    'coordinates': query.coordinates
                },
                'timestamp': datetime.now().isoformat(),
                'source': 'Meteorological AGI'
            }
            
        except Exception as e:
            logger.error(f"General weather query error: {e}")
            return {
                'error': str(e),
                'response': "I'm having trouble accessing current weather data. Please try again in a moment."
            }

    async def _generate_skew_t_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate Skew-T Log-P diagram data"""
        try:
            # This would fetch actual atmospheric sounding data
            # For now, we'll simulate realistic atmospheric profile data
            
            # Pressure levels (mb)
            pressure_levels = [1000, 975, 950, 925, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100]
            
            # Simulate realistic temperature and dewpoint profiles
            import math
            surface_temp = 25.0  # °C (would be fetched from current conditions)
            surface_dewpoint = 18.0  # °C
            
            temperatures = []
            dewpoints = []
            heights = []
            wind_speeds = []
            wind_directions = []
            
            for i, pressure in enumerate(pressure_levels):
                # Standard atmosphere approximation with realistic lapse rates
                height = 44307.694 * (1 - (pressure/1013.25)**0.190284)  # geometric height
                
                # Temperature decreases with height (standard lapse rate ~6.5°C/km)
                temp = surface_temp - (height * 0.0065)
                
                # Dewpoint decreases faster initially, then more gradually
                dewpoint = surface_dewpoint - (height * 0.002) - (i * 0.5)
                
                # Wind typically increases with height
                wind_speed = 5 + (height * 0.01)  # m/s
                wind_direction = 220 + (i * 3)  # degrees, veering with height
                
                temperatures.append(round(temp, 1))
                dewpoints.append(round(dewpoint, 1))
                heights.append(round(height, 0))
                wind_speeds.append(round(wind_speed, 1))
                wind_directions.append(int(wind_direction % 360))
            
            # Calculate instability parameters
            cape = 2847  # J/kg (would be calculated from real sounding)
            cin = -45    # J/kg
            lcl_pressure = 920  # mb
            lcl_height = 1200   # m
            lfc_pressure = 880  # mb
            lfc_height = 1850   # m
            el_pressure = 245   # mb
            el_height = 11200   # m
            
            return {
                'sounding_data': {
                    'pressure': pressure_levels,
                    'temperature': temperatures,
                    'dewpoint': dewpoints,
                    'height': heights,
                    'wind_speed': wind_speeds,
                    'wind_direction': wind_directions
                },
                'instability_parameters': {
                    'surface_cape': cape,
                    'surface_cin': cin,
                    'lcl_pressure': lcl_pressure,
                    'lcl_height': lcl_height,
                    'lfc_pressure': lfc_pressure,
                    'lfc_height': lfc_height,
                    'el_pressure': el_pressure,
                    'el_height': el_height,
                    'lifted_index': -6.2,
                    'showalter_index': -4.8,
                    'total_totals': 52
                },
                'wind_data': {
                    'surface_wind': {'speed': wind_speeds[0], 'direction': wind_directions[0]},
                    'wind_shear_0_1km': 12.5,
                    'wind_shear_0_3km': 18.7,
                    'wind_shear_0_6km': 25.3,
                    'storm_relative_helicity': 186
                },
                'chart_config': {
                    'title': f'Skew-T Log-P Diagram - {lat:.2f}°N, {lon:.2f}°W',
                    'x_axis': 'Temperature (°C)',
                    'y_axis': 'Pressure (mb)',
                    'isotherms': list(range(-60, 51, 10)),
                    'isobars': pressure_levels,
                    'dry_adiabats': list(range(-30, 51, 10)),
                    'moist_adiabats': list(range(-20, 41, 5))
                }
            }
            
        except Exception as e:
            logger.error(f"Skew-T generation error: {e}")
            return {'error': str(e)}

    async def _generate_hodograph_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate hodograph wind profile data"""
        try:
            # Heights in meters
            heights = [0, 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000]
            
            # Simulate realistic wind profile with typical backing/veering
            surface_wind_dir = 180  # South winds at surface
            surface_wind_spd = 8    # m/s
            
            wind_u = []  # East-west component
            wind_v = []  # North-south component
            wind_speeds = []
            wind_directions = []
            
            for i, height in enumerate(heights):
                # Winds typically veer and increase with height
                direction = (surface_wind_dir + (height * 0.03)) % 360  # Veering
                speed = surface_wind_spd + (height * 0.002)  # Increasing speed
                
                # Convert to u,v components
                u_component = speed * math.sin(math.radians(direction))
                v_component = speed * math.cos(math.radians(direction))
                
                wind_u.append(round(u_component, 1))
                wind_v.append(round(v_component, 1))
                wind_speeds.append(round(speed, 1))
                wind_directions.append(int(direction))
            
            # Calculate shear and helicity
            bulk_shear_0_6km = math.sqrt((wind_u[12] - wind_u[0])**2 + (wind_v[12] - wind_v[0])**2)
            storm_relative_helicity = 186  # m²/s²
            
            return {
                'wind_profile': {
                    'heights': heights,
                    'wind_u': wind_u,
                    'wind_v': wind_v,
                    'wind_speed': wind_speeds,
                    'wind_direction': wind_directions
                },
                'shear_parameters': {
                    'bulk_shear_0_1km': 8.5,
                    'bulk_shear_0_3km': 15.2,
                    'bulk_shear_0_6km': round(bulk_shear_0_6km, 1),
                    'storm_relative_helicity_0_1km': 85,
                    'storm_relative_helicity_0_3km': storm_relative_helicity
                },
                'storm_motion': {
                    'bunkers_right': {'u': 15.2, 'v': 8.7},
                    'bunkers_left': {'u': -2.1, 'v': 18.4},
                    'mean_wind': {'u': 6.6, 'v': 13.5}
                },
                'chart_config': {
                    'title': f'Hodograph - {lat:.2f}°N, {lon:.2f}°W',
                    'x_axis': 'U Component (m/s)',
                    'y_axis': 'V Component (m/s)',
                    'max_range': 40,
                    'grid_interval': 10
                }
            }
            
        except Exception as e:
            logger.error(f"Hodograph generation error: {e}")
            return {'error': str(e)}

    async def _generate_surface_analysis(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate surface analysis data"""
        return {
            'pressure_systems': {
                'high_pressure': [{'lat': 35.0, 'lon': -95.0, 'pressure': 1028.5}],
                'low_pressure': [{'lat': 42.0, 'lon': -88.0, 'pressure': 998.2}]
            },
            'fronts': [
                {'type': 'cold', 'coordinates': [[40.0, -100.0], [38.0, -95.0], [36.0, -90.0]]},
                {'type': 'warm', 'coordinates': [[32.0, -98.0], [34.0, -92.0], [36.0, -87.0]]}
            ]
        }

    async def _generate_upper_air_analysis(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate upper air analysis data"""
        return {
            'geopotential_height_500mb': 5760,  # meters
            'temperature_500mb': -18.5,  # °C
            'vorticity_500mb': 15,  # x10^-5 s^-1
            'divergence_200mb': -8   # x10^-5 s^-1
        }

    async def _generate_radar_analysis(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate radar analysis data"""
        if self.weather_apis.get('nasa_api'):
            return await self.weather_apis['nasa_api'].get_radar_data(lat, lon)
        
        return {
            'base_reflectivity': 35.5,  # dBZ
            'storm_tops': 12000,  # meters
            'vil': 25.8  # kg/m²
        }

    async def _generate_satellite_analysis(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate satellite analysis data"""  
        if self.weather_apis.get('nasa_api'):
            return await self.weather_apis['nasa_api'].get_goes_satellite_data("GOES-16")
            
        return {
            'infrared_temp': -65.2,  # °C (cloud top temperature)
            'visible_albedo': 0.85,
            'water_vapor': 'dry'
        }

    async def _generate_sounding_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate atmospheric sounding data (same as Skew-T but formatted differently)"""
        return await self._generate_skew_t_data(lat, lon)

    async def _generate_composite_analysis(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate composite severe weather parameters"""
        return {
            'supercell_composite': 8.7,
            'significant_tornado': 3.2,
            'energy_helicity_index': 4.8,
            'wind_index': 2.1,
            'hail_parameter': 1.8
        }

    async def _fetch_comprehensive_weather_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch comprehensive weather data from all available APIs"""
        weather_data = {}
        
        try:
            # Fetch from all available weather APIs
            tasks = []
            
            if self.weather_apis.get('nws_api'):
                tasks.append(('nws', self.weather_apis['nws_api'].get_active_alerts(lat, lon)))
                
            if self.weather_apis.get('nasa_api'):
                tasks.append(('nasa', self.weather_apis['nasa_api'].get_comprehensive_nasa_data(lat, lon)))
                
            if self.weather_apis.get('weather_underground_api'):
                tasks.append(('wu', self.weather_apis['weather_underground_api'].get_comprehensive_weather_data(lat, lon)))
                
            # Execute all requests concurrently
            if tasks:
                task_names, api_tasks = zip(*tasks)
                results = await asyncio.gather(*api_tasks, return_exceptions=True)
                
                for name, result in zip(task_names, results):
                    if not isinstance(result, Exception):
                        weather_data[name] = result
                        
        except Exception as e:
            logger.error(f"Comprehensive weather data fetch error: {e}")
            
        return weather_data

    async def _generate_tool_explanation(self, query: WeatherQuery, tool_data: Dict[str, Any]) -> str:
        """Generate AI explanation for meteorological tool data"""
        try:
            prompt = f"""You are DOC (Dynamic Operational Climatologist). Analyze this {query.meteorological_tool} data for {query.location} and provide a comprehensive but concise explanation in DOC's professional yet friendly style:

Tool: {query.meteorological_tool}
Data: {json.dumps(tool_data, indent=2)[:1500]}  # Truncate for token limits

Provide:
1. Key findings from the data
2. Meteorological significance 
3. Any severe weather implications
4. Professional interpretation

Keep response under 200 words, technical but accessible."""

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 300
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result['choices'][0]['message']['content']
                    
        except Exception as e:
            logger.error(f"Tool explanation generation error: {e}")
            
        # Fallback explanation
        return f"Generated {query.meteorological_tool} analysis for {query.location}. The data shows current atmospheric conditions and meteorological parameters for professional weather analysis."

    async def _generate_weather_explanation(self, query: WeatherQuery, weather_data: Dict[str, Any]) -> str:
        """Generate AI explanation for general weather data"""
        try:
            data_summary = str(weather_data)[:1000]  # Truncate for token limits
            
            prompt = f"""You are DOC (Dynamic Operational Climatologist). Provide a comprehensive weather analysis for {query.location} in DOC's signature professional yet approachable style:

Weather Data Summary: {data_summary}

Provide:
1. Current conditions overview
2. Notable weather features
3. Short-term outlook
4. Any hazards or advisories

Keep response conversational but meteorologically accurate, under 150 words."""

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4", 
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 250
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result['choices'][0]['message']['content']
                    
        except Exception as e:
            logger.error(f"Weather explanation generation error: {e}")
            
        return f"Current weather conditions for {query.location} have been analyzed. The meteorological data indicates typical atmospheric patterns for this region and time period."