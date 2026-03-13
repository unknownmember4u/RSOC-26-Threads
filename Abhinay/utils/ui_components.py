import streamlit as st
from utils.color_config import THEME

def render_html(html_str):
    """Utility to render raw HTML natively."""
    clean = html_str.replace('\n', '')
    st.markdown(clean, unsafe_allow_html=True)

def get_global_styles():
    """Returns the global CSS for the application as a strict string."""
    css = f"""

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

html, body, [class*="css"] {{
    font-family: 'Inter', sans-serif !important;
    background-color: {THEME['bg_main']} !important;
    color: {THEME['text_primary']};
}}

[data-testid="stAppViewContainer"] {{
    background: {THEME['bg_main']} !important;
    max-width: 100vw;
    overflow-x: hidden;
}}

[data-testid="stHeader"], [data-testid="stToolbar"], footer, #MainMenu {{ display: none !important; }}

.block-container {{
    padding: 0 !important;
    max-width: 100% !important;
}}

/* Component: Navbar */
.um-navbar-wrap {{
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 999;
    display: flex;
    justify-content: center;
    padding: 18px 0;
    pointer-events: none;
}}

.um-navbar {{
    pointer-events: all;
    display: flex;
    align-items: center;
    gap: 48px;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid {THEME['border']};
    border-radius: 100px;
    padding: 10px 24px 10px 18px;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
}}

.um-nav-logo {{
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 1.1rem;
    color: {THEME['text_primary']};
    letter-spacing: -0.3px;
    text-decoration: none;
}}

.um-nav-logo-icon {{
    width: 32px; height: 32px;
    background: {THEME['primary']};
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 900;
    letter-spacing: -1px;
}}

.um-nav-links {{ display: flex; gap: 32px; list-style: none; }}
.um-nav-links a {{
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    color: {THEME['text_secondary']};
    transition: color 0.2s;
}}
.um-nav-links a:hover {{ color: {THEME['text_primary']}; }}

.um-nav-cta {{
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 700;
    color: #fff !important;
    background: {THEME['primary']};
    padding: 9px 22px;
    border-radius: 100px;
    transition: background 0.2s, transform 0.15s;
    white-space: nowrap;
}}
.um-nav-cta:hover {{ background: {THEME['primary_dark']}; transform: translateY(-1px); }}

/* Layout: Hero */
.um-hero {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 100vh;
    padding: 120px 7% 80px 7%;
    gap: 60px;
    max-width: 1400px;
    margin: 0 auto;
}}

.um-hero-content {{ flex: 0 0 52%; max-width: 52%; }}

.um-hero-badge {{
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #FEF3C7;
    border: 1px solid {THEME['accent']};
    color: #92400E;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 5px 13px;
    border-radius: 100px;
    margin-bottom: 28px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}

.um-badge-dot {{ width: 6px; height: 6px; background: {THEME['accent']}; border-radius: 50%; }}

.um-hero-title {{
    font-size: clamp(2.4rem, 3.8vw, 3.6rem);
    font-weight: 900;
    line-height: 1.07;
    letter-spacing: -2px;
    color: {THEME['text_primary']};
    margin-bottom: 22px;
}}
.um-hero-title span {{ color: {THEME['primary']}; }}

.um-hero-desc {{
    font-size: 1.1rem;
    line-height: 1.75;
    color: {THEME['text_secondary']};
    max-width: 540px;
    margin-bottom: 38px;
}}

.um-btn-primary {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    background: {THEME['primary']};
    color: #fff !important;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 14px 32px;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(181,18,27,0.3);
    transition: 0.2s;
}}
.um-btn-primary:hover {{ background: {THEME['primary_dark']}; transform: translateY(-2px); }}

/* Component: Visual Card */
.um-hero-visual {{ flex: 0 0 44%; max-width: 44%; display: flex; justify-content: center; }}
.um-svg-card {{
    background: #fff;
    border-radius: 20px;
    border: 1px solid {THEME['border']};
    box-shadow: 0 8px 40px rgba(0,0,0,0.07);
    padding: 28px;
    width: 100%;
    position: relative;
    overflow: hidden;
}}
.um-svg-card::before {{
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, {THEME['primary']} 0%, {THEME['accent']} 50%, {THEME['accent_muted']} 100%);
}}

/* Component: Stats Bar */
.um-stat-cell {{ flex: 1; padding: 32px 28px; background: #fff; text-align: left; }}
.um-stat-value {{ font-size: 2.2rem; font-weight: 900; color: {THEME['text_primary']}; letter-spacing: -1px; }}
.um-stat-value span {{ color: {THEME['primary']}; }}
.um-stat-label {{ font-size: 0.85rem; color: {THEME['text_muted']}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-top: 4px; }}

/* Component: Section Labels */
.um-section-label {{
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: {THEME['primary']};
    margin-bottom: 12px;
}}

.um-section-title {{
    font-size: clamp(1.8rem, 2.8vw, 2.4rem);
    font-weight: 800;
    color: {THEME['text_primary']};
    letter-spacing: -1px;
    margin-bottom: 14px;
    line-height: 1.15;
}}

.um-section-desc {{
    font-size: 1.1rem;
    color: {THEME['text_secondary']};
    max-width: 600px;
    line-height: 1.7;
    margin-bottom: 48px;
}}

/* Component: Capability Cards */
.um-cap-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }}
.um-cap-card {{
    background: #fff;
    border: 1px solid {THEME['border']};
    border-radius: 16px;
    padding: 32px;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}}
.um-cap-card:hover {{ 
    box-shadow: 0 12px 30px rgba(0,0,0,0.08); 
    transform: translateY(-4px);
    border-color: {THEME['primary']};
}}
.um-cap-icon {{ 
    width: 48px; height: 48px; border-radius: 12px; 
    display: flex; align-items: center; justify-content: center; 
    font-size: 1.5rem; margin-bottom: 20px; 
}}
.um-cap-title {{ font-size: 1.1rem; font-weight: 700; color: {THEME['text_primary']}; margin-bottom: 8px; }}
.um-cap-desc {{ font-size: 0.95rem; color: {THEME['text_secondary']}; line-height: 1.6; }}

/* Component: Footer */
.um-footer {{ background: {THEME['bg_sidebar']}; padding: 48px 7%; }}

/* Sidebar Customization */
[data-testid="stSidebar"] {{
    background-color: {THEME['bg_sidebar']} !important;
    border-right: 1px solid rgba(255,255,255,0.05);
}}
[data-testid="stSidebar"] * {{ color: rgba(255,255,255,0.9) !important; }}
[data-testid="stSidebarNav"] {{ padding-top: 20px; }}

/* Dept Strips */
.um-dept-strip {{ display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 20px; }}
.um-dept-label {{ font-size: 0.7rem; font-weight: 700; color: {THEME['text_muted']}; text-transform: uppercase; letter-spacing: 1px; }}
.um-dept-chip {{ 
    display: inline-flex; align-items: center; gap: 6px; 
    font-size: 0.8rem; font-weight: 600; color: {THEME['text_secondary']}; 
    background: #fff; border: 1px solid {THEME['border']}; 
    padding: 5px 14px; border-radius: 100px;
    """
    return f"<style>{css}</style>"


def render_navbar():
    render_html(f"""
<div class="um-navbar-wrap">
<nav class="um-navbar">
<a href="/" class="um-nav-logo">
<div class="um-nav-logo-icon">UM</div>
<span>UrbanMind</span>
</a>
<ul class="um-nav-links">
<li><a href="/#overview">Overview</a></li>
<li><a href="/#analytics">Analytics</a></li>
<li><a href="/#governance">Governance</a></li>
</ul>
<a href="/Dashboard" class="um-nav-cta">Command Center &rarr;</a>
</nav>
</div>
""")


def render_page_header(title, subtitle):
    render_html(f"""
<div style="padding: 120px 7% 0 7%; max-width: 1400px; margin: 0 auto;">
<div class="um-section-label">Command Center</div>
<h1 class="um-hero-title" style="margin-bottom:8px; font-size:2.8rem;">{title}</h1>
<p class="um-section-desc" style="margin-bottom:32px;">{subtitle}</p>
<hr style="border:none; border-top:1px solid {THEME['border']}; margin: 0;">
</div>
""")


def render_hero(title_html, desc, badge_text, cta_text, cta_link, depts, svg_content):
    dept_chips = "".join([f'<span class="um-dept-chip">{d}</span>' for d in depts])
    
    if badge_text:
        badge_html = f"""
<div class="um-hero-badge">
<div class="um-badge-dot"></div>
{badge_text}
</div>"""
    else:
        badge_html = ""

    render_html(f"""
<div class="um-hero">
<div class="um-hero-content">
{badge_html}
<h1 class="um-hero-title">{title_html}</h1>
<p class="um-hero-desc">{desc}</p>
<div class="um-hero-actions">
<a href="{cta_link}" class="um-btn-primary">
{cta_text} &ensp; &rarr;
</a>
</div>
<div class="um-dept-strip">
<span class="um-dept-label">Integrated Depts.</span>
{dept_chips}
</div>
</div>
<div class="um-hero-visual">
<div class="um-svg-card">
{svg_content}
</div>
</div>
</div>
""")


def render_stats_bar(stats):
    cells = ""
    for s in stats:
        val = s['value']
        if val[-1] in ['+', '%']:
            val_html = f"{val[:-1]}<span>{val[-1]}</span>"
        else:
            val_html = val
        cells += f"""
<div class="um-stat-cell">
<div class="um-stat-value">{val_html}</div>
<div class="um-stat-label">{s['label']}</div>
</div>"""
    
    render_html(f"""
<div style="background:#fff; border-top:1px solid {THEME['border']}; border-bottom:1px solid {THEME['border']};">
<div style="max-width:1400px; margin:0 auto; display:flex; gap:1px; background:{THEME['border']};">
{cells}
</div>
</div>
""")


def render_capabilities(label, title, desc, caps):
    cap_cards = ""
    for c in caps:
        cap_cards += f"""
<div class="um-cap-card">
<div class="um-cap-icon" style="background:{c['bg']};">{c['icon']}</div>
<div class="um-cap-title">{c['title']}</div>
<div class="um-cap-desc">{c['desc']}</div>
</div>"""
    
    render_html(f"""
<div id="overview" style="background:#fff; border-top:1px solid {THEME['border']}; padding:80px 7%;">
<div style="max-width:1400px; margin:0 auto;">
<div class="um-section-label">{label}</div>
<h2 class="um-section-title">{title}</h2>
<p class="um-section-desc">{desc}</p>
<div class="um-cap-grid">
{cap_cards}
</div>
</div>
</div>
""")


def render_footer():
    render_html(f"""
<div class="um-footer">
<div style="max-width:1400px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
<div style="display:flex; align-items:center; gap:10px;">
<div class="um-nav-logo-icon">UM</div>
<span style="color:#fff;font-weight:700;font-size:0.95rem;">UrbanMind</span>
</div>
<span style="color:{THEME['text_muted']}; font-size:0.82rem;">© 2026 UrbanMind — Government Intelligence Framework.</span>
<span style="color:#fff; font-size:0.8rem; background:rgba(255,255,255,0.08); padding:5px 16px; border-radius:100px; border: 1px solid rgba(255,255,255,0.1);">🔒 Secure Administrative Node</span>
</div>
</div>
""")

