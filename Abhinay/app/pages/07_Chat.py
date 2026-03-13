import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import streamlit as st
from utils.ui_components import get_global_styles, render_navbar, render_page_header, render_footer

st.set_page_config(page_title="AI Chat Assistant", layout="wide", page_icon="🤖")
st.markdown(get_global_styles(), unsafe_allow_html=True)
render_navbar()

render_page_header(
    title="Civic Intelligence Assistant",
    subtitle="Natural language interface for deep infrastructure queries and administrative reporting."
)

st.markdown('<div class="um-page-content">', unsafe_allow_html=True)

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Ask a question about city metrics (e.g., 'What is the traffic index in Sector D04?')"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    
    with st.chat_message("assistant"):
        st.write("Calculating insights based on real-time municipal data...")
        st.markdown("Based on current sensor data in **D04**, the traffic index is **62 (Moderate)**. A cluster of congestion is forming near the station.")

st.markdown('</div>', unsafe_allow_html=True)
render_footer()

