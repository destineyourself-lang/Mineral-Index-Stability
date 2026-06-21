Aerosol Optical Thickness(AOT)-CAMS
// =========================
// INPUTS
// =========================
var aoiFC = ee.FeatureCollection('projects/username/assets/ERA5_Land_Selected_Pixel_Cuprite');
var aoi = aoiFC.geometry().simplify(100);

var start = ee.Date('2016-06-22');   // CAMS/NRT start in GEE
var end   = ee.Date('2025-12-31');

// =========================
// SENTINEL-2 (cloud filtered)
// =========================
// Use your preferred collection (SR_HARMONIZED is typical)
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate(start, end);

// ---- Cloud filtering option 1: metadata threshold (fast)
// Adjust threshold to match your "minimal cloud" criteria
s2 = s2.filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 10));

// If you already do pixel-level cloud masking in your pipeline,
// keep it there; for AOT extraction we mainly just want fewer images.

// Print size to confirm it is reduced
print('S2 count after cloud filter:', s2.size());

// =========================
// CAMS AOT 550 nm
// =========================
var cams = ee.ImageCollection('ECMWF/CAMS/NRT')
  .select('total_aerosol_optical_depth_at_550nm_surface')
  .filterDate(start, end);

// =========================
// Temporal join: nearest CAMS image within 6 hours
// =========================
var maxDiffMillis = 6 * 60 * 60 * 1000;

var join = ee.Join.saveBest({
  matchKey: 'bestCAMS',
  measureKey: 'timeDiff_ms'
});

var filter = ee.Filter.maxDifference({
  difference: maxDiffMillis,
  leftField: 'system:time_start',
  rightField: 'system:time_start'
});

var s2Joined = ee.ImageCollection(join.apply(s2, cams, filter));

// =========================
// Reduce CAMS AOT over AOI for each S2 image
// =========================
var table = s2Joined.map(function(img) {
  var camsImg = ee.Image(img.get('bestCAMS'));

  // Some S2 times may not find a CAMS image in the 6h window
  var aot = ee.Algorithms.If(
    camsImg,
    camsImg.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: aoi,
      scale: 10000,      // CAMS is coarse; 10 km is appropriate
      bestEffort: true,
      tileScale: 4,
      maxPixels: 1e13
    }).get('total_aerosol_optical_depth_at_550nm_surface'),
    null
  );

  return ee.Feature(null, {
    date: ee.Date(img.get('system:time_start')).format('YYYY-MM-dd HH:mm:ss'),
    AOT550_nearest6h: aot,
    timeDiff_ms: img.get('timeDiff_ms'),
    SPACECRAFT_NAME: img.get('SPACECRAFT_NAME'),
    S2_id: img.id()
  });
});

print('AOT table sample:', table.limit(10));

// =========================
// EXPORT
// =========================
Export.table.toDrive({
  collection: table,
  description: 'Cuprite_AOT550_CAMS_nearest6h_cloudFilteredS2',
  fileFormat: 'CSV'
});
