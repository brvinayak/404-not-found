import io
from pathlib import Path
from typing import Union, List, Optional
import pandas as pd
import numpy as np

from app.core.constants import (
    COL_AREA,
    COL_LATITUDE,
    COL_LONGITUDE,
    COL_ORDERS,
    MIN_LATITUDE,
    MAX_LATITUDE,
    MIN_LONGITUDE,
    MAX_LONGITUDE,
)


class CSVValidationError(Exception):
    """Custom exception raised when CSV validation fails."""
    def __init__(self, message: str, details: Optional[List[str]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or []


def _find_column_by_aliases(columns: List[str], aliases: List[str]) -> Optional[str]:
    """Find a column matching any alias (case-insensitive, stripped of quotes/BOM)."""
    for col in columns:
        clean = col.strip().strip("\"'").lstrip("\ufeff").lower()
        if clean in aliases:
            return col
    return None


def parse_and_validate_csv(
    source: Union[bytes, str, Path, io.BytesIO]
) -> pd.DataFrame:
    """
    Parse a CSV and validate against WarehouseIQ data schema.
    
    Supports:
    - 4-column CSVs: ['Area', 'Latitude', 'Longitude', 'Orders']
    - 2-column CSVs: ['Latitude', 'Longitude'] (Area and Orders are auto-populated)
    - Flexible column aliases ('lat', 'lon', 'lng', 'x', 'y', 'neighborhood', etc.)
    - UTF-8, UTF-8 with BOM, Latin-1 encodings
    - Comma, semicolon, or tab delimiters
    
    Returns:
        pd.DataFrame with standardized columns ['Area', 'Latitude', 'Longitude', 'Orders'].
    Raises:
        CSVValidationError if coordinates cannot be found or parsed.
    """
    df = None
    read_errors = []

    for encoding in ["utf-8-sig", "utf-8", "latin-1"]:
        try:
            if isinstance(source, bytes):
                stream = io.BytesIO(source)
            elif isinstance(source, io.BytesIO):
                source.seek(0)
                stream = source
            elif isinstance(source, (str, Path)):
                with open(source, "rb") as f:
                    stream = io.BytesIO(f.read())
            else:
                raise CSVValidationError("Unsupported source type for CSV parsing.")

            stream.seek(0)
            try:
                temp_df = pd.read_csv(stream, encoding=encoding)
            except Exception:
                stream.seek(0)
                temp_df = pd.read_csv(stream, sep=None, engine="python", encoding=encoding)

            if temp_df is not None and not temp_df.empty:
                df = temp_df
                break
        except Exception as e:
            read_errors.append(f"{encoding}: {str(e)}")

    if df is None or df.empty:
        raise CSVValidationError(
            "CSV file is empty or could not be read. Please ensure it is a valid CSV file."
        )

    # Clean column headers
    raw_columns = list(df.columns)
    cleaned_col_map = {c: str(c).strip().strip("\"'").lstrip("\ufeff") for c in raw_columns}
    df.rename(columns=cleaned_col_map, inplace=True)
    current_columns = list(df.columns)

    # 1. Identify Latitude & Longitude columns
    lat_aliases = ["latitude", "lat", "latitudes", "y", "coord_lat", "latitude (deg)"]
    lon_aliases = ["longitude", "lon", "lng", "long", "longitudes", "x", "coord_lon", "longitude (deg)"]

    matched_lat = _find_column_by_aliases(current_columns, lat_aliases)
    matched_lon = _find_column_by_aliases(current_columns, lon_aliases)

    if not matched_lat or not matched_lon:
        missing = []
        if not matched_lat: missing.append("Latitude (or lat, y)")
        if not matched_lon: missing.append("Longitude (or lon, lng, x)")
        raise CSVValidationError(
            f"Missing required coordinate column(s): {', '.join(missing)}. "
            f"Found headers: {list(df.columns)}"
        )

    df.rename(columns={matched_lat: COL_LATITUDE, matched_lon: COL_LONGITUDE}, inplace=True)

    # Convert coordinates to numeric
    df[COL_LATITUDE] = pd.to_numeric(df[COL_LATITUDE], errors="coerce")
    df[COL_LONGITUDE] = pd.to_numeric(df[COL_LONGITUDE], errors="coerce")

    # Check for empty/missing coordinate values
    lat_nulls = df[df[COL_LATITUDE].isna()]
    lon_nulls = df[df[COL_LONGITUDE].isna()]
    if not lat_nulls.empty:
        bad_indices = (lat_nulls.index + 2).tolist()[:10]
        raise CSVValidationError(f"Missing Latitude coordinate in row(s): {bad_indices}")
    if not lon_nulls.empty:
        bad_indices = (lon_nulls.index + 2).tolist()[:10]
        raise CSVValidationError(f"Missing Longitude coordinate in row(s): {bad_indices}")

    # Check for coordinate bounds
    invalid_lat = df[(df[COL_LATITUDE] < MIN_LATITUDE) | (df[COL_LATITUDE] > MAX_LATITUDE)]
    if not invalid_lat.empty:
        bad_indices = (invalid_lat.index + 2).tolist()[:10]
        raise CSVValidationError(f"Invalid Latitude in row(s) {bad_indices}. Must be within [{MIN_LATITUDE}, {MAX_LATITUDE}].")

    invalid_lon = df[(df[COL_LONGITUDE] < MIN_LONGITUDE) | (df[COL_LONGITUDE] > MAX_LONGITUDE)]
    if not invalid_lon.empty:
        bad_indices = (invalid_lon.index + 2).tolist()[:10]
        raise CSVValidationError(f"Invalid Longitude in row(s) {bad_indices}. Must be within [{MIN_LONGITUDE}, {MAX_LONGITUDE}].")

    # 2. Identify or Auto-populate Area
    area_aliases = ["area", "name", "neighborhood", "location", "id", "address", "label"]
    matched_area = _find_column_by_aliases([c for c in df.columns if c not in [COL_LATITUDE, COL_LONGITUDE]], area_aliases)

    if matched_area:
        df.rename(columns={matched_area: COL_AREA}, inplace=True)
        df[COL_AREA] = df[COL_AREA].fillna("").astype(str).str.strip()
        empty_mask = df[COL_AREA] == ""
        df.loc[empty_mask, COL_AREA] = [f"Point #{i + 1}" for i in df[empty_mask].index]
        # Check duplicate area names if Area was explicitly provided
        duplicates = df[COL_AREA][df[COL_AREA].duplicated(keep=False)].unique()
        if len(duplicates) > 0 and len(duplicates) < len(df):
            sample_dups = list(duplicates[:5])
            raise CSVValidationError(f"Duplicate neighborhood(s) detected: {sample_dups}. Each Area name must be unique.")
    else:
        df[COL_AREA] = [f"House #{i + 1}" for i in range(len(df))]

    # 3. Identify or Auto-populate Orders
    orders_aliases = ["orders", "order", "demand", "volume", "count", "weight", "houses", "quantity"]
    matched_orders = _find_column_by_aliases([c for c in df.columns if c not in [COL_LATITUDE, COL_LONGITUDE, COL_AREA]], orders_aliases)

    if matched_orders:
        df.rename(columns={matched_orders: COL_ORDERS}, inplace=True)
        orders_num = pd.to_numeric(df[COL_ORDERS], errors="coerce")
        if orders_num.isna().any():
            bad_indices = (df[orders_num.isna()].index + 2).tolist()[:10]
            raise CSVValidationError(f"Missing Orders in row(s): {bad_indices}")
        if (orders_num < 0).any():
            bad_indices = (df[orders_num < 0].index + 2).tolist()[:10]
            raise CSVValidationError(f"Invalid Orders in row(s) {bad_indices}. Must be a non-negative number.")
        df[COL_ORDERS] = orders_num.astype(int)
    else:
        df[COL_ORDERS] = 1

    df = df[[COL_AREA, COL_LATITUDE, COL_LONGITUDE, COL_ORDERS]].reset_index(drop=True)
    df[COL_AREA] = df[COL_AREA].astype(str)
    df[COL_LATITUDE] = df[COL_LATITUDE].astype(float)
    df[COL_LONGITUDE] = df[COL_LONGITUDE].astype(float)
    df[COL_ORDERS] = df[COL_ORDERS].astype(int)

    return df
