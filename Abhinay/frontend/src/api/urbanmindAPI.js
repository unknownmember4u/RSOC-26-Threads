const API_BASE = "http://localhost:8000"

export const api = {
  // Dashboard
  getOverview: (district) => {
    const query = district ? `?district_id=${encodeURIComponent(district)}` : '';
    return fetch(`${API_BASE}/api/dashboard/overview${query}`).then(r => r.json());
  },
  getTrafficData: (district, hours=24) =>
    fetch(`${API_BASE}/api/dashboard/traffic?district_id=${district}&hours=${hours}`).then(r => r.json()),
  getPollutionData: (district, hours=24) =>
    fetch(`${API_BASE}/api/dashboard/pollution?district_id=${district}&hours=${hours}`).then(r => r.json()),
  getEnergyData: (district, hours=24) =>
    fetch(`${API_BASE}/api/dashboard/energy?district_id=${district}&hours=${hours}`).then(r => r.json()),
  getTransportData: (district, hours=24) =>
    fetch(`${API_BASE}/api/dashboard/transport?district_id=${district}&hours=${hours}`).then(r => r.json()),
  getMapData: () =>
    fetch(`${API_BASE}/api/dashboard/map`).then(r => r.json()),
  getCorrelation: () =>
    fetch(`${API_BASE}/api/dashboard/correlation`).then(r => r.json()),
  getPeakHours: () =>
    fetch(`${API_BASE}/api/dashboard/peak_hours`).then(r => r.json()),

  // Predictions
  predictTraffic: (body) =>
    fetch(`${API_BASE}/api/ml/predict/traffic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json()),
  predictPollution: (body) =>
    fetch(`${API_BASE}/api/ml/predict/pollution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json()),
  predictTransport: (body) =>
    fetch(`${API_BASE}/api/ml/predict/transport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json()),

  // Alerts & Clusters
  getAlerts: () =>
    fetch(`${API_BASE}/api/ml/alerts`).then(r => r.json()),
  getClusters: () =>
    fetch(`${API_BASE}/api/ml/clusters`).then(r => r.json()),

  // Simulation
  simulate: (body) =>
    fetch(`${API_BASE}/api/ml/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json()),

  // Chat — Text
  chat: (message, history, backend="ollama") =>
    fetch(`${API_BASE}/api/ml/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, backend })
    }).then(r => r.json()),

  // Chat — Image (Mistral Vision)
  explainChart: async (imageBlob) => {
    const formData = new FormData()
    formData.append("image", imageBlob, "chart.png")
    return fetch(`${API_BASE}/api/ml/explain-chart`, {
      method: "POST",
      body: formData
    }).then(r => r.json())
  },

  // Live stream
  getLiveData: () =>
    fetch(`${API_BASE}/api/stream/latest`).then(r => r.json()),
}
