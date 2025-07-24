use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentalData {
    pub location: String,
    pub co2_level: f64,
    pub temperature: f64,
    pub humidity: f64,
    pub timestamp: u64,
}

impl EnvironmentalData {
    pub fn new(location: String, co2_level: f64, temperature: f64, humidity: f64) -> Self {
        EnvironmentalData {
            location,
            co2_level,
            temperature,
            humidity,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }
}

impl std::fmt::Display for EnvironmentalData {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Location: {}, CO2 Level: {} ppm, Temperature: {} °C, Humidity: {}%",
            self.location, self.co2_level, self.temperature, self.humidity
        )
    }
}
