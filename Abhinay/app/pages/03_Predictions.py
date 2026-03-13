import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import streamlit as st
import pandas as pd
from utils.ui_components import get_global_styles, render_navbar, render_page_header, render_footer

st.set_page_config(page_title="Predictive Intelligence", layout="wide", page_icon="📈")
st.markdown(get_global_styles(), unsafe_allow_html=True)
render_navbar()

render_page_header(
    title="Neural Synthesis & Urban Forecasts",
    subtitle="Advanced AI modeling for traffic flow, energy consumption, and environmental risk."
)

st.markdown('<div class="um-page-content">', unsafe_allow_html=True)
st.write("### 🕰️ Future Projections")
cols = st.columns(3)
with cols[0]:
    st.image("https://via.placeholder.com/400x250?text=Traffic+Forecast", caption="24H Traffic Prediction")
with cols[1]:
    st.image("https://via.placeholder.com/400x250?text=Energy+Demand", caption="Grid Load Forecast")
with cols[2]:
    st.image("https://via.placeholder.com/400x250?text=AQI+Trends", caption="Emission Dispersion Model")

st.markdown('</div>', unsafe_allow_html=True)
render_footer()

