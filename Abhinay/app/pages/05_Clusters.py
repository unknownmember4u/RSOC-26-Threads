import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import streamlit as st
from utils.ui_components import get_global_styles, render_navbar, render_page_header, render_footer

st.set_page_config(page_title="Urban Pattern Discovery", layout="wide", page_icon="🧬")
st.markdown(get_global_styles(), unsafe_allow_html=True)
render_navbar()

render_page_header(
    title="Urban Pattern Discovery & Clusters",
    subtitle="Identifying behavioral trends and resource consumption patterns across the city morphology."
)

st.markdown('<div class="um-page-content">', unsafe_allow_html=True)
st.markdown("### 🧬 Unsupervised Analytics")
st.info("Clustering algorithm identified 3 high-intensity energy consumption zones in South District.")
# Placeholder for clustering visual
st.markdown("""
<div style="height:400px; background:#f0f0f0; border-radius:12px; display:flex; align-items:center; justify-content:center;">
  <span style="color:#666;">[ Cluster Distribution Visualization — Loading... ]</span>
</div>
""", unsafe_allow_html=True)
st.markdown('</div>', unsafe_allow_html=True)
render_footer()

