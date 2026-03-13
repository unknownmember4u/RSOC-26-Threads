# UrbanMind — Output Directory

This folder contains **`processed_data.csv`** — the cleaned, feature-engineered
dataset ready for ML training and dashboard consumption.

## Schema

| # | Column | Type | Description |
|---|--------|------|-------------|
| 1 | `timestamp` | datetime | Hourly timestamp (YYYY-MM-DD HH:MM:SS) |
| 2 | `district_id` | str | District code (D01–D10) |
| 3 | `pm25` | float | PM2.5 concentration (normalised) |
| 4 | `pm10` | float | PM10 concentration (normalised) |
| 5 | `aqi` | float | Air Quality Index (normalised) |
| 6 | `weather_temp` | float | Temperature °C (normalised) |
| 7 | `weather_humidity` | float | Humidity % (normalised) |
| 8 | `vehicle_count` | float | Vehicles per hour (normalised) |
| 9 | `avg_speed_kmh` | float | Average speed km/h (normalised) |
| 10 | `incident_flag` | float | Traffic incident (0/1, normalised) |
| 11 | `consumption_kwh` | float | Energy consumption kWh (normalised) |
| 12 | `peak_demand_kw` | float | Peak demand kW (normalised) |
| 13 | `renewable_pct` | float | Renewable energy % (normalised) |
| 14 | `route_id` | str | Bus route ID (R01–R05) |
| 15 | `passenger_count` | float | Bus passengers (normalised) |
| 16 | `capacity` | float | Bus capacity (normalised) |
| 17 | `delay_min` | float | Bus delay minutes (normalised) |
| 18 | `water_liters` | float | Water consumption litres/hr (normalised) |
| 19 | `waste_kg` | float | Waste generated kg/hr (normalised) |
| 20 | `lat` | float | District latitude (normalised) |
| 21 | `lng` | float | District longitude (normalised) |
| 22 | `hour_of_day` | int | Hour (0–23) |
| 23 | `day_of_week` | int | Day (0=Mon, 6=Sun) |
| 24 | `is_weekend` | bool | Saturday or Sunday |
| 25 | `is_peak_hour` | bool | Hour in {8, 9, 17, 18, 19} |
| 26 | `traffic_density` | float | vehicle_count / max per district |
| 27 | `pollution_index` | float | Weighted PM2.5+PM10+AQI (normalised 0–1) |
| 28 | `energy_usage_per_area` | float | kWh / district area km² |
| 29 | `transport_load` | float | passenger_count / capacity [0,1] |
| 30 | `rolling_aqi_3h` | float | 3-hour rolling mean AQI per district |
| 31 | `traffic_pollution_ratio` | float | traffic_density / (pollution_index + ε) |

## Districts (Pune, India)

| ID | Name | Lat | Lng |
|---|---|---|---|
| D01 | Shivajinagar | 18.5308 | 73.8474 |
| D02 | Kothrud | 18.5074 | 73.8077 |
| D03 | Hadapsar | 18.5018 | 73.9252 |
| D04 | Wakad | 18.5984 | 73.7611 |
| D05 | Pimpri | 18.6279 | 73.8009 |
| D06 | Baner | 18.5590 | 73.7868 |
| D07 | Magarpatta | 18.5089 | 73.9259 |
| D08 | Kharadi | 18.5497 | 73.9397 |
| D09 | Viman Nagar | 18.5679 | 73.9143 |
| D10 | Swargate | 18.5018 | 73.8636 |

## How to regenerate

```bash
cd Vaishnavi
python pipeline_runner.py               # full pipeline + Firestore upload
python pipeline_runner.py --skip-upload  # without Firestore
```
