"""
OpenAI Integration for Weather AGI System
Enhanced AI analysis and natural language weather interpretation
"""
import os
import openai
import json
from typing import Dict, Any, List
import asyncio
import httpx
from datetime import datetime

class WeatherAGIWithOpenAI:
    """Enhanced Weather AGI with OpenAI integration"""
    
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
        self.openai_key = openai_api_key
    
    async def enhance_weather_analysis(self, raw_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Use OpenAI to enhance weather analysis with intelligent insights"""
        
        try:
            # Create context for OpenAI
            context = self._create_analysis_context(raw_analysis)
            
            # Get AI-enhanced analysis
            enhanced_summary = await self._get_ai_weather_summary(context)
            risk_assessment = await self._get_ai_risk_assessment(context)
            recommendations = await self._get_ai_recommendations(context)
            
            # Add OpenAI enhancements to existing analysis
            raw_analysis.update({
                'ai_enhanced_summary': enhanced_summary,
                'ai_risk_assessment': risk_assessment,
                'ai_recommendations': recommendations,
                'ai_confidence': await self._calculate_ai_confidence(context),
                'ai_powered': True
            })
            
            return raw_analysis
            
        except Exception as e:
            print(f"OpenAI enhancement failed: {e}")
            # Return original analysis if AI fails
            raw_analysis['ai_powered'] = False
            return raw_analysis
    
    def _create_analysis_context(self, analysis: Dict[str, Any]) -> str:
        """Create context string for OpenAI analysis"""
        params = analysis['parameters']
        ml_forecast = analysis['ml_forecast']
        location = analysis['location']
        
        return f"""
METEOROLOGICAL ANALYSIS DATA:
Location: {location[0]:.4f}°N, {abs(location[1]):.4f}°W
Analysis Time: {analysis['timestamp']}

THERMODYNAMIC PARAMETERS:
- Surface CAPE: {params['surface_cape']:.0f} J/kg
- Surface CIN: {params['surface_cin']:.0f} J/kg
- LCL Height: {params['lcl_height']:.0f} m AGL
- LFC Height: {params['lfc_height']:.0f} m AGL
- EL Height: {params['el_height']:.0f} m AGL

KINEMATIC PARAMETERS:
- 0-6km Wind Shear: {params['wind_shear_0_6km']:.1f} m/s
- 0-3km Storm Relative Helicity: {params['storm_relative_helicity_0_3km']:.0f} m²/s²
- Supercell Composite Parameter: {params['supercell_composite']:.1f}
- Significant Tornado Parameter: {params['significant_tornado']:.1f}

ML FORECAST PROBABILITIES:
- Tornado Probability: {ml_forecast['tornado_probability']:.1%}
- Severe Thunderstorm Probability: {ml_forecast['severe_thunderstorm_probability']:.1%}
- Large Hail Probability: {ml_forecast['hail_probability']:.1%}
- Flash Flood Probability: {ml_forecast['flash_flood_probability']:.1%}
- Forecast Confidence: {ml_forecast['forecast_confidence']:.1%}
"""
    
    async def _get_ai_weather_summary(self, context: str) -> str:
        """Get AI-generated weather summary"""
        
        prompt = f"""As a professional meteorologist with expertise in severe weather analysis, provide a concise but comprehensive weather analysis summary based on this data:

{context}

Focus on:
1. Current atmospheric setup and stability
2. Key severe weather threats and their likelihood
3. Storm mode expectations (supercells, squall lines, etc.)
4. Timing and evolution of the weather situation

Keep the analysis professional, accurate, and actionable for forecasters and emergency managers. Use meteorological terminology appropriately."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert meteorologist specializing in severe weather analysis and forecasting."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.1
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"AI analysis unavailable: {str(e)}"
    
    async def _get_ai_risk_assessment(self, context: str) -> Dict[str, Any]:
        """Get AI-powered risk assessment"""
        
        prompt = f"""Based on this meteorological analysis, provide a structured risk assessment:

{context}

Return a JSON object with risk levels (LOW/MODERATE/HIGH/EXTREME) and confidence scores (0-100) for:
- tornado_risk
- hail_risk  
- wind_risk
- flood_risk
- overall_severe_risk

Also include a brief explanation for each risk level."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a severe weather risk assessment expert. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.1
            )
            
            # Parse JSON response
            risk_data = json.loads(response.choices[0].message.content.strip())
            return risk_data
            
        except Exception as e:
            return {
                "tornado_risk": {"level": "UNKNOWN", "confidence": 0, "explanation": f"AI assessment failed: {e}"},
                "hail_risk": {"level": "UNKNOWN", "confidence": 0, "explanation": "AI assessment failed"},
                "wind_risk": {"level": "UNKNOWN", "confidence": 0, "explanation": "AI assessment failed"},
                "flood_risk": {"level": "UNKNOWN", "confidence": 0, "explanation": "AI assessment failed"},
                "overall_severe_risk": {"level": "UNKNOWN", "confidence": 0, "explanation": "AI assessment failed"}
            }
    
    async def _get_ai_recommendations(self, context: str) -> List[str]:
        """Get AI-powered recommendations"""
        
        prompt = f"""Based on this weather analysis, provide actionable recommendations for:
1. Emergency managers and public safety officials
2. Storm chasers and spotters  
3. General public safety

{context}

Provide 5-7 specific, actionable recommendations as a JSON array of strings."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a public safety meteorologist. Provide actionable weather safety recommendations as JSON array."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.2
            )
            
            recommendations = json.loads(response.choices[0].message.content.strip())
            return recommendations if isinstance(recommendations, list) else []
            
        except Exception as e:
            return [
                f"AI recommendations unavailable: {str(e)}",
                "Monitor weather conditions closely",
                "Have multiple ways to receive weather warnings",
                "Know your safe place for severe weather"
            ]
    
    async def _calculate_ai_confidence(self, context: str) -> float:
        """Calculate AI confidence in the analysis"""
        
        prompt = f"""Based on the meteorological data quality and completeness, rate your confidence in this weather analysis on a scale of 0-100:

{context}

Consider:
- Data completeness and quality
- Parameter consistency
- Forecast model agreement
- Atmospheric pattern clarity

Respond with only a number between 0-100."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are evaluating meteorological analysis confidence. Respond with only a number 0-100."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=10,
                temperature=0.1
            )
            
            confidence = float(response.choices[0].message.content.strip())
            return max(0, min(100, confidence)) / 100.0
            
        except Exception as e:
            return 0.75  # Default confidence
    
    async def generate_weather_narrative(self, analysis: Dict[str, Any]) -> str:
        """Generate a natural language weather narrative"""
        
        context = self._create_analysis_context(analysis)
        
        prompt = f"""Write a compelling, easy-to-understand weather story for the general public based on this professional analysis:

{context}

Make it:
- Conversational but informative
- Focused on what people need to know
- Clear about timing and impacts
- Appropriate for social media/weather apps
- 2-3 paragraphs maximum

Avoid excessive technical jargon while maintaining accuracy."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a broadcast meteorologist explaining weather to the public in an engaging, accessible way."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"Weather narrative generation failed: {str(e)}"

# Test function for the OpenAI integration
async def test_openai_integration(api_key: str):
    """Test OpenAI integration with sample weather data"""
    
    # Sample analysis data
    sample_analysis = {
        'location': [35.2271, -97.4890],  # Moore, OK
        'timestamp': datetime.utcnow().isoformat(),
        'parameters': {
            'surface_cape': 3500.0,
            'surface_cin': 75.0,
            'lcl_height': 1200.0,
            'lfc_height': 2100.0,
            'el_height': 12000.0,
            'wind_shear_0_6km': 22.8,
            'storm_relative_helicity_0_3km': 280.0,
            'supercell_composite': 4.2,
            'significant_tornado': 2.8
        },
        'ml_forecast': {
            'tornado_probability': 0.72,
            'severe_thunderstorm_probability': 0.89,
            'hail_probability': 0.68,
            'flash_flood_probability': 0.35,
            'forecast_confidence': 0.87
        }
    }
    
    # Test the integration
    ai_weather = WeatherAGIWithOpenAI(api_key)
    enhanced_analysis = await ai_weather.enhance_weather_analysis(sample_analysis)
    
    return enhanced_analysis

if __name__ == "__main__":
    # Test with OPENROUTER_API_KEY from the environment
    OPENAI_KEY = os.getenv("OPENROUTER_API_KEY")

    async def main():
        if not OPENAI_KEY:
            print("OPENROUTER_API_KEY is not set; skipping test.")
            return
        result = await test_openai_integration(OPENAI_KEY)
        print("OpenAI Enhanced Weather Analysis:")
        print(json.dumps(result, indent=2, default=str))
    
    # Run the test
    asyncio.run(main())