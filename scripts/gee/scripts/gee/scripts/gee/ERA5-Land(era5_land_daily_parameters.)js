GEE Script to get monthly data of ERA-5 for our desired parameters
/************************************************************
 PARAMETERS
************************************************************/
var year = 2015;  // Change as needed
var timezone = 'America/Los_Angeles';
var targetHour = 10; // Local hour for soil moisture, absolute humidity, etc.

// AOI = single ERA5-Land pixel
var aoiAsset = 'projects/username/assets/ERA5_Land_Selected_Pixel_Cuprite';
var aoi = ee.FeatureCollection(aoiAsset).geometry();

// Load ERA5-Land hourly for the year

var era5 = ee.ImageCollection('ECMWF/ERA5_LAND/HOURLY')
              .filterBounds(aoi)
              .filterDate(year + '-01-01', (year + 1) + '-01-01');

/************************************************************
 FUNCTION: Extract daily parameters
************************************************************/
var extractDailyParams = function(dailyImgs, date) {
  // -------------------------------
  // A — Daily 2m air temp stats
  // -------------------------------
  var t2mMax = dailyImgs.select('temperature_2m').reduce(ee.Reducer.max())
                        .reduceRegion({reducer: ee.Reducer.first(), geometry: aoi, scale: 10000})
                        .get('temperature_2m_max');
  var t2mMin = dailyImgs.select('temperature_2m').reduce(ee.Reducer.min())
                        .reduceRegion({reducer: ee.Reducer.first(), geometry: aoi, scale: 10000})
                        .get('temperature_2m_min');
  var diurnalAmp = ee.Number(t2mMax).subtract(t2mMin);

  // -------------------------------
  // B, C, D — Select image nearest to 10:00–12:00 local
  // -------------------------------
  var dailyImgsLocal = dailyImgs.map(function(img) {
    var localHour = ee.Number.parse(ee.Date(img.get('system:time_start')).format('HH', timezone));
    return img.set('local_hour', localHour);
  });

  var targetImg = dailyImgsLocal.filter(ee.Filter.and(
    ee.Filter.gte('local_hour', 10),
    ee.Filter.lte('local_hour', 12)
  )).sort('local_hour').first();

  targetImg = ee.Algorithms.If(targetImg, targetImg, dailyImgsLocal.sort('local_hour').first());
  targetImg = ee.Image(targetImg);

  // 2m air temp at acquisition hour
  var t2mHour = targetImg.select('temperature_2m').reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: aoi,
    scale: 10000
  }).get('temperature_2m');

  // Soil surface temperature
  var soilTemp = targetImg.select('skin_temperature').reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: aoi,
    scale: 10000
  }).get('skin_temperature');

  // Daily total precipitation
  var totalPrecip = dailyImgs.select('total_precipitation').sum()
                             .reduceRegion({reducer: ee.Reducer.first(), geometry: aoi, scale: 10000})
                             .get('total_precipitation');

  // Soil moisture Layer 1
  var soilMoisture = targetImg.select('volumetric_soil_water_layer_1').reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: aoi,
    scale: 10000
  }).get('volumetric_soil_water_layer_1');

  // Absolute Humidity
  var AH = targetImg.expression(
    '6.112 * exp((17.67 * Td)/(Td + 243.5)) * 2.1674 / (T + 273.15)',
    {
      Td: targetImg.select('dewpoint_temperature_2m'),
      T: targetImg.select('temperature_2m')
    }
  ).reduceRegion({reducer: ee.Reducer.first(), geometry: aoi, scale: 10000}).get('constant');

  return ee.Feature(null, {
    'date': date.format('YYYY-MM-dd'),
    't2m_max': t2mMax,
    't2m_min': t2mMin,
    't2m_diurnal_amp': diurnalAmp,
    't2m_hourly': t2mHour,
    'soil_temp_surface': soilTemp,
    'total_precip_daily': totalPrecip,
    'soil_moisture_layer1': soilMoisture,
    'absolute_humidity': AH,
    'hour_recorded': ee.Date(targetImg.get('system:time_start')).format('HH:mm', timezone)
  });
};

/************************************************************
 LOOP OVER MONTHS
************************************************************/
for (var month = 1; month <= 12; month++) {
  (function(m) {  // Closure to avoid issues in loop
    var monthStart = ee.Date.fromYMD(year, m, 1);
    var monthEnd = monthStart.advance(1, 'month');

    // Filter ERA5 for this month
    var era5Month = era5.filterDate(monthStart, monthEnd);

    // Days in month
    var nDaysMonth = monthEnd.difference(monthStart, 'day');
    var daysListMonth = ee.List.sequence(0, nDaysMonth.subtract(1))
                               .map(function(d) { return monthStart.advance(d, 'day'); });

    // Map daily function
    var dailyFC = ee.FeatureCollection(
      daysListMonth.map(function(d) {
        var date = ee.Date(d);
        var dailyImgs = era5Month.filterDate(date, date.advance(1, 'day'));
        return extractDailyParams(dailyImgs, date);
      })
    );

    // Export CSV for this month
    Export.table.toDrive({
      collection: dailyFC,
      description: 'ERA5_Land_' + year + '_Month_' + m,
      folder: 'ERA5_Cuprite',
      fileFormat: 'CSV'
    });

  })(month);
}

