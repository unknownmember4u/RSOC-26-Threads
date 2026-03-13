"""
ingestor.py — UrbanMind Data Pipeline
Reads raw CSVs with flexible delimiter/encoding detection.
"""
import pandas as pd
import os


# District coordinate lookup for Pune
DISTRICT_COORDS = {
    'D01': ('Shivajinagar',  18.5308, 73.8474),
    'D02': ('Kothrud',       18.5074, 73.8077),
    'D03': ('Hadapsar',      18.5018, 73.9252),
    'D04': ('Wakad',         18.5984, 73.7611),
    'D05': ('Pimpri',        18.6279, 73.8009),
    'D06': ('Baner',         18.5590, 73.7868),
    'D07': ('Magarpatta',    18.5089, 73.9259),
    'D08': ('Kharadi',       18.5497, 73.9397),
    'D09': ('Viman Nagar',   18.5679, 73.9143),
    'D10': ('Swargate',      18.5018, 73.8636),
}


def detect_delimiter(filepath, n_lines=5):
    """Auto-detect CSV delimiter by checking first few lines."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        sample = ''.join([f.readline() for _ in range(n_lines)])
    for delim in [',', ';', '\t', '|']:
        if delim in sample:
            return delim
    return ','


def read_csv_flexible(filepath, **kwargs):
    """
    Read a CSV with flexible handling for:
      - different delimiters (auto-detected)
      - mixed-case / extra-whitespace headers
      - common encodings
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    delim = detect_delimiter(filepath)

    for enc in ['utf-8', 'latin-1', 'cp1252']:
        try:
            df = pd.read_csv(filepath, delimiter=delim, encoding=enc, **kwargs)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError(f"Could not decode {filepath} with any supported encoding")

    # Normalize column names: strip whitespace + lowercase
    df.columns = df.columns.str.strip()
    return df


def inspect_csv(filepath):
    """Print column names and first 3 rows of a CSV."""
    df = read_csv_flexible(filepath)
    basename = os.path.basename(filepath)
    print(f"\n{'='*60}")
    print(f"  {basename}")
    print(f"{'='*60}")
    print(f"  Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"  Columns: {list(df.columns)}")
    print(f"\n  First 3 rows:")
    print(df.head(3).to_string(index=False))
    print(f"{'='*60}\n")
    return df


def add_coordinates(df):
    """Add lat, lng columns based on district_id."""
    df['lat'] = df['district_id'].map(lambda d: DISTRICT_COORDS.get(d, (None, None, None))[1])
    df['lng'] = df['district_id'].map(lambda d: DISTRICT_COORDS.get(d, (None, None, None))[2])
    return df
