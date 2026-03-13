# UrbanMind — Output Directory

This directory contains the final processed datasets produced by the data pipeline.

## Files

| File | Description |
|---|---|
| `processed_data_raw.csv` | Master merged dataset with all 21 columns, 10 districts, hourly frequency |

## Schema

Every row contains:
`timestamp, district_id, lat, lng, pm25, pm10, aqi, weather_temp, weather_humidity, vehicle_count, avg_speed_kmh, incident_flag, consumption_kwh, peak_demand_kw, renewable_pct, route_id, passenger_count, capacity, delay_min, water_liters, waste_kg`

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
