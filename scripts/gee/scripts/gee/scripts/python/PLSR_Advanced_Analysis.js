Advanced PLSR Analysis Script-Python
# ============================================================
# ADVANCED PLSR ANALYSIS - CLEAN VERSION
# ============================================================

import pandas as pd
import numpy as np
from pathlib import Path

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.cross_decomposition import PLSRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.model_selection import KFold, cross_val_predict

# ============================================================
# INPUT
# ============================================================

INPUT_FILE = "ERA5_Combined_with_CAMS_MODIS_S2_SZA_V0_cleaned.csv"
DATE_COL = "Date"
PLATFORM_COL = "S2_platform"

OUT_DIR = Path("PLSR_ADVANCED_OUTPUT")
OUT_DIR.mkdir(exist_ok=True)

# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(INPUT_FILE)
df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
df = df[df[DATE_COL].notna()].copy()

# Sentinel-2A only
df = df[df[PLATFORM_COL].astype(str).str.contains("2A", na=False)].copy()

# Time filter
df = df[df[DATE_COL] >= "2015-07-01"].copy()

# ============================================================
# BANDS
# ============================================================

BANDS = {
    "B2": "S2_B2_mean",
    "B3": "S2_B3_mean",
    "B4": "S2_B4_mean",
    "B5": "S2_B5_mean",
    "B8A": "S2_B8A_mean",
    "B9": "S2_B9_mean",
    "B11": "S2_B11_mean",
    "B12": "S2_B12_mean"
}

# ============================================================
# PREDICTORS
# ============================================================

PREDICTORS = {
    "Soil_Moisture": "soil_moisture_L1_19_m3/m3",
    "CAMS_AOD": "CAMS_aod550",
    "TCWV": "total_column_water_vapour_19_kgm2",
    "Residual_NDVI": "S2_Residual_NDVI_mean"
}

# ============================================================
# NUMERIC CONVERSION
# ============================================================

for c in list(BANDS.values()) + list(PREDICTORS.values()):
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")

# ============================================================
# CLASSIFIERS
# ============================================================

def classify_influence(x):
    x = abs(x)
    if x < 0.10:
        return "Negligible"
    elif x < 0.25:
        return "Weak"
    elif x < 0.40:
        return "Moderate"
    elif x < 0.60:
        return "Strong"
    else:
        return "Very Strong"


def classify_vip(v):
    if v < 0.8:
        return "Low"
    elif v < 1.0:
        return "Moderate"
    else:
        return "High"

# ============================================================
# VIP FUNCTION
# ============================================================

def calculate_vip(pls):
    t = pls.x_scores_
    w = pls.x_weights_
    q = pls.y_loadings_

    p, h = w.shape
    ss = np.diag(t.T @ t @ q.T @ q)
    total_ss = np.sum(ss)

    vip = np.zeros(p)

    for i in range(p):
        weight = [(w[i, j] ** 2) * ss[j] for j in range(h)]
        vip[i] = np.sqrt(p * np.sum(weight) / total_ss)

    return vip

# ============================================================
# SEASON FILTER
# ============================================================

def seasonal_filter(data, sm, sd, em, ed):
    mask = []

    for d in data[DATE_COL]:
        md = (d.month, d.day)
        start = (sm, sd)
        end = (em, ed)

        if start <= end:
            mask.append(start <= md <= end)
        else:
            mask.append(md >= start or md <= end)

    return data[np.array(mask)].copy()

# ============================================================
# SEASONS
# ============================================================

SEASONS = {
    "FULL_2015_2026": None,
    "Feb01_Jun15": (2, 1, 6, 15),
    "Jun15_Dec15": (6, 15, 12, 15),
    "Apr15_Jun15": (4, 15, 6, 15),
    "Nov15_Jan15": (11, 15, 1, 15)
}

# ============================================================
# PLSR FUNCTION
# ============================================================

def run_plsr(data, season):

    results = []
    X_cols = list(PREDICTORS.values())

    data = data.dropna(subset=X_cols)
    if len(data) < 10:
        return None

    X = StandardScaler().fit_transform(data[X_cols])

    for band, col in BANDS.items():

        if col not in data.columns:
            continue

        y = pd.to_numeric(data[col], errors="coerce")
        valid = y.notna()

        if valid.sum() < 10:
            continue

        Xv = X[valid]
        yv = y[valid].values.reshape(-1, 1)

        ys = StandardScaler().fit_transform(yv)

        # ====================================================
        # COMPONENT SELECTION
        # ====================================================

        max_components = min(4, Xv.shape[1])

        cv = KFold(n_splits=5, shuffle=True, random_state=42)

        component_results = []

        for n_comp in range(1, max_components + 1):

            pls_test = PLSRegression(n_components=n_comp)

            yp_cv = cross_val_predict(pls_test, Xv, ys.ravel(), cv=cv)

            r2_cv = r2_score(ys.ravel(), yp_cv)

            component_results.append((n_comp, r2_cv))

        best_n = max(component_results, key=lambda x: x[1])[0]

        # ====================================================
        # FINAL MODEL
        # ====================================================

        pls = PLSRegression(n_components=best_n)
        pls.fit(Xv, ys)

        vip_scores = calculate_vip(pls)

        yp_train = pls.predict(Xv)
        r2_train = r2_score(ys, yp_train)

        yp_cv = cross_val_predict(pls, Xv, ys.ravel(), cv=cv)
        r2_cv = r2_score(ys.ravel(), yp_cv)

        rmse_cv = np.sqrt(mean_squared_error(ys.ravel(), yp_cv))

        coefs = pls.coef_.flatten()

        for i, param in enumerate(PREDICTORS.keys()):

            results.append({
                "Season": season,
                "Band": band,
                "Parameter": param,
                "Coefficient": coefs[i],
                "Abs_Coefficient": abs(coefs[i]),
                "VIP": vip_scores[i],
                "VIP_Class": classify_vip(vip_scores[i]),
                "Influence_Class": classify_influence(coefs[i]),
                "R2_Train": r2_train,
                "R2_CV": r2_cv,
                "RMSE_CV": rmse_cv,
                "Components": best_n
            })

    return pd.DataFrame(results)

# ============================================================
# RUN ALL SEASONS
# ============================================================

all_results = []

for name, vals in SEASONS.items():

    subset = df.copy() if name == "FULL_2015_2026" else seasonal_filter(df, *vals)

    res = run_plsr(subset, name)

    if res is not None:
        all_results.append(res)

df_res = pd.concat(all_results, ignore_index=True)

# ============================================================
# SAVE RESULTS
# ============================================================

df_res.to_csv(OUT_DIR / "PLSR_Advanced_Results.csv", index=False)

print("\n================ FULL ADVANCED RESULTS ================\n")
print(df_res.head())

# ============================================================
# SUMMARY TABLE
# ============================================================

summary_df = []

for band in heat.index:
    for param in heat.columns:
        val = heat.loc[band, param]
        summary_df.append({
            "Band": band,
            "Parameter": param,
            "Coefficient": round(val, 3),
            "Influence_Class": classify_influence(val)
        })

summary_df = pd.DataFrame(summary_df)

summary_df.to_csv(OUT_DIR / "PLSR_Synthesis_Table.csv", index=False)

print("\n================ SYNTHESIS TABLE ================\n")
print(summary_df)

print("\nOUTPUT SAVED TO:", OUT_DIR)
