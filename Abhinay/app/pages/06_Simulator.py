import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import streamlit as st
from utils.ui_components import get_global_styles, render_navbar, render_page_header, render_footer

st.set_page_config(page_title="Policy Simulation", layout="wide", page_icon="🧪")
st.markdown(get_global_styles(), unsafe_allow_html=True)
render_navbar()

render_page_header(
    title="City Simulation Hub (Twin)",
    subtitle="Simulate urban policies and infrastructure changes in a risk-free digital twin environment."
)

st.markdown('<div class="um-page-content">', unsafe_allow_html=True)

with st.expander("Configure Simulation Parameters", expanded=True):
    st.slider("Traffic Load %", 0, 200, 100)
    st.slider("Power Availability", 0, 100, 95)
    st.multiselect("Active Policy Overlays", ["Zero Emission Zone", "Grid Priority Lane", "Variable Water Pricing"])
    st.button("🚀 Run Digital Twin Simulation")

st.markdown('</div>', unsafe_allow_html=True)
render_footer()

