# Mineral Index Stability
This repository contains scripts used in the study:

**Solar Geometry and Environmental Controls on Temporal Variability of Sentinel‑2 Reflectance and Mineral Indices**

The repository supports data extraction, preprocessing and statistical analysis for the manuscript.

---

## Repository Structure

### Scripts
- **Google Earth Engine (GEE)** scripts for extracting Sentinel‑2 surface reflectance, solar geometry, ERA5‑Land meteorological variables, and CAMS aerosol optical depth.
- **Python** scripts for data preprocessing, time‑series analysis, and Partial Least Squares Regression (PLSR).

Scripts are organized by functionality within the `scripts/` directory.

---

## Analyses Included
- Multi‑temporal Sentinel‑2 surface reflectance processing  
- Integration of ERA5‑Land and CAMS environmental variables  
- Partial Least Squares Regression (PLSR) analysis  
---

## Data Sources

The following datasets are publicly available and are **not included** in this repository 

- Sentinel‑2 Level‑2A surface reflectance (ESA Copernicus)
- ERA5‑Land reanalysis data (ECMWF)
- CAMS atmospheric reanalysis data (Copernicus Atmosphere Monitoring Service)

All datasets were accessed via Google Earth Engine or official data portals.

---

## Reproducibility

This repository provides the complete workflow for data extraction, processing, and analysis required to reproduce the results presented in the manuscript. Raw datasets must be obtained independently from the original data providers.

---

## Requirements
- Python (with standard scientific libraries such as NumPy, Pandas, Matplotlib, and scikit‑learn)
- Google Earth Engine account and API access

---

## Notes
This repository is intended to support transparency and reproducibility of the published results.
Figures were generated using standard plotting tools (Python and Excel) based on the processed datasets produced by the provided scripts.
