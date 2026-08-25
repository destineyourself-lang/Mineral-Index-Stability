# Environmental Controls on the Stability of Mineral Indices and Implications for Reliable Mineral Mapping

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22096449.svg)/doi.org/10.5281/zenodo.22096449)

## Overview

This repository contains the Google Earth Engine (GEE) and Python scripts used in the study:

**"Environmental Controls on the Stability of Mineral Indices and Implications for Reliable Mineral Mapping"**

The workflow integrates Sentinel-2 surface reflectance observations with meteorological, atmospheric, and environmental datasets to investigate temporal variability in mineral indices and assess their suitability for reliable geological mapping.

---

## Study Objectives

The objectives of this study are:

- Quantify temporal variability in Sentinel-2 reflectance.
- Evaluate the stability of mineral-sensitive spectral indices.
- Investigate environmental controls affecting index stability.
- Compare Sentinel-2A and Sentinel-2B observations.
- Assess implications for operational mineral mapping.
- Develop a transferable framework applicable to future hyperspectral missions.

---

## Data Sources

### Sentinel-2
- Harmonized Surface Reflectance (S2_SR_HARMONIZED)
- Sentinel-2A and Sentinel-2B
- Reflectance bands B1 to B12

### ERA5-Land
- Air temperature
- Surface temperature
- Soil moisture
- Precipitation
- Absolute humidity

### CAMS Reanalysis
- Aerosol Optical Depth (AOD)
- Dust Aerosol Optical Depth (DUAOD)

### MODIS
- Aerosol Optical Thickness (AOT)

---

## Workflow

```text
ERA5 Grid Selection
        ↓
AOI Selection
        ↓
Sentinel-2 Data Extraction
        ↓
Cloud & Vegetation Masking
        ↓
Spectral Index Calculation
        ↓
ERA5 Environmental Variables
        ↓
CAMS Atmospheric Variables
        ↓
Data Integration
        ↓
Temporal Analysis
        ↓
PLSR Modelling
        ↓
Publication Figures
```

---

## Repository Structure

```text
scripts/
├── gee/
│   ├── ERA5-Land extraction
│   ├── Sentinel-2 processing
│   ├── SZA extraction
│   └── Environmental variable retrieval
│
└── python/
    ├── Data preprocessing
    ├── Dataset merging
    ├── Visualization
    ├── Time-series analysis
    ├── PLSR analysis
    └── Figure generation
```

---

## Software Requirements

### Google Earth Engine

- JavaScript API
- Sentinel-2 Harmonized Collection
- ERA5-Land
- CAMS datasets

## Computational Environment

Data processing and analysis were conducted using:

- Python 3.11+
- Google Earth Engine (JavaScript API)
- Jupyter Notebook
- QGIS

### Core Python Packages

- NumPy
- Pandas
- Matplotlib
- Seaborn
- Xarray
- NetCDF4
- GeoPandas
- Shapely
- Rtree
- PyProj
- Scikit-learn
- python-docx
---

## Key Analyses

- Sentinel-2 Reflectance Variability Assessment
- Sentinel-2A vs Sentinel-2B Comparison
- Environmental Driver Analysis
- Aerosol and Atmospheric Effects
- Mineral Index Stability Evaluation
- Partial Least Squares Regression (PLSR)

---

## Reproducibility

All scripts required to reproduce the analyses presented in the manuscript are provided in this repository.

Users may adapt the workflow to different regions by modifying:

- Area of Interest (AOI)
- Study period
- Environmental variables
- Mineral indices

---

## Citation

If you use this repository, please cite:

**Jawad, M. (2026).**  
*Environmental Controls on the Stability of Mineral Indices and Implications for Reliable Mineral Mapping.*

Repository DOI:

https://doi.org/10.5281/zenodo.22096449

---

## Repository DOI

**Zenodo Archive**

https://doi.org/10.5281/zenodo.22096449

---

## GitHub Repository

https://github.com/destineyourself-lang/Mineral-Index-Stability

---

## License

This repository is provided for academic and research purposes.
