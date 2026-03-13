import streamlit as st
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.ui_components import (
    get_global_styles, render_navbar, render_hero, 
    render_stats_bar, render_capabilities, render_footer
)

# ─── Page Init ───
st.set_page_config(
    page_title="UrbanMind — Municipal Intelligence",
    layout="wide",
    page_icon="🏛️",
    initial_sidebar_state="collapsed"
)

# ─── Apply Global Styles ───
st.markdown(get_global_styles(), unsafe_allow_html=True)

# ─── Navbar ───
render_navbar()

# ─── Hero Section ───
hero_svg = """
<svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%">
  <defs>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" stroke-width="0.5"/>
    </pattern>
    <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FEF3C7"/>
      <stop offset="100%" stop-color="#F9F9F7"/>
    </linearGradient>
  </defs>
  <rect width="480" height="360" fill="url(#cityGrad)" rx="12"/>
  <rect width="480" height="360" fill="url(#grid)"/>
  <rect x="30" y="200" width="40" height="130" rx="3" fill="#E5E7EB"/>
  <rect x="78" y="140" width="50" height="190" rx="3" fill="#D1D5DB"/>
  <rect x="136" y="170" width="44" height="160" rx="3" fill="#E5E7EB"/>
  <rect x="188" y="110" width="60" height="220" rx="3" fill="#C8C8C8"/>
  <line x1="218" y1="60" x2="218" y2="112" stroke="#9CA3AF" stroke-width="1.5"/>
  <rect x="218" y="60" width="20" height="12" rx="2" fill="#B5121B"/>
  <rect x="258" y="160" width="44" height="170" rx="3" fill="#E5E7EB"/>
  <rect x="310" y="185" width="50" height="145" rx="3" fill="#D1D5DB"/>
  <rect x="368" y="210" width="44" height="120" rx="3" fill="#E5E7EB"/>
  <rect x="0" y="326" width="480" height="34" fill="#9CA3AF"/>
  <rect x="22" y="28" width="110" height="58" rx="10" fill="white" stroke="#E5E7EB" stroke-width="1"/>
  <text x="77" y="60" font-family="Inter,sans-serif" font-size="12" fill="#111827" font-weight="800" text-anchor="middle">AQI 48</text>
  <rect x="162" y="14" width="126" height="58" rx="10" fill="white" stroke="#E5E7EB" stroke-width="1"/>
  <text x="225" y="47" font-family="Inter,sans-serif" font-size="12" fill="#111827" font-weight="800" text-anchor="middle">3.2 MW</text>
  <rect x="352" y="20" width="116" height="58" rx="10" fill="white" stroke="#E5E7EB" stroke-width="1"/>
  <text x="410" y="53" font-family="Inter,sans-serif" font-size="12" fill="#111827" font-weight="800" text-anchor="middle">74% TRF</text>
</svg>
"""

render_hero(
    title_html='Precision Intelligence for <span>Municipal Governance</span>',
    desc='A high-performance monitoring and predictive analytics framework for real-time urban oversight, rapid emergency response, and data-driven policy planning.',
    badge_text='',
    cta_text='Access Command Center',
    cta_link='/Dashboard',
    depts=['🏛️ Public Works', '🚦 Traffic Authority', '🌊 Water Board', '⚡ Energy Council'],
    svg_content=hero_svg
)

# ─── Stats Bar ───
render_stats_bar([
    {"value": "10+", "label": "City Districts Monitored"},
    {"value": "99%", "label": "Uptime Across All Systems"},
    {"value": "4ms", "label": "Avg. Sensor Latency"},
    {"value": "6", "label": "Civic Departments Integrated"}
])

# ─── Capabilities Section ───
capabilities = [
    {"icon": "🚦", "bg": "#FEF3C7", "title": "Traffic Command", "desc": "Real-time signal optimisation and congestion alerts across all intersections."},
    {"icon": "🌫️", "bg": "#FEE2E2", "title": "AQI Sentinel", "desc": "AI-driven pollution spike prediction and automated emergency advisories."},
    {"icon": "⚡", "bg": "#FEF9C3", "title": "Grid Pulse", "desc": "Dynamic load balancing and anomaly detection for the power network."},
    {"icon": "🌊", "bg": "#E0F2FE", "title": "Water Intelligence", "desc": "Leak detection, pressure monitoring, and water quality indexing."},
    {"icon": "🚌", "bg": "#F0FDF4", "title": "Transit Analytics", "desc": "Fleet occupancy, route efficiency, and ridership dashboards."},
    {"icon": "♻️", "bg": "#F5F3FF", "title": "Waste Operations", "desc": "Bin-level telemetry and optimised collection routing."},
]

render_capabilities(
    label="Platform Capabilities",
    title="Unified Command & Control",
    desc="Integrate multi-sector urban data streams into a single source of truth for administrative transparency and operational efficiency.",
    caps=capabilities
)

# ─── Footer ───
render_footer()
