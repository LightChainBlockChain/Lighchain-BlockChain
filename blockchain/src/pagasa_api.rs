use serde::{Deserialize, Serialize};
use reqwest;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FloodData {
    pub location: String,
    pub water_level: f64,
    pub alert_status: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherData {
    pub location: String,
    pub temperature: f64,
    pub humidity: f64,
    pub pressure: f64,
    pub wind_speed: f64,
    pub wind_direction: String,
    pub weather_condition: String,
    pub visibility: f64,
    pub uv_index: u8,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherForecast {
    pub location: String,
    pub forecast_date: String,
    pub min_temp: f64,
    pub max_temp: f64,
    pub humidity: f64,
    pub precipitation_chance: u8,
    pub precipitation_amount: f64,
    pub wind_speed: f64,
    pub weather_condition: String,
    pub weather_description: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherAlert {
    pub location: String,
    pub alert_type: String, // "typhoon", "heavy_rain", "strong_wind", "heat_index"
    pub severity: u8, // 1=Yellow, 2=Orange, 3=Red
    pub title: String,
    pub description: String,
    pub start_time: u64,
    pub end_time: u64,
    pub affected_areas: Vec<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarthquakeData {
    pub event_id: String,
    pub magnitude: f64,
    pub depth: f64, // kilometers
    pub location: String,
    pub coordinates: EarthquakeCoordinates,
    pub timestamp: u64,
    pub felt_intensity: Option<u8>, // PEIS scale (1-10)
    pub tsunami_advisory: bool,
    pub source: String, // "PHIVOLCS"
    pub event_type: String, // "tectonic", "volcanic", "explosion"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarthquakeCoordinates {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarthquakeAlert {
    pub alert_id: String,
    pub earthquake_data: EarthquakeData,
    pub alert_level: u8, // 1=Info, 2=Advisory, 3=Watch, 4=Warning
    pub intensity_areas: Vec<IntensityArea>,
    pub tsunami_threat: TsunamiThreat,
    pub affected_regions: Vec<String>,
    pub advisory_message: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntensityArea {
    pub area: String,
    pub intensity: u8, // PEIS scale
    pub description: String, // "Scarcely perceptible", "Slightly felt", etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TsunamiThreat {
    pub threat_level: u8, // 0=None, 1=Minor, 2=Moderate, 3=Major
    pub coastal_areas: Vec<String>,
    pub estimated_arrival: Option<u64>,
    pub wave_height: Option<f64>, // meters
}

// JMA (Japan Meteorological Agency) Data Structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMAWeatherData {
    pub location: String,
    pub prefecture: String,
    pub temperature: f64,
    pub humidity: f64,
    pub pressure: f64, // hPa
    pub wind_speed: f64, // m/s
    pub wind_direction: String,
    pub weather_condition: String,
    pub visibility: f64, // km
    pub precipitation: f64, // mm/h
    pub snow_depth: Option<f64>, // cm
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMAForecast {
    pub location: String,
    pub prefecture: String,
    pub forecast_date: String,
    pub min_temp: f64,
    pub max_temp: f64,
    pub weather_condition: String,
    pub precipitation_probability: u8, // %
    pub precipitation_amount: f64, // mm
    pub wind_speed: f64, // m/s
    pub wind_direction: String,
    pub humidity: f64,
    pub weather_code: u8, // JMA weather code
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMAWeatherAlert {
    pub alert_id: String,
    pub location: String,
    pub prefecture: String,
    pub alert_type: String, // "heavy_rain", "heavy_snow", "strong_wind", "typhoon", "heat_wave"
    pub warning_level: u8, // 1=Advisory, 2=Warning, 3=Emergency Warning
    pub title: String,
    pub description: String,
    pub issued_time: u64,
    pub valid_until: u64,
    pub affected_regions: Vec<String>,
    pub meteorological_info: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMAEarthquakeData {
    pub event_id: String,
    pub magnitude: f64,
    pub depth: f64, // km
    pub epicenter: String,
    pub coordinates: EarthquakeCoordinates,
    pub origin_time: u64,
    pub jma_intensity: Option<u8>, // JMA seismic intensity scale (1-7)
    pub tsunami_warning: bool,
    pub region: String, // Japanese region
    pub event_type: String, // "earthquake", "aftershock"
    pub felt_areas: Vec<JMAIntensityReport>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMAIntensityReport {
    pub area: String,
    pub prefecture: String,
    pub intensity: u8, // JMA scale 1-7
    pub intensity_description: String, // "Weak", "Strong", "Severe", etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMATsunamiInfo {
    pub warning_level: u8, // 0=None, 1=Advisory, 2=Warning, 3=Major Warning
    pub affected_coasts: Vec<String>,
    pub estimated_arrival: Option<u64>,
    pub expected_height: Option<f64>, // meters
    pub observation_points: Vec<JMATsunamiObservation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMATsunamiObservation {
    pub location: String,
    pub observed_height: f64, // meters
    pub observation_time: u64,
    pub status: String, // "rising", "falling", "stable"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JMAVolcanicAlert {
    pub volcano_name: String,
    pub alert_level: u8, // 1=Normal, 2=Don't approach crater, 3=Don't approach volcano, 4=Prepare evacuation, 5=Evacuate
    pub alert_type: String,
    pub description: String,
    pub affected_areas: Vec<String>,
    pub issued_time: u64,
    pub valid_until: Option<u64>,
    pub timestamp: u64,
}

pub struct PagasaAPI;

impl PagasaAPI {
    pub async fn fetch_flood_data() -> Result<FloodData, reqwest::Error> {
        // Simulated PAGASA API call
        let simulated_data = FloodData {
            location: "Metro Manila".to_string(),
            water_level: 5.5,
            alert_status: "Yellow Warning".to_string(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        Ok(simulated_data)
    }
    
    pub async fn fetch_current_weather(location: &str) -> Result<WeatherData, reqwest::Error> {
        // Simulated PAGASA weather API call
        let simulated_weather = WeatherData {
            location: location.to_string(),
            temperature: 28.5,
            humidity: 75.0,
            pressure: 1013.2,
            wind_speed: 12.5,
            wind_direction: "Northeast".to_string(),
            weather_condition: "Partly Cloudy".to_string(),
            visibility: 10.0,
            uv_index: 7,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        Ok(simulated_weather)
    }
    
    pub async fn fetch_weather_forecast(location: &str, days: u8) -> Result<Vec<WeatherForecast>, reqwest::Error> {
        // Simulated PAGASA forecast API call
        let mut forecasts = Vec::new();
        
        for i in 0..days {
            let forecast = WeatherForecast {
                location: location.to_string(),
                forecast_date: format!("2024-01-{:02}", 15 + i),
                min_temp: 24.0 + (i as f64 * 0.5),
                max_temp: 32.0 + (i as f64 * 0.8),
                humidity: 70.0 + (i as f64 * 2.0),
                precipitation_chance: 30 + (i * 10),
                precipitation_amount: 2.5 + (i as f64 * 1.2),
                wind_speed: 10.0 + (i as f64 * 1.5),
                weather_condition: match i {
                    0 => "Sunny".to_string(),
                    1 => "Partly Cloudy".to_string(),
                    2 => "Cloudy".to_string(),
                    3 => "Light Rain".to_string(),
                    _ => "Scattered Showers".to_string(),
                },
                weather_description: match i {
                    0 => "Clear skies with light winds".to_string(),
                    1 => "Partly cloudy with occasional sunshine".to_string(),
                    2 => "Overcast with moderate humidity".to_string(),
                    3 => "Light rain showers expected".to_string(),
                    _ => "Intermittent rain throughout the day".to_string(),
                },
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };
            forecasts.push(forecast);
        }
        
        Ok(forecasts)
    }
    
    pub async fn fetch_weather_alerts(location: &str) -> Result<Vec<WeatherAlert>, reqwest::Error> {
        // Simulated PAGASA weather alerts API call
        let alerts = vec![
            WeatherAlert {
                location: location.to_string(),
                alert_type: "heavy_rain".to_string(),
                severity: 2, // Orange
                title: "Heavy Rainfall Warning".to_string(),
                description: "Heavy to intense rains expected due to southwest monsoon enhanced by tropical depression".to_string(),
                start_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                end_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() + (24 * 3600), // 24 hours from now
                affected_areas: vec![
                    "Metro Manila".to_string(),
                    "Rizal".to_string(),
                    "Laguna".to_string(),
                    "Cavite".to_string(),
                ],
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            },
        ];
        Ok(alerts)
    }
    
    // JMA (Japan Meteorological Agency) API Methods
    pub async fn fetch_jma_weather_data(location: &str) -> Result<JMAWeatherData, reqwest::Error> {
        // Simulated JMA weather API call
        let simulated_data = JMAWeatherData {
            location: location.to_string(),
            prefecture: "Tokyo".to_string(), // Default for simulation
            temperature: 22.3,
            humidity: 68.0,
            pressure: 1016.8,
            wind_speed: 8.2, // m/s
            wind_direction: "Northwest".to_string(),
            weather_condition: "Cloudy".to_string(),
            visibility: 15.0,
            precipitation: 0.0,
            snow_depth: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        Ok(simulated_data)
    }
    
    pub async fn fetch_jma_forecast(location: &str, days: u8) -> Result<Vec<JMAForecast>, reqwest::Error> {
        // Simulated JMA forecast API call
        let mut forecasts = Vec::new();
        
        for i in 0..days {
            let forecast = JMAForecast {
                location: location.to_string(),
                prefecture: "Tokyo".to_string(),
                forecast_date: format!("2024-01-{:02}", 15 + i),
                min_temp: 18.0 + (i as f64 * 0.8),
                max_temp: 25.0 + (i as f64 * 1.2),
                weather_condition: match i {
                    0 => "Sunny".to_string(),
                    1 => "Partly Cloudy".to_string(),
                    2 => "Cloudy".to_string(),
                    3 => "Light Snow".to_string(),
                    _ => "Overcast".to_string(),
                },
                precipitation_probability: 20 + (i * 15),
                precipitation_amount: 1.5 + (i as f64 * 2.0),
                wind_speed: 6.0 + (i as f64 * 1.8),
                wind_direction: "North".to_string(),
                humidity: 65.0 + (i as f64 * 3.0),
                weather_code: 100 + i, // JMA weather codes
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };
            forecasts.push(forecast);
        }
        
        Ok(forecasts)
    }
    
    pub async fn fetch_jma_weather_alerts(location: &str) -> Result<Vec<JMAWeatherAlert>, reqwest::Error> {
        // Simulated JMA weather alerts API call
        let alerts = vec![
            JMAWeatherAlert {
                alert_id: "JMA-2024-001".to_string(),
                location: location.to_string(),
                prefecture: "Tokyo".to_string(),
                alert_type: "heavy_snow".to_string(),
                warning_level: 2, // Warning
                title: "Heavy Snow Warning".to_string(),
                description: "Heavy snowfall expected due to low-pressure system. Accumulation of 20-30cm possible.".to_string(),
                issued_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                valid_until: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() + (12 * 3600), // 12 hours
                affected_regions: vec![
                    "Tokyo Metropolitan Area".to_string(),
                    "Kanagawa Prefecture".to_string(),
                    "Saitama Prefecture".to_string(),
                ],
                meteorological_info: "Low pressure system moving from west. Snow to continue for next 8-10 hours.".to_string(),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            },
        ];
        Ok(alerts)
    }
    
    pub async fn fetch_jma_earthquake_data() -> Result<Vec<JMAEarthquakeData>, reqwest::Error> {
        // Simulated JMA earthquake data API call
        let earthquakes = vec![
            JMAEarthquakeData {
                event_id: "JMA-EQ-2024-001".to_string(),
                magnitude: 5.8,
                depth: 35.0,
                epicenter: "Off the coast of Fukushima Prefecture".to_string(),
                coordinates: EarthquakeCoordinates {
                    latitude: 37.4221,
                    longitude: 141.0353,
                },
                origin_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() - 3600, // 1 hour ago
                jma_intensity: Some(4), // JMA scale
                tsunami_warning: false,
                region: "Tohoku Region".to_string(),
                event_type: "earthquake".to_string(),
                felt_areas: vec![
                    JMAIntensityReport {
                        area: "Fukushima".to_string(),
                        prefecture: "Fukushima Prefecture".to_string(),
                        intensity: 4,
                        intensity_description: "Strong".to_string(),
                    },
                    JMAIntensityReport {
                        area: "Sendai".to_string(),
                        prefecture: "Miyagi Prefecture".to_string(),
                        intensity: 3,
                        intensity_description: "Weak".to_string(),
                    },
                ],
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            },
        ];
        Ok(earthquakes)
    }
    
    pub async fn fetch_jma_tsunami_info() -> Result<Option<JMATsunamiInfo>, reqwest::Error> {
        // Simulated JMA tsunami info - returning None for no current tsunami threat
        Ok(None)
    }
    
    pub async fn fetch_jma_volcanic_alerts() -> Result<Vec<JMAVolcanicAlert>, reqwest::Error> {
        // Simulated JMA volcanic alerts API call
        let alerts = vec![
            JMAVolcanicAlert {
                volcano_name: "Mount Fuji".to_string(),
                alert_level: 1, // Normal
                alert_type: "Normal".to_string(),
                description: "Volcanic activity remains at normal levels with no immediate threat.".to_string(),
                affected_areas: vec![],
                issued_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() - (7 * 24 * 3600), // 7 days ago
                valid_until: None, // Ongoing assessment
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            },
        ];
        Ok(alerts)
    }
}
