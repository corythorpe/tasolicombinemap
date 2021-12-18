<?php
$sectorData = file_get_contents("swcAPIcache/Sectors.json");
$systemData = file_get_contents("swcAPIcache/Systems.json");
$factionData = file_get_contents("swcAPIcache/Factions.json");
 ?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Combine Galaxy Map</title>
  <script type="text/javascript">
  var sectorData = <?php echo $sectorData; ?>;
  var systemData = <?php echo $systemData; ?>;
  var factionData = <?php echo $factionData; ?>;
  </script>
  <script type="text/javascript" src="http://maps.google.com/maps/api/js?key=AIzaSyDkl_stDtWZYeVOdaVZLdyxsdatxJcB7ok"></script>
  <script type="text/javascript" src="sectormap.js"></script>
  <link rel="stylesheet" type="text/css" href="sectormap.css" />
</head>
<body onload="initMap()">
  <div id="page-contents">
    <div id="SearchAndResults">
      <div id="site-title">Tasoli's <a href="https://www.swcombine.com/">Combine</a> Galaxy Map <div id="changelog-link"><a href="/sectormap-changelog.html"> Beta 1.4</a></div></div>
      <div id="searchPolygons">
    	<div class="field-label">Search for a sector, system, or planet by name:</div>
    	<input id="searchInput" type="text" style="padding: 0px; margin: 0px; width: inherit; height: 22px" onkeyup="searchPolygons(this);" />
    	</div>
    	<div id="results-explanation">Select to re-center, or click directly on map:</div>
    	<div id="searchResults"></div>
    	<br/>
    </div>
  <div id="coords"></div>
  <div id="politics-legend-mobile"><div id="politics-legend"><div id="politics-legend-title" style="font-size: 12px; font-weight:bold; text-align: center;">Factions</div><div id="politics-legend-list"></div></div></div>
  <div id="map"></div>
  <div id="NormalOverlayButton"></div>
  <div id="PoliticalOverlayButton"></div>
  <div id="PoliticsLegendOverlayButton"></div>
  <div id="compass-open"></div>
  <div id="compass-closed"></div>
  </div>
</body>
</html>
