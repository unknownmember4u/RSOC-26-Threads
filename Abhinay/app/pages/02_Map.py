import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import streamlit as st
import pandas as pd
import numpy as np
from utils.ui_components import get_global_styles, render_navbar, render_page_header, render_footer

# ─── Page Init ───
st.set_page_config(page_title="District Command Map", layout="wide", page_icon="🗺️")
st.markdown(get_global_styles(), unsafe_allow_html=True)
render_navbar()

# ─── Header ───
render_page_header(
    title="Geospatial Intelligence Map",
    subtitle="Interactive spatial analysis of urban metrics, infrastructure status, and fleet positions."
)

# ─── Sidebar ───
with st.sidebar:
    st.markdown("### Map Layers")
    st.checkbox("Traffic Flow", value=True)
    st.checkbox("Sensor Nodes", value=True)
    st.checkbox("Emergency Vehicles", value=True)
    st.checkbox("Energy Grid", value=False)
    st.button("🎯 Center on Command Hub", use_container_width=True)

# ─── Main Content ───
st.markdown('<div class="um-page-content">', unsafe_allow_html=True)

# Map Placeholder
st.info("🗺️ Map view is in active development. Integrating with Mapbox/Deck.gl layers.")
map_data = pd.DataFrame(
    np.random.randn(100, 2) / [50, 50] + [22.3, 114.1],
    columns=['lat', 'lon']
)
st.map(map_data)

st.markdown('</div>', unsafe_allow_html=True)
render_footer()

