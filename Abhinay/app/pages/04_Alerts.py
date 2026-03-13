import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import streamlit as st
from utils.ui_components import get_global_styles, render_navbar, render_page_header, render_footer

st.set_page_config(page_title="Smart Alerts Panel", layout="wide", page_icon="🔔")
st.markdown(get_global_styles(), unsafe_allow_html=True)
render_navbar()

render_page_header(
    title="Crisis & Operational Alerts",
    subtitle="Centralized management of critical incidents, emergency triggers, and administrative notifications."
)

st.markdown('<div class="um-page-content">', unsafe_allow_html=True)
tab1, tab2 = st.tabs(["Active Alerts", "Incident History"])

with tab1:
    st.error("🚨 Critical: Main Grid Power Surge — Sector D08")
    st.warning("⚠️ Warning: Air Quality Threshold Exceeded — Sector D03")
    st.info("ℹ️ Info: Deployment of Smart Waste Fleet — Sector D01")

with tab2:
    st.write("Yesterday - 11:45 PM: Resolved Water Main Leak (D05)")
    st.write("Yesterday - 08:32 PM: Resolved Grid Anomaly (D02)")

st.markdown('</div>', unsafe_allow_html=True)
render_footer()

