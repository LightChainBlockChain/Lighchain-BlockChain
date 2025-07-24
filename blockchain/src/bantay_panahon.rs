use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::pagasa_api::PagasaData;
use crate::environment::EnvironmentalData;

/// PAGASA Bantay Panahon (Weather Watch) Integration Module
/// Provides weather monitoring, flood alerts, and climate data integration
/// for the Philippine weather monitoring system

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Region {
    // Administrative Regions
    NCR,        // National Capital Region
    CAR,        // Cordillera Administrative Region
    Region1,    // Ilocos Region
    Region2,    // Cagayan Valley
    Region3,    // Central Luzon
    Region4A,   // CALABARZON
    Region4B,   // MIMAROPA
    Region5,    // Bicol Region
    Region6,    // Western Visayas
    Region7,    // Central Visayas
    Region8,    // Eastern Visayas
    Region9,    // Zamboanga Peninsula
    Region10,   // Northern Mindanao
    Region11,   // Davao Region
    Region12,   // SOCCSKSARGEN
    Region13,   // Caraga
    BARMM,      // Bangsamoro Autonomous Region
    // Special Focus Areas
    Tarlac,     // Tarlac Province (Central Luzon)
    Unknown,    // For locations that cannot be classified
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherAlert {
    pub alert_id: String,
    pub alert_type: AlertType,
    pub location: String,
    pub region: Region,
    pub severity: AlertSeverity,
    pub description: String,
    pub timestamp: u64,
    pub expires_at: u64,
    pub affected_areas: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    TyphoonWarning,
    FloodAlert,
    DroughtWarning,
    TemperatureExtreme,
    SeaSurgeWarning,
    LandslideAlert,
    WeatherAdvisory,
    // PhilVolcs Alerts
    EarthquakeAlert,
    TsunamiWarning,
    VolcanicEruption,
    VolcanicUnrest,
    SeismicActivity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Low,
    Moderate,
    High,
    Critical,
    Extreme,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherStation {
    pub station_id: String,
    pub name: String,
    pub location: String,
    pub region: Region,
    pub coordinates: (f64, f64), // (latitude, longitude)
    pub elevation: f32,
    pub station_type: StationType,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StationType {
    Synoptic,
    Climatological,
    RainGauge,
    UpperAir,
    Automatic,
    Hydrological,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FloodMonitoringData {
    pub location: String,
    pub region: Region,
    pub water_level: f32, // meters
    pub normal_level: f32,
    pub warning_level: f32,
    pub critical_level: f32,
    pub flow_rate: f32, // cubic meters per second
    pub timestamp: u64,
    pub risk_assessment: FloodRisk,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FloodRisk {
    Normal,
    Watch,
    Warning,
    Critical,
    Emergency,
}

// PhilVolcs Earthquake Data Structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarthquakeData {
    pub earthquake_id: String,
    pub magnitude: f32,
    pub depth: f32, // kilometers
    pub location: String,
    pub region: Region,
    pub coordinates: (f64, f64), // (latitude, longitude)
    pub timestamp: u64,
    pub intensity: EarthquakeIntensity,
    pub source: String, // e.g., "PhilVolcs"
    pub affected_areas: Vec<String>,
    pub tsunami_potential: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EarthquakeIntensity {
    Intensity1,  // Scarcely perceptible
    Intensity2,  // Slightly felt
    Intensity3,  // Weak
    Intensity4,  // Moderately strong
    Intensity5,  // Strong
    Intensity6,  // Very strong
    Intensity7,  // Destructive
    Intensity8,  // Very destructive
    Intensity9,  // Devastating
    Intensity10, // Completely devastating
}

// PhilVolcs Volcanic Monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolcanicData {
    pub volcano_id: String,
    pub volcano_name: String,
    pub alert_level: VolcanicAlertLevel,
    pub location: String,
    pub region: Region,
    pub coordinates: (f64, f64),
    pub elevation: f32,
    pub last_eruption: Option<u64>,
    pub current_activity: Vec<VolcanicActivity>,
    pub timestamp: u64,
    pub monitoring_station: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VolcanicAlertLevel {
    Alert0, // Normal
    Alert1, // Low level unrest
    Alert2, // Moderate level unrest
    Alert3, // High level unrest
    Alert4, // Hazardous eruption imminent
    Alert5, // Hazardous eruption in progress
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VolcanicActivity {
    VolcanicEarthquakes,
    SteamEmission,
    AshEmission,
    LavaFlow,
    PyroclasticFlow,
    Lahar,
    GroundDeformation,
    GasEmission,
}

// Seismic Station
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeismicStation {
    pub station_id: String,
    pub name: String,
    pub location: String,
    pub region: Region,
    pub coordinates: (f64, f64),
    pub station_type: SeismicStationType,
    pub is_active: bool,
    pub monitoring_range: f32, // kilometers
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SeismicStationType {
    Broadband,
    ShortPeriod,
    StrongMotion,
    Accelerometer,
    Tiltmeter,
    StrainMeter,
}

// ===== JMA (Japan Meteorological Agency) Integration =====

/// JMA Weather Data Structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JmaWeatherData {
    pub station_id: String,
    pub station_name: String,
    pub location: String,
    pub region: JmaRegion,
    pub coordinates: (f64, f64),
    pub temperature: f32,
    pub humidity: f32,
    pub pressure: f32, // hPa
    pub wind_speed: f32, // m/s
    pub wind_direction: u16, // degrees
    pub precipitation: f32, // mm
    pub visibility: f32, // km
    pub timestamp: u64,
    pub weather_condition: JmaWeatherCondition,
}

/// JMA Regional Classifications
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum JmaRegion {
    // Main Islands
    Hokkaido,
    Tohoku,
    Kanto,
    Chubu,
    Kansai,
    Chugoku,
    Shikoku,
    Kyushu,
    Okinawa,
    // Marine Areas
    PacificOcean,
    JapanSea,
    EastChinaSea,
    // International Cooperation Areas
    WestPacific,
    Unknown,
}

/// JMA Weather Conditions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JmaWeatherCondition {
    Clear,
    PartlyCloudy,
    Cloudy,
    Overcast,
    LightRain,
    Rain,
    HeavyRain,
    Snow,
    HeavySnow,
    Thunderstorm,
    Fog,
    Mist,
    Typhoon,
}

/// JMA Typhoon Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JmaTyphoonData {
    pub typhoon_id: String,
    pub typhoon_name: String,
    pub international_name: String,
    pub center_location: (f64, f64),
    pub central_pressure: f32, // hPa
    pub max_wind_speed: f32, // m/s
    pub movement_direction: u16, // degrees
    pub movement_speed: f32, // km/h
    pub radius_strong_winds: f32, // km
    pub radius_gale_winds: f32, // km
    pub forecast_path: Vec<JmaTyphoonForecast>,
    pub timestamp: u64,
    pub intensity_category: JmaTyphoonCategory,
}

/// JMA Typhoon Forecast Point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JmaTyphoonForecast {
    pub forecast_time: u64,
    pub location: (f64, f64),
    pub central_pressure: f32,
    pub max_wind_speed: f32,
    pub probability_circle_radius: f32, // km
}

/// JMA Typhoon Intensity Categories
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JmaTyphoonCategory {
    TropicalDepression,    // <17 m/s
    TropicalStorm,         // 17-24 m/s
    SevereTropicalStorm,   // 25-32 m/s
    TyphoonCategory1,      // 33-43 m/s
    TyphoonCategory2,      // 44-53 m/s
    TyphoonCategory3,      // 54-63 m/s
    TyphoonCategory4,      // ≥64 m/s
}

/// JMA Earthquake Data (for regional comparison)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JmaEarthquakeData {
    pub earthquake_id: String,
    pub magnitude: f32,
    pub depth: f32,
    pub location: String,
    pub region: JmaRegion,
    pub coordinates: (f64, f64),
    pub timestamp: u64,
    pub jma_intensity: JmaSeismicIntensity,
    pub tsunami_forecast: JmaTsunamiForecast,
}

/// JMA Seismic Intensity Scale
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JmaSeismicIntensity {
    Intensity0,    // Not felt
    Intensity1,    // Slight
    Intensity2,    // Weak
    Intensity3,    // Rather weak
    Intensity4,    // Light
    Intensity5Lower, // 5-
    Intensity5Upper, // 5+
    Intensity6Lower, // 6-
    Intensity6Upper, // 6+
    Intensity7,    // Severe
}

/// JMA Tsunami Forecast
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JmaTsunamiForecast {
    None,
    Watch,
    Advisory,
    Warning,
    MajorWarning,
}

pub struct BantayPanahonSystem {
    weather_stations: HashMap<String, WeatherStation>,
    active_alerts: HashMap<String, WeatherAlert>,
    flood_monitoring: HashMap<String, FloodMonitoringData>,
    weather_history: Vec<PagasaData>,
    // PhilVolcs Integration
    seismic_stations: HashMap<String, SeismicStation>,
    earthquake_data: Vec<EarthquakeData>,
    volcanic_data: HashMap<String, VolcanicData>,
    active_volcanoes: HashMap<String, String>, // volcano_id -> volcano_name
}

impl BantayPanahonSystem {
    pub fn new() -> Self {
        Self {
            weather_stations: HashMap::new(),
            active_alerts: HashMap::new(),
            flood_monitoring: HashMap::new(),
            weather_history: Vec::new(),
            seismic_stations: HashMap::new(),
            earthquake_data: Vec::new(),
            volcanic_data: HashMap::new(),
            active_volcanoes: HashMap::new(),
        }
    }

    /// Register a new weather station
    pub fn register_weather_station(&mut self, station: WeatherStation) {
        println!("🌦️  Registering weather station: {} at {}", station.name, station.location);
        self.weather_stations.insert(station.station_id.clone(), station);
    }

    /// Process incoming PAGASA weather data
    pub fn process_weather_data(&mut self, data: PagasaData) -> Result<String, String> {
        println!("📊 Processing weather data for {}", data.location);
        
        // Check for extreme conditions and generate alerts
        self.evaluate_weather_conditions(&data)?;
        
        // Store historical data
        self.weather_history.push(data.clone());
        
        // Limit history to last 1000 records
        if self.weather_history.len() > 1000 {
            self.weather_history.remove(0);
        }
        
        Ok(format!("Weather data processed for {}", data.location))
    }

    /// Evaluate weather conditions and generate alerts if needed
    fn evaluate_weather_conditions(&mut self, data: &PagasaData) -> Result<(), String> {
        // Temperature extreme check
        if data.temperature > 35.0 {
            self.create_weather_alert(
                AlertType::TemperatureExtreme,
                &data.location,
                AlertSeverity::High,
                format!("Extreme temperature: {:.1}°C", data.temperature),
            );
        }

        // High humidity with temperature (heat index)
        if data.humidity > 80.0 && data.temperature > 32.0 {
            self.create_weather_alert(
                AlertType::WeatherAdvisory,
                &data.location,
                AlertSeverity::Moderate,
                "High heat index conditions".to_string(),
            );
        }

        // Wind speed check (if available in future updates)
        // This would be expanded with actual PAGASA API integration

        Ok(())
    }

    /// Create a weather alert
    fn create_weather_alert(&mut self, alert_type: AlertType, location: &str, severity: AlertSeverity, description: String) {
        let alert_id = format!("alert_{}_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            rand::random::<u32>()
        );

        let alert = WeatherAlert {
            alert_id: alert_id.clone(),
            alert_type,
            location: location.to_string(),
            severity,
            description,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            expires_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + 86400, // 24 hours
            affected_areas: vec![location.to_string()],
        };

        println!("🚨 Weather Alert Created: {:?} for {}", alert.alert_type, location);
        self.active_alerts.insert(alert_id, alert);
    }

    /// Update flood monitoring data
    pub fn update_flood_monitoring(&mut self, location: String, data: FloodMonitoringData) {
        let risk = self.assess_flood_risk(&data);
        let mut updated_data = data;
        updated_data.risk_assessment = risk;

        if matches!(updated_data.risk_assessment, FloodRisk::Warning | FloodRisk::Critical | FloodRisk::Emergency) {
            self.create_flood_alert(&location, &updated_data);
        }

        println!("🌊 Flood monitoring updated for {}: {:?}", location, updated_data.risk_assessment);
        self.flood_monitoring.insert(location, updated_data);
    }

    /// Assess flood risk based on water levels
    fn assess_flood_risk(&self, data: &FloodMonitoringData) -> FloodRisk {
        if data.water_level >= data.critical_level {
            FloodRisk::Emergency
        } else if data.water_level >= data.warning_level {
            FloodRisk::Critical
        } else if data.water_level >= data.normal_level * 1.5 {
            FloodRisk::Warning
        } else if data.water_level >= data.normal_level * 1.2 {
            FloodRisk::Watch
        } else {
            FloodRisk::Normal
        }
    }

    /// Create flood alert
    fn create_flood_alert(&mut self, location: &str, flood_data: &FloodMonitoringData) {
        let severity = match flood_data.risk_assessment {
            FloodRisk::Emergency => AlertSeverity::Extreme,
            FloodRisk::Critical => AlertSeverity::Critical,
            FloodRisk::Warning => AlertSeverity::High,
            _ => AlertSeverity::Moderate,
        };

        self.create_weather_alert(
            AlertType::FloodAlert,
            location,
            severity,
            format!("Water level: {:.2}m (Warning: {:.2}m)", 
                flood_data.water_level, flood_data.warning_level),
        );
    }

    /// Get active alerts for a location
    pub fn get_active_alerts(&self, location: Option<&str>) -> Vec<&WeatherAlert> {
        self.active_alerts.values()
            .filter(|alert| {
                match location {
                    Some(loc) => alert.location == loc || alert.affected_areas.contains(&loc.to_string()),
                    None => true,
                }
            })
            .collect()
    }

    /// Get weather stations
    pub fn get_weather_stations(&self) -> &HashMap<String, WeatherStation> {
        &self.weather_stations
    }

    /// Get flood monitoring data
    pub fn get_flood_monitoring(&self, location: Option<&str>) -> Vec<&FloodMonitoringData> {
        match location {
            Some(loc) => {
                self.flood_monitoring.get(loc).into_iter().collect()
            },
            None => self.flood_monitoring.values().collect(),
        }
    }

    /// Clean up expired alerts
    pub fn cleanup_expired_alerts(&mut self) {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.active_alerts.retain(|_, alert| alert.expires_at > current_time);
    }

    /// Get weather statistics
    pub fn get_weather_statistics(&self) -> WeatherStatistics {
        if self.weather_history.is_empty() {
            return WeatherStatistics::default();
        }

        let total_records = self.weather_history.len() as f32;
        let avg_temp = self.weather_history.iter()
            .map(|d| d.temperature)
            .sum::<f32>() / total_records;
        
        let avg_humidity = self.weather_history.iter()
            .map(|d| d.humidity)
            .sum::<f32>() / total_records;

        let max_temp = self.weather_history.iter()
            .map(|d| d.temperature)
            .fold(f32::NEG_INFINITY, f32::max);

        let min_temp = self.weather_history.iter()
            .map(|d| d.temperature)
            .fold(f32::INFINITY, f32::min);

        WeatherStatistics {
            total_records: self.weather_history.len(),
            average_temperature: avg_temp,
            average_humidity: avg_humidity,
            max_temperature: max_temp,
            min_temperature: min_temp,
            active_alerts: self.active_alerts.len(),
            monitored_locations: self.weather_stations.len(),
        }
    }

    // ===== PhilVolcs Integration Functions =====

    /// Register a new seismic station
    pub fn register_seismic_station(&mut self, station: SeismicStation) {
        println!("🌋 Registering seismic station: {} at {}", station.name, station.location);
        self.seismic_stations.insert(station.station_id.clone(), station);
    }

    /// Process incoming earthquake data from PhilVolcs
    pub fn process_earthquake_data(&mut self, earthquake: EarthquakeData) -> Result<String, String> {
        println!("🏔️  Processing earthquake data: Magnitude {:.1} at {}", 
            earthquake.magnitude, earthquake.location);
        
        // Generate earthquake alert if magnitude is significant
        if earthquake.magnitude >= 4.0 {
            self.create_earthquake_alert(&earthquake);
        }

        // Check for tsunami potential
        if earthquake.tsunami_potential {
            self.create_tsunami_alert(&earthquake);
        }

        // Store earthquake data
        self.earthquake_data.push(earthquake.clone());
        
        // Limit earthquake history to last 500 records
        if self.earthquake_data.len() > 500 {
            self.earthquake_data.remove(0);
        }
        
        Ok(format!("Earthquake data processed: M{:.1} at {}", 
            earthquake.magnitude, earthquake.location))
    }

    /// Create earthquake alert
    fn create_earthquake_alert(&mut self, earthquake: &EarthquakeData) {
        let severity = match earthquake.magnitude {
            m if m >= 7.0 => AlertSeverity::Extreme,
            m if m >= 6.0 => AlertSeverity::Critical,
            m if m >= 5.0 => AlertSeverity::High,
            _ => AlertSeverity::Moderate,
        };

        let description = format!(
            "Magnitude {:.1} earthquake at depth {:.1}km. Intensity: {:?}",
            earthquake.magnitude, 
            earthquake.depth, 
            earthquake.intensity
        );

        self.create_philvolcs_alert(
            AlertType::EarthquakeAlert,
            &earthquake.location,
            severity,
            description,
            earthquake.affected_areas.clone(),
        );
    }

    /// Create tsunami alert
    fn create_tsunami_alert(&mut self, earthquake: &EarthquakeData) {
        let description = format!(
            "Tsunami warning due to M{:.1} earthquake. Coastal areas advised to evacuate.",
            earthquake.magnitude
        );

        self.create_philvolcs_alert(
            AlertType::TsunamiWarning,
            &earthquake.location,
            AlertSeverity::Extreme,
            description,
            earthquake.affected_areas.clone(),
        );
    }

    /// Process volcanic monitoring data
    pub fn process_volcanic_data(&mut self, volcanic_data: VolcanicData) -> Result<String, String> {
        println!("🌋 Processing volcanic data: {} - Alert Level {:?}", 
            volcanic_data.volcano_name, volcanic_data.alert_level);
        
        // Generate volcanic alerts based on alert level
        match volcanic_data.alert_level {
            VolcanicAlertLevel::Alert3 | VolcanicAlertLevel::Alert4 | VolcanicAlertLevel::Alert5 => {
                self.create_volcanic_alert(&volcanic_data);
            },
            _ => {}
        }

        // Update active volcanoes list
        self.active_volcanoes.insert(
            volcanic_data.volcano_id.clone(), 
            volcanic_data.volcano_name.clone()
        );

        // Store volcanic data
        self.volcanic_data.insert(volcanic_data.volcano_id.clone(), volcanic_data.clone());
        
        Ok(format!("Volcanic data processed: {} - Alert Level {:?}", 
            volcanic_data.volcano_name, volcanic_data.alert_level))
    }

    /// Create volcanic alert
    fn create_volcanic_alert(&mut self, volcanic_data: &VolcanicData) {
        let (alert_type, severity, description) = match volcanic_data.alert_level {
            VolcanicAlertLevel::Alert5 => (
                AlertType::VolcanicEruption,
                AlertSeverity::Extreme,
                format!("HAZARDOUS ERUPTION IN PROGRESS at {}. Immediate evacuation required.", 
                    volcanic_data.volcano_name)
            ),
            VolcanicAlertLevel::Alert4 => (
                AlertType::VolcanicEruption,
                AlertSeverity::Critical,
                format!("HAZARDOUS ERUPTION IMMINENT at {}. Prepare for evacuation.", 
                    volcanic_data.volcano_name)
            ),
            VolcanicAlertLevel::Alert3 => (
                AlertType::VolcanicUnrest,
                AlertSeverity::High,
                format!("HIGH LEVEL UNREST at {}. Increased volcanic activity detected.", 
                    volcanic_data.volcano_name)
            ),
            _ => return, // No alert needed for lower levels
        };

        self.create_philvolcs_alert(
            alert_type,
            &volcanic_data.location,
            severity,
            description,
            vec![volcanic_data.location.clone()],
        );
    }

    /// Create PhilVolcs alert (earthquakes, volcanoes, etc.)
    fn create_philvolcs_alert(
        &mut self, 
        alert_type: AlertType, 
        location: &str, 
        severity: AlertSeverity, 
        description: String,
        affected_areas: Vec<String>
    ) {
        let alert_id = format!("philvolcs_{}_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            rand::random::<u32>()
        );

        let alert = WeatherAlert {
            alert_id: alert_id.clone(),
            alert_type: alert_type.clone(),
            location: location.to_string(),
            severity,
            description,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            expires_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + 86400, // 24 hours
            affected_areas,
        };

        println!("🚨 PhilVolcs Alert Created: {:?} for {}", alert.alert_type, location);
        self.active_alerts.insert(alert_id, alert);
    }

    /// Get earthquake data within a specific time range
    pub fn get_earthquake_data(&self, magnitude_threshold: Option<f32>) -> Vec<&EarthquakeData> {
        self.earthquake_data.iter()
            .filter(|eq| {
                match magnitude_threshold {
                    Some(threshold) => eq.magnitude >= threshold,
                    None => true,
                }
            })
            .collect()
    }

    /// Get volcanic monitoring data
    pub fn get_volcanic_data(&self, volcano_id: Option<&str>) -> Vec<&VolcanicData> {
        match volcano_id {
            Some(id) => {
                self.volcanic_data.get(id).into_iter().collect()
            },
            None => self.volcanic_data.values().collect(),
        }
    }

    /// Get seismic stations
    pub fn get_seismic_stations(&self) -> &HashMap<String, SeismicStation> {
        &self.seismic_stations
    }

    /// Get active volcanoes list
    pub fn get_active_volcanoes(&self) -> &HashMap<String, String> {
        &self.active_volcanoes
    }

    /// Monitor seismic activity for a specific region
    pub fn monitor_seismic_activity(&self, location: &str, radius_km: f32) -> Vec<&EarthquakeData> {
        // This is a simplified implementation - in practice, you'd calculate
        // actual distance using geographic coordinates
        self.earthquake_data.iter()
            .filter(|eq| eq.location.contains(location))
            .collect()
    }

    // ===== JMA (Japan Meteorological Agency) Integration Functions =====

    /// Process JMA weather data and integrate with Philippine weather monitoring
    pub fn process_jma_weather_data(&mut self, jma_data: JmaWeatherData) -> Result<String, String> {
        println!("🌸 Processing JMA weather data from: {} ({})", 
            jma_data.station_name, jma_data.location);
        
        // Check for extreme weather conditions that might affect Philippine weather patterns
        self.evaluate_jma_weather_conditions(&jma_data)?;
        
        // Store JMA data for regional weather pattern analysis
        // In a full implementation, this would be stored in a separate HashMap
        
        Ok(format!("JMA weather data processed: {} at {:.1}°C", 
            jma_data.location, jma_data.temperature))
    }

    /// Evaluate JMA weather conditions for regional impact on Philippines
    fn evaluate_jma_weather_conditions(&mut self, jma_data: &JmaWeatherData) -> Result<(), String> {
        // Monitor typhoon conditions that might affect Philippine weather
        if matches!(jma_data.weather_condition, JmaWeatherCondition::Typhoon) {
            self.create_regional_weather_advisory(
                &format!("Typhoon activity detected in {} region of Japan", 
                    self.jma_region_to_string(&jma_data.region)),
                AlertSeverity::Moderate,
                "West Pacific".to_string(),
            );
        }

        // Monitor extreme weather patterns
        if jma_data.temperature > 38.0 || jma_data.temperature < -10.0 {
            self.create_regional_weather_advisory(
                &format!("Extreme temperature ({:.1}°C) recorded in {}", 
                    jma_data.temperature, jma_data.location),
                AlertSeverity::Low,
                "Regional Weather Pattern".to_string(),
            );
        }

        // Monitor severe weather conditions
        if jma_data.wind_speed > 25.0 { // Strong winds (> 90 km/h)
            self.create_regional_weather_advisory(
                &format!("Strong winds ({:.1} m/s) in {} may affect regional weather patterns", 
                    jma_data.wind_speed, jma_data.location),
                AlertSeverity::Low,
                "West Pacific Region".to_string(),
            );
        }

        Ok(())
    }

    /// Process JMA typhoon data for regional tracking
    pub fn process_jma_typhoon_data(&mut self, typhoon_data: JmaTyphoonData) -> Result<String, String> {
        println!("🌀 Processing JMA typhoon data: {} ({})", 
            typhoon_data.typhoon_name, typhoon_data.international_name);
        
        // Create typhoon advisory for Philippine monitoring
        let severity = match typhoon_data.intensity_category {
            JmaTyphoonCategory::TyphoonCategory4 => AlertSeverity::Critical,
            JmaTyphoonCategory::TyphoonCategory3 => AlertSeverity::High,
            JmaTyphoonCategory::TyphoonCategory2 => AlertSeverity::High,
            JmaTyphoonCategory::TyphoonCategory1 => AlertSeverity::Moderate,
            JmaTyphoonCategory::SevereTropicalStorm => AlertSeverity::Moderate,
            _ => AlertSeverity::Low,
        };

        let description = format!(
            "Typhoon {} ({}) - Category: {:?}, Central Pressure: {:.1} hPa, Max Winds: {:.1} m/s, Moving {} at {:.1} km/h",
            typhoon_data.typhoon_name,
            typhoon_data.international_name,
            typhoon_data.intensity_category,
            typhoon_data.central_pressure,
            typhoon_data.max_wind_speed,
            self.direction_to_string(typhoon_data.movement_direction),
            typhoon_data.movement_speed
        );

        self.create_regional_weather_advisory(
            &description,
            severity,
            "West Pacific Typhoon Tracking".to_string(),
        );

        Ok(format!("JMA typhoon data processed: {} ({})", 
            typhoon_data.typhoon_name, typhoon_data.international_name))
    }

    /// Process JMA earthquake data for regional seismic monitoring
    pub fn process_jma_earthquake_data(&mut self, jma_earthquake: JmaEarthquakeData) -> Result<String, String> {
        println!("🗾 Processing JMA earthquake data: M{:.1} at {}", 
            jma_earthquake.magnitude, jma_earthquake.location);
        
        // Monitor significant earthquakes that might affect regional seismic activity
        if jma_earthquake.magnitude >= 6.0 {
            let description = format!(
                "Significant earthquake in Japan: M{:.1} at depth {:.1}km in {}. JMA Intensity: {:?}. Tsunami forecast: {:?}",
                jma_earthquake.magnitude,
                jma_earthquake.depth,
                jma_earthquake.location,
                jma_earthquake.jma_intensity,
                jma_earthquake.tsunami_forecast
            );

            let severity = match jma_earthquake.magnitude {
                m if m >= 8.0 => AlertSeverity::Critical,
                m if m >= 7.0 => AlertSeverity::High,
                _ => AlertSeverity::Moderate,
            };

            self.create_regional_seismic_advisory(
                &description,
                severity,
                "Regional Seismic Monitoring".to_string(),
            );

            // Check for tsunami potential affecting Philippine coasts
            if matches!(jma_earthquake.tsunami_forecast, 
                JmaTsunamiForecast::Warning | JmaTsunamiForecast::MajorWarning) {
                self.create_regional_tsunami_advisory(&jma_earthquake);
            }
        }

        Ok(format!("JMA earthquake data processed: M{:.1} in {}", 
            jma_earthquake.magnitude, jma_earthquake.location))
    }

    /// Create regional weather advisory based on JMA data
    fn create_regional_weather_advisory(&mut self, description: &str, severity: AlertSeverity, location: String) {
        let alert_id = format!("jma_weather_{}_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            rand::random::<u32>()
        );

        let alert = WeatherAlert {
            alert_id: alert_id.clone(),
            alert_type: AlertType::WeatherAdvisory,
            location: location.clone(),
            region: Region::Unknown, // Regional advisory
            severity,
            description: format!("[JMA Regional Advisory] {}", description),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            expires_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + 86400, // 24 hours
            affected_areas: vec!["West Pacific Region".to_string()],
        };

        println!("🌏 JMA Regional Advisory Created: {} - {}", location, description);
        self.active_alerts.insert(alert_id, alert);
    }

    /// Create regional seismic advisory based on JMA earthquake data
    fn create_regional_seismic_advisory(&mut self, description: &str, severity: AlertSeverity, location: String) {
        let alert_id = format!("jma_seismic_{}_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            rand::random::<u32>()
        );

        let alert = WeatherAlert {
            alert_id: alert_id.clone(),
            alert_type: AlertType::SeismicActivity,
            location: location.clone(),
            region: Region::Unknown, // Regional advisory
            severity,
            description: format!("[JMA Seismic Advisory] {}", description),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            expires_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + 86400, // 24 hours
            affected_areas: vec!["West Pacific Region".to_string()],
        };

        println!("🌊 JMA Seismic Advisory Created: {} - {}", location, description);
        self.active_alerts.insert(alert_id, alert);
    }

    /// Create regional tsunami advisory based on JMA earthquake data
    fn create_regional_tsunami_advisory(&mut self, jma_earthquake: &JmaEarthquakeData) {
        let description = format!(
            "Tsunami generated by M{:.1} earthquake in {}. Potential impact on Philippine coasts under monitoring.",
            jma_earthquake.magnitude,
            jma_earthquake.location
        );

        let alert_id = format!("jma_tsunami_{}_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            rand::random::<u32>()
        );

        let alert = WeatherAlert {
            alert_id: alert_id.clone(),
            alert_type: AlertType::TsunamiWarning,
            location: "Pacific Coast of Philippines".to_string(),
            region: Region::Unknown, // Regional advisory
            severity: AlertSeverity::High,
            description: format!("[JMA Tsunami Advisory] {}", description),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            expires_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + 86400, // 24 hours
            affected_areas: vec![
                "Eastern Luzon".to_string(),
                "Eastern Visayas".to_string(),
                "Eastern Mindanao".to_string(),
            ],
        };

        println!("🌊 JMA Tsunami Advisory Created for Philippine coasts");
        self.active_alerts.insert(alert_id, alert);
    }

    /// Utility function to convert JMA region to string
    fn jma_region_to_string(&self, region: &JmaRegion) -> String {
        match region {
            JmaRegion::Hokkaido => "Hokkaido".to_string(),
            JmaRegion::Tohoku => "Tohoku".to_string(),
            JmaRegion::Kanto => "Kanto".to_string(),
            JmaRegion::Chubu => "Chubu".to_string(),
            JmaRegion::Kansai => "Kansai".to_string(),
            JmaRegion::Chugoku => "Chugoku".to_string(),
            JmaRegion::Shikoku => "Shikoku".to_string(),
            JmaRegion::Kyushu => "Kyushu".to_string(),
            JmaRegion::Okinawa => "Okinawa".to_string(),
            JmaRegion::PacificOcean => "Pacific Ocean".to_string(),
            JmaRegion::JapanSea => "Japan Sea".to_string(),
            JmaRegion::EastChinaSea => "East China Sea".to_string(),
            JmaRegion::WestPacific => "West Pacific".to_string(),
            JmaRegion::Unknown => "Unknown".to_string(),
        }
    }

    /// Utility function to convert direction degrees to string
    fn direction_to_string(&self, degrees: u16) -> String {
        match degrees {
            0..=22 | 338..=360 => "North".to_string(),
            23..=67 => "Northeast".to_string(),
            68..=112 => "East".to_string(),
            113..=157 => "Southeast".to_string(),
            158..=202 => "South".to_string(),
            203..=247 => "Southwest".to_string(),
            248..=292 => "West".to_string(),
            293..=337 => "Northwest".to_string(),
        }
    }
}

#[derive(Debug, Default)]
pub struct WeatherStatistics {
    pub total_records: usize,
    pub average_temperature: f32,
    pub average_humidity: f32,
    pub max_temperature: f32,
    pub min_temperature: f32,
    pub active_alerts: usize,
    pub monitored_locations: usize,
}

impl Default for BantayPanahonSystem {
    fn default() -> Self {
        let mut system = Self::new();
        
        // Initialize with major Philippine weather stations
        system.register_weather_station(WeatherStation {
            station_id: "PAGASA_NCR_001".to_string(),
            name: "PAGASA Science Garden".to_string(),
            location: "Quezon City, Metro Manila".to_string(),
            coordinates: (14.6507, 121.0432),
            elevation: 58.0,
            station_type: StationType::Synoptic,
            is_active: true,
        });

        system.register_weather_station(WeatherStation {
            station_id: "PAGASA_CEV_001".to_string(),
            name: "Mactan Station".to_string(),
            location: "Cebu".to_string(),
            coordinates: (10.3157, 123.8854),
            elevation: 8.0,
            station_type: StationType::Synoptic,
            is_active: true,
        });

        system.register_weather_station(WeatherStation {
            station_id: "PAGASA_DAV_001".to_string(),
            name: "Davao Station".to_string(),
            location: "Davao City".to_string(),
            coordinates: (7.1907, 125.4553),
            elevation: 28.0,
            station_type: StationType::Synoptic,
            is_active: true,
        });

        system
    }
}
