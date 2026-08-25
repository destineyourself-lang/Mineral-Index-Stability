# ============================================================
# PLSR FIGURE

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# ============================================================
# STYLE
# ============================================================

sns.set_theme(style="white")

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": [
        "Arial",
        "Helvetica",
        "DejaVu Sans"
    ],

    "font.size": 11,

    "axes.titlesize": 16,
    "axes.titleweight": "bold",

    "axes.labelsize": 13,
    "axes.labelweight": "bold",

    "xtick.labelsize": 11,
    "ytick.labelsize": 11,

    "figure.dpi": 300,
    "savefig.dpi": 600
})

# ============================================================
# INPUT
# ============================================================

INPUT_FILE = Path(
    "/home/jovyan/Desktop/PLSR_Advanced_Results _v2.csv"
)

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"Cannot find file:\n{INPUT_FILE}"
    )

df = pd.read_csv(INPUT_FILE)

# ============================================================
# OUTPUT
# ============================================================

OUT_DIR = Path(
    "/home/jovyan/Desktop/PLSR_FIGURES"
)

OUT_DIR.mkdir(exist_ok=True)

# ============================================================
# CLEAN DATA
# ============================================================

df = df.dropna(
    subset=[
        "Season",
        "R2_CV",
        "Band",
        "Parameter"
    ]
)

# ============================================================
# BAND ORDER
# ============================================================

band_order = [
    "B2",
    "B3",
    "B4",
    "B5",
    "B8A",
    "B9",
    "B11",
    "B12"
]

# ============================================================
# PARAMETER LABELS
# ============================================================

label_map = {
    "Soil_Moisture": "SM",
    "Soil Moisture": "SM",
    "Residual NDVI": "NDVI",
    "CAMS AOD": "AOD",
    "TCWV": "TCWV"
}

# ============================================================
# SEASON LABELS
# ============================================================

season_label_map = {
    "FULL_2015_2026": "2015–2026",
    "Feb01_Jun15": "Feb–Jun",
    "Jun15_Dec15": "Jun–Dec",
    "Apr15_Jun15": "Apr–Jun",
    "Nov15_Jan15": "Nov–Jan"
}

df["Season_Label"] = (
    df["Season"]
    .map(season_label_map)
    .fillna(df["Season"])
)

# ============================================================
# FIGURE LAYOUT
# ============================================================

fig = plt.figure(
    figsize=(8.5, 10)
)

gs = fig.add_gridspec(
    2,
    1,
    height_ratios=[0.90, 1.10],
    hspace=0.28
)

ax1 = fig.add_subplot(gs[0])
ax2 = fig.add_subplot(gs[1])

# ============================================================
# PANEL A
# ============================================================

coef = (
    df.pivot_table(
        index="Band",
        columns="Parameter",
        values="Coefficient",
        aggfunc="mean"
    )
)

coef = coef.reindex(band_order)

coef.columns = [
    label_map.get(c, c)
    for c in coef.columns
]

# ------------------------------------------------------------
# ABSOLUTE VALUES FOR COLORS
# ------------------------------------------------------------

coef_abs = coef.abs()

heat = sns.heatmap(
    coef_abs,

    cmap="YlOrRd",

    annot=coef,
    fmt=".2f",

    linewidths=0.5,
    linecolor="white",

    annot_kws={
        "fontsize": 10,
        "fontweight": "bold"
    },

    cbar_kws={
        "label": "|Standardized Coefficient|",
        "shrink": 0.88
    },

    ax=ax1
)

# ------------------------------------------------------------
# AUTOMATIC TEXT COLOR
# ------------------------------------------------------------

for text in heat.texts:

    try:
        value = abs(float(text.get_text()))
    except:
        continue

    if value >= 0.40:
        text.set_color("white")
    else:
        text.set_color("black")

# ------------------------------------------------------------
# PANEL A FORMATTING
# ------------------------------------------------------------

ax1.set_title(
    "A  Relative Influence of Environmental Drivers",
    loc="left",
    pad=12
)

ax1.set_xlabel("")
ax1.set_ylabel("Sentinel-2 Bands")

for label in ax1.get_xticklabels():

    label.set_rotation(0)
    label.set_fontweight("bold")
    label.set_color("black")

for label in ax1.get_yticklabels():

    label.set_fontweight("bold")
    label.set_color("black")

ax1.tick_params(
    axis="both",
    colors="black"
)

# ============================================================
# PANEL B
# ============================================================

r2 = df[
    ["Season_Label", "R2_CV"]
].dropna()

season_order = [
    x for x in [
        "2015–2026",
        "Feb–Jun",
        "Jun–Dec",
        "Apr–Jun",
        "Nov–Jan"
    ]
    if x in r2["Season_Label"].unique()
]

BOX_COLOR = "#73C2FB"

sns.boxplot(
    data=r2,

    x="Season_Label",
    y="R2_CV",

    order=season_order,

    color=BOX_COLOR,

    width=0.60,

    showfliers=False,

    linewidth=1.6,

    medianprops={
        "color": "#08306B",
        "linewidth": 2.7
    },

    whiskerprops={
        "linewidth": 1.5
    },

    capprops={
        "linewidth": 1.5
    },

    ax=ax2
)

# ============================================================
# MEANS
# ============================================================

means = (
    r2.groupby("Season_Label")["R2_CV"]
    .mean()
    .reindex(season_order)
)

ax2.scatter(
    np.arange(len(means)),
    means.values,

    marker="D",

    s=100,

    facecolor="#FF8C42",

    edgecolor="black",

    linewidth=1.2,

    zorder=5
)

# ============================================================
# PANEL B
# ============================================================

r2 = df[
    ["Season_Label", "R2_CV"]
].dropna()



BOX_COLOR = "#73C2FB"

sns.boxplot(
    data=r2,

    x="Season_Label",
    y="R2_CV",

    order=season_order,

    color=BOX_COLOR,

    width=0.60,

    showfliers=False,

    linewidth=1.6,

    medianprops={
        "color": "#08306B",
        "linewidth": 2.7
    },

    whiskerprops={
        "linewidth": 1.5
    },

    capprops={
        "linewidth": 1.5
    },

    ax=ax2
)

# ============================================================
# MEAN VALUES
# ============================================================

means = (
    r2.groupby("Season_Label")["R2_CV"]
    .mean()
    .reindex(season_order)
)

ax2.scatter(
    np.arange(len(means)),
    means.values,

    marker="D",

    s=100,

    facecolor="#FF8C42",

    edgecolor="black",

    linewidth=1.2,

    zorder=5
)

# ============================================================
# PANEL B FORMATTING
# ============================================================

ax2.set_title(
    "B  Seasonal Variation in Model Performance",
    loc="left",
    pad=12
)

ax2.set_xlabel(
    "Temporal Subset",
    fontsize=13,
    fontweight="bold",
    color="black"
)

ax2.set_ylabel(
    r"$\mathbf{R^2_{CV}}$",
    fontsize=13,
    color="black"
)

ax2.set_ylim(
    -0.6,
    1.0
)

ax2.yaxis.grid(
    True,
    linestyle="-",
    linewidth=0.6,
    alpha=0.15
)

ax2.xaxis.grid(False)

ax2.tick_params(
    axis="both",
    colors="black"
)

for label in ax2.get_xticklabels():

    label.set_rotation(0)

    label.set_horizontalalignment("center")

    label.set_verticalalignment("top")

    label.set_linespacing(1.25)

    label.set_fontweight("bold")

    label.set_fontsize(8.5)

    label.set_color("black")

for label in ax2.get_yticklabels():

    label.set_fontweight("bold")

    label.set_fontsize(11)

    label.set_color("black")

ax2.margins(x=0.03)
# ============================================================
# BETTER X-AXIS LABEL READABILITY
# ============================================================
# ============================================================
# SHIFT OVERLAPPING LABELS DOWNWARD
# ============================================================

for label in ax2.get_xticklabels():

    label.set_rotation(0)

    label.set_ha("center")
    label.set_va("top")

    label.set_fontweight("bold")

    label.set_fontsize(9.5)

    label.set_color("black")

for label in ax2.get_yticklabels():

    label.set_fontweight("bold")

    label.set_fontsize(11)

    label.set_color("black")

# little extra breathing space for two-line labels
ax2.margins(x=0.04)

# ============================================================
# CLEAN LOOK
# ============================================================

sns.despine(ax=ax1)
sns.despine(ax=ax2)

# Extra bottom room for two-line seasonal labels
plt.subplots_adjust(
    bottom=0.14
)

plt.tight_layout()
# ============================================================
# SAVE
# ============================================================

plt.savefig(
    OUT_DIR / "PLSR_Coefficient_R2CV_Final.pdf",
    bbox_inches="tight"
)

plt.savefig(
    OUT_DIR / "PLSR_Coefficient_R2CV_Final.png",
    dpi=600,
    bbox_inches="tight"
)

plt.savefig(
    OUT_DIR / "PLSR_Coefficient_R2CV_Final.tif",
    dpi=600,
    bbox_inches="tight"
)
# ============================================================
# SEASON LABELS
# ============================================================


# ============================================================
# FIXED ORDER
# ============================================================


plt.show()

print("\n✅ Figure saved successfully")
print(OUT_DIR)
