import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import streamlit as st
import pandas as pd
import numpy as np
from utils.ui_components import get_global_styles, render_navbar, render_page_header, render_footer
from firebase_client import FirebaseClient

# ─── Page Init ───
st.set_page_config(page_title="City Intelligence Dashboard", layout="wide", page_icon="📊")
st.markdown(get_global_styles(), unsafe_allow_html=True)
render_navbar()

# ─── Sidebar Config ───
with st.sidebar:
    st.markdown("### Control Panel")
    district = st.selectbox("Select District", [f"D{i:02d}" for i in range(1, 11)] + ["All"])
    time_range = st.select_slider("Time Range", options=["1H", "6H", "12H", "24H", "7D"])
    st.button("🔄 Refresh Live Stream", use_container_width=True)

# ─── Header ───
render_page_header(
    title=f"City Intelligence & District Metrics — {district}",
    subtitle="Real-time performance indicators and multi-sector urban health monitoring."
)

# ─── Main Content ───
st.markdown('<div class="um-page-content">', unsafe_allow_html=True)

# Mock KPI Logic (would normally use FirebaseClient)
kpis = st.columns(4)
with kpis[0]:
    st.metric("Traffic Density", "68%", "2%")
with kpis[1]:
    st.metric("AQI (Average)", "42", "-5")
with kpis[2]:
    st.metric("Energy Demand", "4.2 MW", "0.8")
with kpis[3]:
    st.metric("Waste Fill Level", "72%", "4%")

st.markdown('<div style="height: 32px;"></div>', unsafe_allow_html=True)

# Main Grid
col1, col2 = st.columns([2, 1])

with col1:
    st.markdown("### District Activity Heatmap")
    # Placeholder for a map or large chart
    chart_data = pd.DataFrame(np.random.randn(20, 3), columns=['Traffic', 'AQI', 'Energy'])
    st.area_chart(chart_data)

with col2:
    st.markdown("### Security & Critical Alerts")
    st.warning("⚠️ High Traffic Congestion on Main St. (D04)")
    st.error("🚨 Sensor Failure: Water Pressure Station 09")
    st.info("ℹ️ Maintenance Scheduled: Grid Sector B (12:00 PM)")

st.markdown('</div>', unsafe_allow_html=True)

# ─── Footer ───
render_footer()

