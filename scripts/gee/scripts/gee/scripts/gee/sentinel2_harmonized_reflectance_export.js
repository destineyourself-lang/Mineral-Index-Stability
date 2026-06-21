GEE Script to get Harmonised Data of Sentinel-2 
/********************************************************
 STEP 0 — PARAMETERS
********************************************************/

var aoiAsset = 'projects/username/assets/ERA5_Land_Selected_Pixel_Cuprite';
var updatedAOI = ee.FeatureCollection(aoiAsset).geometry();

/*** HARMONIZED COLLECTION ***/
var s2CollectionId = 'COPERNICUS/S2_SR_HARMONIZED';
var s2CloudProbId = 'COPERNICUS/S2_CLOUD_PROBABILITY';

var cloudProbValue = 60;          // cloud pixel threshold
var maskedFractionLimit = 0.10;   // max allowed fraction (cloud + vegetation)
var vegThreshold = 0.20;          // NDVI > 0.20 considered vegetation

var scaleUsed = 20;               // analysis scale in meters
var startDate = '2015-01-01';
var endDate = ee.Date(Date.now());

var timezone = 'America/Los_Angeles'; // Nevada local time

var bands = ['B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B11','B12'];

/********************************************************
 STEP 1 — Load AOI
********************************************************/

Map.centerObject(updatedAOI, 12);
Map.addLayer(updatedAOI, {color: 'blue'}, 'Updated_AOI_CMD_Nevada');
print("AOI asset path:", aoiAsset);
print("AOI area (m^2):", updatedAOI.area());

/********************************************************
 STEP 2 — Load Sentinel-2 SR (HARMONIZED) + Cloud Probability
********************************************************/

var s2SR = ee.ImageCollection(s2CollectionId)
              .filterBounds(updatedAOI)
              .filterDate(startDate, endDate);

var s2CloudProb = ee.ImageCollection(s2CloudProbId)
                      .filterBounds(updatedAOI)
                      .filterDate(startDate, endDate);

print("S2_SR_HARMONIZED images found:", s2SR.size());
print("Cloud probability images:", s2CloudProb.size());

/********************************************************
 STEP 3 — Join SR + Cloud Probability
********************************************************/

var join = ee.Join.inner();
var filter = ee.Filter.equals({
  leftField: 'system:index',
  rightField: 'system:index'
});

var joinedS2 = join.apply(s2SR, s2CloudProb, filter);

var s2Merged = ee.ImageCollection(
  joinedS2.map(function(f) {
    var img = ee.Image(f.get('primary'));
    var cld = ee.Image(f.get('secondary'));
    return img.addBands(cld.rename('cloud_probability'))
              .set('system:time_start', img.get('system:time_start'))
              .set('SPACECRAFT_NAME', img.get('SPACECRAFT_NAME'));
  })
);

print("Cloud-merged S2 collection:", s2Merged.size());

/********************************************************
 STEP 4 — Add NDVI & Spectral Indices
********************************************************/

function addIndices(img) {

  var ndvi = img.normalizedDifference(['B8','B4']).rename('NDVI');

  var savi = img.expression(
    '((NIR - RED) / (NIR + RED + 0.5)) * 1.5',
    { NIR: img.select('B8'), RED: img.select('B4') }
  ).rename('SAVI');

  var ferric = img.expression(
    '(B4 - B1) / (B4 + B1)',
    { B4: img.select('B4'), B1: img.select('B1') }
  ).rename('Ferric');

  var kaolinite = img.expression(
    '(B8 - B4) / (B8 + B4)',
    { B8: img.select('B8'), B4: img.select('B4') }
  ).rename('Kaolinite');

  var clayCarbonate = img.expression(
    '(B11 - B8) / (B11 + B8)',
    { B11: img.select('B11'), B8: img.select('B8') }
  ).rename('ClayCarbonate');

  var ndwi = img.normalizedDifference(['B3','B8']).rename('NDWI');

  return img.addBands([
    ndvi, savi, ferric, kaolinite, clayCarbonate, ndwi
  ]);
}

var s2Processed = s2Merged.map(addIndices);
print('Processed S2 with indices:', s2Processed.size());

/********************************************************
 STEP 5 — Compute masked fraction (cloud + vegetation)
********************************************************/

var computeMaskedAndStats = function(img) {

  var ref = img.select('B8');

  var totalPix = ee.Number(
    ref.reduceRegion({
      reducer: ee.Reducer.count(),
      geometry: updatedAOI,
      scale: scaleUsed,
      maxPixels: 1e13
    }).get('B8')
  );

  var cloudMask = img.select('cloud_probability').gt(cloudProbValue);

  var cloudCount = ee.Number(
    cloudMask.reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: updatedAOI,
      scale: scaleUsed,
      maxPixels: 1e13
    }).get('cloud_probability')
  );

  var vegMask = img.select('NDVI').gt(vegThreshold);

  var vegCount = ee.Number(
    vegMask.reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: updatedAOI,
      scale: scaleUsed,
      maxPixels: 1e13
    }).get('NDVI')
  );

  var maskedCount = cloudCount.add(vegCount);
  var maskedFraction = maskedCount.divide(totalPix);

  var unmaskedCount = totalPix.subtract(maskedCount);
  var unmaskedFraction = ee.Number(1).subtract(maskedFraction);

  return ee.Algorithms.If(
    maskedFraction.lte(maskedFractionLimit),

    ee.Feature(null,
      img.select(bands).reduceRegion({
        reducer: ee.Reducer.mean()
          .combine(ee.Reducer.stdDev(), '', true)
          .combine(ee.Reducer.min(), '', true)
          .combine(ee.Reducer.max(), '', true),
        geometry: updatedAOI,
        scale: scaleUsed,
        maxPixels: 1e13
      })
    ).set({
      'total_pixels': totalPix,
      'cloud_pixels': cloudCount,
      'veg_pixels': vegCount,
      'masked_pixels': maskedCount,
      'masked_fraction': maskedFraction,
      'unmasked_pixels': unmaskedCount,
      'unmasked_fraction': unmaskedFraction,
      'platform': img.get('SPACECRAFT_NAME'),
      'utc_date': ee.Date(img.get('system:time_start')).format('YYYY-MM-dd'),
      'utc_time': ee.Date(img.get('system:time_start')).format('HH:mm:ss'),
      'local_date': ee.Date(img.get('system:time_start')).format('YYYY-MM-dd', timezone),
      'local_time': ee.Date(img.get('system:time_start')).format('HH:mm:ss', timezone)
    }),

    ee.Feature(null)
  );
};

var s2StatsFC = ee.FeatureCollection(
  s2Processed.map(computeMaskedAndStats)
             .filter(ee.Filter.notNull([bands[0] + '_mean']))
);

print('Filtered Sentinel-2 HARMONIZED FeatureCollection:', s2StatsFC);

/********************************************************
 STEP 6 — Export CSV
********************************************************/

Export.table.toDrive({
  collection: s2StatsFC,
  description: 'S2_HARMONIZED_BandStats_WithIndices_Max10pctMasked',
  folder: 'GEE_Cuprite_Exports',
  fileFormat: 'CSV'
});

