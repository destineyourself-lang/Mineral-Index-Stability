GEE Script to get SZA
/********************************************************
 STEP — EXPORT SZA & DATE FOR SENTINEL-2
********************************************************/

// AOI
var aoiAsset = 'projects/username/assets/ERA5_Land_Selected_Pixel_Cuprite';
var updatedAOI = ee.FeatureCollection(aoiAsset).geometry();

// Sentinel-2 SR
var s2CollectionId = 'COPERNICUS/S2_SR';

// Dates
var startDate = '2015-01-01';
var endDate = ee.Date(Date.now());

// Nevada timezone
var timezone = 'America/Los_Angeles';

// Load S2 images
var s2SR = ee.ImageCollection(s2CollectionId)
              .filterBounds(updatedAOI)
              .filterDate(startDate, endDate);

print('Sentinel-2 images:', s2SR.size());

// Map to extract SZA and date info
var szaFC = s2SR.map(function(img) {
  return ee.Feature(null, {
    'utc_date': ee.Date(img.get('system:time_start')).format('YYYY-MM-dd'),
    'utc_time': ee.Date(img.get('system:time_start')).format('HH:mm:ss'),
    'local_date': ee.Date(img.get('system:time_start')).format('YYYY-MM-dd', timezone),
    'local_time': ee.Date(img.get('system:time_start')).format('HH:mm:ss', timezone),
    'SZA': img.get('MEAN_SOLAR_ZENITH_ANGLE')
  });
});

print('SZA FeatureCollection:', szaFC);

// Export to CSV
Export.table.toDrive({
  collection: szaFC,
  description: 'S2_SZA_Date_Info',
  folder: 'GEE_Cuprite_Exports',
  fileFormat: 'CSV'
});

