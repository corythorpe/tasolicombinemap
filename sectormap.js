var centreLat=0.0;
var centreLon=0.0;
var initialZoom=2;
var infoWindowIsOpen;
var planetsInSystems = [];
var polygons = [];
// for temporary storage of a sector name where needed
var tempSectorName;
//var infowindow = new google.maps.InfoWindow;
var imageWraps=false; //SET THIS TO false TO PREVENT THE IMAGE WRAPPING AROUND
var map; //the GMap3 itself
var gmicMapType;

function GMICMapType() {
    this.Cache = Array();
    this.opacity = 1.0;
}

GMICMapType.prototype.tileSize = new google.maps.Size(256, 256);
GMICMapType.prototype.maxZoom = 19;
GMICMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
  var c = Math.pow(2, zoom);
  var c = Math.pow(2, zoom);
  var tilex=coord.x,tiley=coord.y;
  if (imageWraps) {
    if (tilex<0) tilex=c+tilex%c;
    if (tilex>=c) tilex=tilex%c;
    if (tiley<0) tiley=c+tiley%c;
    if (tiley>=c) tiley=tiley%c;
  }
  else {
    if ((tilex<0)||(tilex>=c)||(tiley<0)||(tiley>=c)) {
      var blank = ownerDocument.createElement('DIV');
      blank.style.width = this.tileSize.width + 'px';
      blank.style.height = this.tileSize.height + 'px';
      return blank;
    }
  }
  var img = ownerDocument.createElement('IMG');
  var d = tilex;
  var e = tiley;
  var f = "t";
  for (var g = 0; g < zoom; g++) {
    c /= 2;
    if (e < c) {
        if (d < c) { f += "q" }
        else { f += "r"; d -= c }
    }
    else {
        if (d < c) { f += "t"; e -= c }
        else { f += "s"; d -= c; e -= c }
    }
  }
  img.id = "t_" + f;
  img.style.width = this.tileSize.width + 'px';
  img.style.height = this.tileSize.height + 'px';
  img.src = "2048-galaxy-tiles/"+f+".jpg";
  this.Cache.push(img);
  return img;
  }
GMICMapType.prototype.realeaseTile = function(tile) {
    var idx = this.Cache.indexOf(tile);
    if(idx!=-1) this.Cache.splice(idx, 1);
    tile=null;
}
//GMICMapType.prototype.name = "Image Cutter";
//GMICMapType.prototype.alt = "Image Cutter Tiles";
GMICMapType.prototype.setOpacity = function(newOpacity) {
    this.opacity = newOpacity;
    for (var i = 0; i < this.Cache.length; i++) {
        this.Cache[i].style.opacity = newOpacity; //mozilla
        this.Cache[i].style.filter = "alpha(opacity=" + newOpacity * 100 + ")"; //ie
    }
}
// Describe the Gall-Peters projection used by these tiles.
GMICMapType.prototype.projection = {
  fromLatLngToPoint: function(latLng) {
  var latRadians = latLng.lat() * Math.PI / 180;
  var xPerLng = 256/360;
  var yPerLat = 256/180;
  var x = (latLng.lng()+180)*xPerLng;
  var y = (latLng.lat()+90)*yPerLat;
  //console.log('Lng', latLng.lng(), 'Lat', latLng.lat(), '-> Point', x, y);
  return new google.maps.Point(x, y);
  //var latRadians = latLng.lat() * Math.PI / 180;
        //return new google.maps.Point(
        //    GALL_PETERS_RANGE_X * (0.5 + latLng.lng() / 360),
        //    GALL_PETERS_RANGE_Y * (0.5 - 0.5 * Math.sin(latRadians)));
  },
  fromPointToLatLng: function(point) {
  var xPerLng = 256/360;
  var yPerLat = 256/180;
  var lat = point.y/yPerLat-90;
  var lng = point.x/xPerLng-180;
  //console.log('Point', point.x, point.y, '-> Lng', lng, lat);
  return new google.maps.LatLng(lat, lng);

  //fromPointToLatLng: function(point, noWrap) {
  //var x = point.x / GALL_PETERS_RANGE_X;
        //var y = Math.max(0, Math.min(1, point.y / GALL_PETERS_RANGE_Y));

        //return new google.maps.LatLng(
        //    Math.asin(1 - 2 * y) * 180 / Math.PI,
        //    -180 + 360 * x,
        //    noWrap);
  }
    };

function getWindowHeight() {
    if (window.self&&self.innerHeight) {
        return self.innerHeight;
    }
    if (document.documentElement&&document.documentElement.clientHeight) {
        return document.documentElement.clientHeight;
    }
    return 0;
}

function resizeMapDiv() {
    //Resize the height of the div containing the map.

    //Do not call any map methods here as the resize is called before the map is created.
    var d=document.getElementById("map");

    var offsetTop=0;
    for (var elem=d; elem!=null; elem=elem.offsetParent) {
        offsetTop+=elem.offsetTop;

    }
    var height=getWindowHeight()-offsetTop-16;

    if (height>=0) {
        d.style.height=height+"px";
    }
}

// add URLs to sectorData
for (var i = 0; i < sectorData.length; i++) {
  if (sectorData[i] !== false) {
    if (sectorData[i] !== undefined && sectorData[i].hasOwnProperty("uid")) {
      sectorData[i]["URL"] = "https://www.swcombine.com/rules/?Galaxy_Map&sectorID=" + sectorData[i]["uid"].slice(3);
      if (sectorData[i] !== undefined && sectorData[i].hasOwnProperty("systems")) {
        if (sectorData[i]["systems"] !== undefined && sectorData[i]["systems"].hasOwnProperty("system")) {
          if (sectorData[i]["systems"]["system"] !== undefined && sectorData[i]["systems"]["system"].hasOwnProperty("0")) {
            // for sectors with an array of systems, put coordinates for the systems in this sector in the sector data for the system
            for(c = 0; c < systemData.length; c++){
              for(d = 0; d < sectorData[i]["systems"]["system"].length; d++){
                if(systemData[c]["name"] == sectorData[i]["systems"]["system"][d]["@attributes"]["name"]){
                  sectorData[i]["systems"]["system"][d]["@attributes"]["coordinates"] = {x: systemData[c]["coordinates"]["galaxy"]["@attributes"]["x"], y: systemData[c]["coordinates"]["galaxy"]["@attributes"]["y"]};
                }
              }
            }
            // for sectors with an array of systems, for each system add the URL attribute
            for (var s = 0; s < sectorData[i]["systems"]["system"].length; s++) {
              if (sectorData[i]["systems"]["system"][s] !== undefined && sectorData[i]["systems"]["system"][s].hasOwnProperty("@attributes")) {
                if (sectorData[i]["systems"]["system"][s]["@attributes"] !== undefined && sectorData[i]["systems"]["system"][s]["@attributes"].hasOwnProperty("uid")) {
                  sectorData[i]["systems"]["system"][s]["@attributes"]["URL"] = 'https://www.swcombine.com/rules/?Galaxy_Map&systemID=' + sectorData[i]["systems"]["system"][s]["@attributes"]["uid"].slice(2);
                  sectorData[i]["systems"]["system"][s]["@attributes"]["sector-url"] = sectorData[i]["URL"];
                }
              }
            }
          } else {
          // for sectors with only one system, do the same as the above
          if (sectorData[i]["systems"]["system"] !== undefined && sectorData[i]["systems"]["system"].hasOwnProperty("@attributes")) {
            if (sectorData[i]["systems"]["system"]["@attributes"] !== undefined && sectorData[i]["systems"]["system"]["@attributes"].hasOwnProperty("uid")) {
            sectorData[i]["systems"]["system"]["@attributes"]["URL"] = 'https://www.swcombine.com/rules/?Galaxy_Map&systemID=' + sectorData[i]["systems"]["system"]["@attributes"]["uid"].slice(2);
            sectorData[i]["systems"]["system"]["@attributes"]["sector-url"] = sectorData[i]["URL"];
            for(c = 0; c < systemData.length; c++){
              if(systemData[c]["name"] == sectorData[i]["systems"]["system"]["@attributes"]["name"]){
                sectorData[i]["systems"]["system"]["@attributes"]["coordinates"] = {x: systemData[c]["coordinates"]["galaxy"]["@attributes"]["x"], y: systemData[c]["coordinates"]["galaxy"]["@attributes"]["y"]};
              }
            }
            }
          }
          }
        }
      }
    }
  }
}

// political overaly button
function EnablePolitical(politicalDiv, map) {

  // Set CSS for the control border.
  var politicalUI = document.createElement('div');
  politicalUI.style.backgroundColor = '#fff';
  politicalUI.style.border = '2px solid #fff';
  politicalUI.style.borderRadius = '3px';
  politicalUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  politicalUI.style.cursor = 'pointer';
  politicalUI.style.marginBottom = '10px';
  politicalUI.style.textAlign = 'center';
  politicalUI.style.marginLeft = '10px';
  politicalUI.style.marginTop = '10px';
  politicalUI.title = 'Click to enable political overlay';
  politicalDiv.appendChild(politicalUI);

  // Set CSS for the control interior.
  var politicalText = document.createElement('div');
  politicalText.style.color = 'rgb(25,25,25)';
  politicalText.style.fontFamily = 'Roboto,Arial,sans-serif';
  politicalText.style.fontSize = '16px';
  politicalText.style.lineHeight = '38px';
  politicalText.style.paddingLeft = '5px';
  politicalText.style.paddingRight = '5px';
  politicalText.innerHTML = '<div class="gButtonLong">Political Overlay</div><div class="gButtonShort">Political</div>';
  politicalUI.appendChild(politicalText);

  // Setup the click event listeners: simply set the map to Chicago.
  politicalUI.addEventListener('click', function() {
    document.getElementById('politics-legend').style.display = "none";
    // turn on the normal overlay button when normal is clicked
    document.getElementById('PoliticsLegendOverlayButton').style.display = "block";
    // turn on the normal overlay button when politics is clicked
    document.getElementById('NormalOverlayButton').style.display = "block";
    // turn off the politics button when it is pressed
    document.getElementById('PoliticalOverlayButton').style.display = "none";
    // for all sectors, check their faction then look up that faction's color and re-color the sector according to the faction's color
    for (c = 0; c < sectorData.length; c++){
      if (window[sectorData[c]["name"]] !== undefined) {
        if (window[sectorData[c]["name"]]["factionColor"] !== undefined && window[sectorData[c]["name"]]["factionColor"] !== "") {
          window[sectorData[c]["name"]].setOptions({fillColor:'rgb('+window[sectorData[c]["name"]]["factionColor"][0]+','+window[sectorData[c]["name"]]["factionColor"][1]+','+window[sectorData[c]["name"]]["factionColor"][2]+')', fillOpacity: .5});
        }
      }
    }
  });
}

// normal overlay button
function NormalOverlay(normalOverlayDiv, map) {

  // Set CSS for the control border.
  var normalUI = document.createElement('div');
  normalUI.style.backgroundColor = '#fff';
  normalUI.style.border = '2px solid #fff';
  normalUI.style.borderRadius = '3px';
  normalUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  normalUI.style.cursor = 'pointer';
  normalUI.style.marginBottom = '10px';
  normalUI.style.textAlign = 'center';
  normalUI.style.marginLeft = '10px';
  normalUI.style.marginTop = '10px';
  normalUI.title = 'Click to enable normal overlay';
  normalOverlayDiv.appendChild(normalUI);

  // Set CSS for the control interior.
  var normalOverlayText = document.createElement('div');
  normalOverlayText.style.color = 'rgb(25,25,25)';
  normalOverlayText.style.fontFamily = 'Roboto,Arial,sans-serif';
  normalOverlayText.style.fontSize = '16px';
  normalOverlayText.style.lineHeight = '38px';
  normalOverlayText.style.paddingLeft = '5px';
  normalOverlayText.style.paddingRight = '5px';
  normalOverlayText.innerHTML = '<div class="gButtonLong">Normal Overlay</div><div class="gButtonShort">Normal</div>';
  normalUI.appendChild(normalOverlayText);

  // Setup the click event listeners: simply set the map to Chicago.
  normalUI.addEventListener('click', function() {
    document.getElementById('politics-legend').style.display = "none";
    // turn on the politics button when normal is pressed
    document.getElementById('PoliticalOverlayButton').style.display = "block";
    // turn off the politics legend button when normal is pressed
    document.getElementById('PoliticsLegendOverlayButton').style.display = "none";
    // turn off the normal overlay button when normal is clicked
    document.getElementById('NormalOverlayButton').style.display = "none";
    // for all sectors, check their faction then look up that faction's color and re-color the sector according to the faction's color
    for (c = 0; c < sectorData.length; c++){
      if (sectorData[c] !== false) {
        if (window[sectorData[c]["name"]] !== undefined) {
          if (sectorData[c] !== undefined && sectorData[c].hasOwnProperty("colour")) {
            if (sectorData[c]["colour"] !== undefined && sectorData[c]["colour"].hasOwnProperty("r")) {
              if (sectorData[c]["colour"].hasOwnProperty("r") !== undefined) {
                window[sectorData[c]["name"]].setOptions({fillColor: 'rgb('+sectorData[c].colour["r"]+','+sectorData[c].colour["g"]+','+sectorData[c].colour["b"]+')', fillOpacity: .15});
              }
            }
          }
        }
      }
    }
  });
}

// politics legend button
function PoliticsLegendButton(politicsLegendDiv, map) {

  // Set CSS for the control border.
  var politicslegendUI = document.createElement('div');
  politicslegendUI.style.backgroundColor = '#fff';
  politicslegendUI.style.border = '2px solid #fff';
  politicslegendUI.style.borderRadius = '3px';
  politicslegendUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  politicslegendUI.style.cursor = 'pointer';
  politicslegendUI.style.marginBottom = '10px';
  politicslegendUI.style.textAlign = 'center';
  politicslegendUI.style.marginLeft = '10px';
  politicslegendUI.style.marginTop = '0px';
  politicslegendUI.title = 'Click to enable the politics legend';
  politicsLegendDiv.appendChild(politicslegendUI);

  // Set CSS for the control interior.
  var politicslegendtext = document.createElement('div');
  politicslegendtext.style.color = 'rgb(25,25,25)';
  politicslegendtext.style.fontFamily = 'Roboto,Arial,sans-serif';
  politicslegendtext.style.fontSize = '16px';
  politicslegendtext.style.lineHeight = '38px';
  politicslegendtext.style.paddingLeft = '5px';
  politicslegendtext.style.paddingRight = '5px';
  politicslegendtext.innerHTML = '<div class="gButtonLong">Politics Legend</div><div class="gButtonShort">Legend</div>';
  politicslegendUI.appendChild(politicslegendtext);

  // Setup the click event listeners: simply set the map to Chicago.
  politicslegendUI.addEventListener('click', function() {
    if (document.getElementById('politics-legend').style.display == "none") {
      document.getElementById('politics-legend').style.display = "block";
      document.getElementById('politics-legend-list').style.display = "block";
    } else {
      if (document.getElementById('politics-legend').style.display == "block") {
        document.getElementById('politics-legend').style.display = "none";
        document.getElementById('politics-legend-list').style.display = "none";
      }
    }
  });
}

// compass open
function CompassOpen(enableCompassOpenDiv, map) {

  // Set CSS for the control border.
  var compassOpenUI = document.createElement('div');
  compassOpenUI.style.backgroundColor = '#fff';
  compassOpenUI.style.border = '2px solid #fff';
  compassOpenUI.style.borderRadius = '3px 3px 0 0';
  compassOpenUI.style.cursor = 'pointer';
  compassOpenUI.style.marginBottom = '0px';
  compassOpenUI.style.textAlign = 'center';
  compassOpenUI.style.marginRight = '10px';
  compassOpenUI.style.marginTop = '0px';
  compassOpenUI.title = 'Click to close the coordinates';
  enableCompassOpenDiv.appendChild(compassOpenUI);

  // Set CSS for the control interior.
  var compassOpenText = document.createElement('div');
  compassOpenText.style.color = 'rgb(25,25,25)';
  compassOpenText.style.fontFamily = 'Roboto,Arial,sans-serif';
  compassOpenText.style.fontSize = '10px';
  compassOpenText.style.lineHeight = '14px';
  compassOpenText.style.paddingLeft = '3px';
  compassOpenText.style.paddingRight = '3px';
  compassOpenText.innerHTML = 'X';
  compassOpenUI.appendChild(compassOpenText);

  // Setup the click event listeners: simply set the map to Chicago.
  compassOpenUI.addEventListener('click', function() {
      document.getElementById('coords').style.display = "none";
      document.getElementById('compass-open').style.display = "none";
      document.getElementById('compass-closed').style.display = "block";
  });
}

// compass closed
function CompassClosed(enableCompassClosedDiv, map) {

  // Set CSS for the control border.
  var compassClosedUI = document.createElement('div');
  compassClosedUI.style.backgroundColor = '#fff';
  compassClosedUI.style.borderRadius = '3px';
  compassClosedUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  compassClosedUI.style.cursor = 'pointer';
  compassClosedUI.style.marginBottom = '10px';
  compassClosedUI.style.textAlign = 'center';
  document.getElementById('compass-closed').style.backgroundImage = 'url("compass.png")';
  compassClosedUI.style.marginTop = '0px';
  compassClosedUI.title = 'Click to enable the coordinates';
  enableCompassClosedDiv.appendChild(compassClosedUI);

  // Set CSS for the control interior.
  var compassClosedText = document.createElement('div');
  compassClosedText.style.color = 'rgb(25,25,25)';
  compassClosedText.style.fontFamily = 'Roboto,Arial,sans-serif';
  compassClosedText.style.fontSize = '16px';
  compassClosedText.style.width = '30px';
  compassClosedText.style.height = '30px';
  compassClosedText.innerHTML = '<button id="compass-closed-button"><img src="compass.png" width="28px" height="28px"></button>';
  compassClosedUI.appendChild(compassClosedText);

  // Setup the click event listeners: simply set the map to Chicago.
  compassClosedUI.addEventListener('click', function() {
      document.getElementById('coords').style.display = "block";
      document.getElementById('compass-open').style.display = "block";
      document.getElementById('compass-closed').style.display = "none";
  });
}



    function initMap() {
      resizeMapDiv();
      var latlng = new google.maps.LatLng(centreLat, centreLon);
      var myOptions = {
          zoom: initialZoom,
          minZoom: 2,
          maxZoom: 4,
          center: latlng,
          panControl: true,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: false,
          streetViewControl: false,
          overviewMapControl: true,
          mapTypeControlOptions: { mapTypeIds: ["ImageCutter"] },
          mapTypeId: "ImageCutter"
      }
      map = new google.maps.Map(document.getElementById("map"), myOptions);
      gmicMapType = new GMICMapType();
      map.mapTypes.set('gallPeters', gmicMapType);
      map.setMapTypeId('gallPeters');

      // Show the lat and lng under the mouse cursor.
      var coordsDiv = document.getElementById('coords');
      map.controls[google.maps.ControlPosition.RIGHT_TOP].push(coordsDiv);
      map.addListener('mousemove', function(event) {
        coordsDiv.innerHTML =
            'Star Wars Combine Galaxy Coordinates<br> <div class="coordinates" > X: ' + Math.round(event.latLng.lng()*5.6) + ', ' +
            'Y: ' + (-Math.round(event.latLng.lat()*11.5)) + '</div> <div class="warning">APPROXIMATE NOT FOR HYPERSPACE</style></div>';
      });

      // enable the political button
      var enablePoliticalDiv = document.getElementById('PoliticalOverlayButton');
      var politicalDiv = new EnablePolitical(enablePoliticalDiv, map);
      enablePoliticalDiv.index = 2;
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(enablePoliticalDiv);

      // enable the normal overlay button
      var enableNormalOverlayDiv = document.getElementById('NormalOverlayButton');
      var normalOverlayDiv = new NormalOverlay(enableNormalOverlayDiv, map);
      enableNormalOverlayDiv.index = 2;
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(enableNormalOverlayDiv);

      // enable the politics legend button
      var enablePoliticsLegendUIDiv = document.getElementById('PoliticsLegendOverlayButton');
      var politicsLegendDiv = new PoliticsLegendButton(enablePoliticsLegendUIDiv, map);
      enablePoliticsLegendUIDiv.index = 1;
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(enablePoliticsLegendUIDiv);

      // enable the compass open div
      var enableCompassOpenDiv = document.getElementById('compass-open');
      var compassOpenDiv = new CompassOpen(enableCompassOpenDiv, map);
      enableCompassOpenDiv.index = 1;
      map.controls[google.maps.ControlPosition.RIGHT_TOP].push(enableCompassOpenDiv);

      // enable the compass closed div
      var enableCompassClosedDiv = document.getElementById('compass-closed');
      var compassClosedDiv = new CompassClosed(enableCompassClosedDiv, map);
      enableCompassClosedDiv.index = 1;
      map.controls[google.maps.ControlPosition.RIGHT_TOP].push(enableCompassClosedDiv);

      for (var s = 0; s < sectorData.length; s++) {
        if (sectorData[s] !== false && sectorData[s] !== undefined) {
          let sectorXCoords = [];
          let sectorYCoords = [];
          let sectorName = sectorData[s].name;
          // sectorName = sectorName.replace("&#039;", "'");
          // sectorData[s]["name"] = sectorData[s]["name"].replace("&#039;","'");
          let sectorTitle = sectorData[s].name;
          let sectorURL = sectorData[s]["URL"];
          let knownSystems = '';
          if (sectorData[s] !== false) {
            if (sectorData[s] !== undefined && sectorData[s].hasOwnProperty("systems")) {
              if (sectorData[s]["systems"] !== undefined && sectorData[s]["systems"].hasOwnProperty("system")) {
              var sectorX = 0;
              var sectorY = 0;
                if (sectorData[s]["systems"]["system"] !== undefined && sectorData[s]["systems"]["system"].hasOwnProperty("0")) {
                  // for sectors with an array of systems
                  for (var k = 0; k < sectorData[s]["systems"]["system"].length; k++) {
                    // for sectors with an array of systems, put the coordinates of the systems in the sector x,y variables
                    if(sectorData[s]["systems"]["system"][k]["@attributes"].hasOwnProperty("coordinates")){
                      sectorX = sectorData[s]["systems"]["system"][k]["@attributes"]["coordinates"]["x"];
                      sectorY = sectorData[s]["systems"]["system"][k]["@attributes"]["coordinates"]["y"];
                    }
                    // grab the URL and name of the system and add it to the knownSystems value for the sector
                    let url = sectorData[s]["systems"]["system"][k]["@attributes"]["URL"];
                    let name = sectorData[s]["systems"]["system"][k]["@attributes"]["name"];
                    knownSystems += '<li><a target="_blank" href="'+url+'">'+name+'</a> <div class="system-list-goto"><a target="_blank" href="https://www.swcombine.com/members/cockpit/travel/directed.php?travelClass=2&supplied=1&galX='+sectorX+'&galY='+sectorY+'"><img src="goto.jpeg"></a></div></li>';
                  }
                } else {
                // do all of the above for sectors with one system
                if (sectorData[s]["systems"]["system"] !== undefined && sectorData[s]["systems"]["system"].hasOwnProperty("@attributes")) {
                  // do same as above for sectors with only one system
                  if(sectorData[s]["systems"]["system"]["@attributes"].hasOwnProperty("coordinates")){
                    sectorX = sectorData[s]["systems"]["system"]["@attributes"]["coordinates"]["x"];
                    sectorY = sectorData[s]["systems"]["system"]["@attributes"]["coordinates"]["y"];
                  }
                  url = sectorData[s]["systems"]["system"]["@attributes"]["URL"];
                  name = sectorData[s]["systems"]["system"]["@attributes"]["name"];
                  knownSystems += '<li><a target="_blank" href="'+url+'">'+name+'</a> <div class="system-list-goto"><a target="_blank" href="https://www.swcombine.com/members/cockpit/travel/directed.php?travelClass=2&supplied=1&galX='+sectorX+'&galY='+sectorY+'"><img src="goto.jpeg"></a></div></li>';
                }
                }
              }
            }
          }
          let controlledBy = sectorData[s]["controlled-by"][0];
          let factionURL = '';
          let factionColor = '';
          // for all sectors, check their faction then look up that faction's color and re-color the sector according to the faction's color
          if (sectorData[s] !== false) {
            if (sectorData[s] !== undefined && sectorData[s].hasOwnProperty("controlled-by")) {
              if (sectorData[s]["controlled-by"].hasOwnProperty("0") == false){
                factionColor = [0,0,0];
                factionURL = "https://www.swcombine.com";
              } else {
                if (sectorData[s]["controlled-by"] !== undefined && sectorData[s]["controlled-by"].hasOwnProperty("0")) {
                  for (f = 0; f < factionData.length; f++) {
                    if (controlledBy == factionData[f]["name"]) {
                      factionColor = [factionData[f]["colour"]["r"],factionData[f]["colour"]["g"],factionData[f]["colour"]["b"]];
                      factionData[f]["TotalOwnedSectors"] += 1;
                      if (typeof(factionData[f]["homepage"]) !== "object") {
                        factionURL = factionData[f]["homepage"];
                      } else {
                        factionURL = "https://www.swcombine.com";
                        factionData[f]["homepage"] = "https://www.swcombine.com";
                      }
                    }
                  }
                }
              }
            }
          }
          let sectorR = sectorData[s].colour["r"];
          let sectorG = sectorData[s].colour["g"];
          let sectorB = sectorData[s].colour["b"];
          let sectorColor = rgbToHex(sectorR,sectorG,sectorB);

          // delete this after fixing y coordinate problem
          let unNormalizedYArray = [];



          // Define the LatLng coordinates for the polygon's path.
          for (var i = 0; i < sectorData[s].coordinates["point"].length; i++) {
            let swcX = getX(s, i);
            let swcY = getY(s, i);
            let MapX = swcXToMapX(swcX);
            let MapY = swcYToMapY(swcY);
            //delete this after fixing y coordinate problem
            let unNormalizedY = Math.round(swcYToMapY(swcY));
            sectorXCoords.push(MapX);
            sectorYCoords.push(MapY);
            unNormalizedYArray.push(unNormalizedY);
          }


          let xCoordAvg = Math.round((sectorXCoords.reduce(function(a, b){
            return a + b;
          }, 0))/(sectorXCoords.length));

          let yCoordAvg = Math.round((unNormalizedYArray.reduce(function(a, b){
            return a + b;
          }, 0))/(unNormalizedYArray.length));

          let sectorCenterPointX = xCoordAvg;
          let sectorCenterPointY = yCoordAvg;

          // Combine coordinates into array
          let sectorCoords = [];
          for (var i = 0; i < sectorXCoords.length; i++) {
            sectorCoords.push({lat: sectorYCoords[i], lng: sectorXCoords[i]});
          }

          // Construct the sector outline.
          window[sectorName] = new google.maps.Polygon({
            name: sectorTitle,
            infoWindowPointX: sectorCenterPointX,
            infoWindowPointY: sectorCenterPointY,
            knownSystems: knownSystems,
            factionColor: factionColor,
            factionURL: factionURL,
            paths: sectorCoords,
            numInArray: s,
            entityType: "sector",
            strokeColor: sectorColor,
            strokeOpacity: 1,
            strokeWeight: 0.8,
            zIndex: 1,
            fillColor: 'rgb('+sectorData[s].colour["r"]+','+sectorData[s].colour["g"]+','+sectorData[s].colour["b"]+')',
            fillOpacity: .15
          });

          var infowindow = new google.maps.InfoWindow;
          google.maps.event.addListener(window[sectorName], 'click', function(event) {
            if (infoWindowIsOpen) {
              infoWindowIsOpen.close();
            }
            let controlledByFaction = "Not Controlled By a Faction";
            if (controlledBy !== undefined){controlledByFaction = controlledBy};
            let knownSystemsInSector = "<li>No known systems</li>";
            if (knownSystems !== ""){knownSystemsInSector = knownSystems};
            infowindow.setContent('<div style="font-weight: bold; font-size: 18px"><a target="_blank" href="' + sectorURL + '">' + sectorTitle + '</a></div>' + 'Controlled by: <a target="_blank" href="'+factionURL+'">' + controlledByFaction +'</a><br><br><div class="system-list">Known Systems:<br><ul>'+knownSystemsInSector+'</ul></div>');
            infowindow.setPosition(event.latLng);
            infoWindowIsOpen = infowindow;
            infowindow.open(map);
          });

          google.maps.event.addListener(window[sectorName], 'mousemove', function(event) {
            coordsDiv.innerHTML =
                'Star Wars Combine Galaxy Coordinates<br> <div class="coordinates"> X: ' + Math.round(event.latLng.lng()*5.6) + ', ' +
                'Y: ' + (-Math.round(event.latLng.lat()*11.5)) + '</div> <div class="warning">APPROXIMATE NOT FOR HYPERSPACE</style>';
          });

          polygons.push(window[sectorName]);
          window[sectorName].setMap(map);
        }
      }


    // Create the politics legend
    var politicsLegendDiv = document.getElementById('politics-legend');
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(politicsLegendDiv);

    // create the content for the politics legend
    document.getElementById('politics-legend-list').innerHTML += '<ul>';
    for (f = 0; f < factionData.length; f++) {
      if (factionData[f] !== undefined && factionData[f].hasOwnProperty("TotalOwnedSectors") && factionData[f]["TotalOwnedSectors"] !== undefined && factionData[f]["TotalOwnedSectors"] > 0 && (factionData[f]["colour"]["r"]+factionData[f]["colour"]["g"]+factionData[f]["colour"]["b"]) !== "000") {
        // politicsLegendDiv.innerHTML += '<li><div class="politics-legend"><input type="text" value="'+factionData[f]["name"]+'" /><div class="color-box" style="background-color: rgb('+factionData[f]["colour"]["r"]+','+factionData[f]["colour"]["g"]+','+factionData[f]["colour"]["b"]+');"></div></div></li>';
        document.getElementById('politics-legend-list').innerHTML += '<li><div class="politics-legend-item"><div class="legend-color" style="background-color: rgb('+factionData[f]["colour"]["r"]+','+factionData[f]["colour"]["g"]+','+factionData[f]["colour"]["b"]+')"></div><a target="_blank" href="'+factionData[f]["homepage"]+'">'+factionData[f]["name"]+'</a></div></li>';
      }
    }
    document.getElementById('politics-legend-list').innerHTML += '</ul>';

    // close infowindow when click is anywhere on map not on a polygon
    map.addListener('click', function() { if (infoWindowIsOpen) infoWindowIsOpen.close(); });




    // add infoWindowPointX, infoWindowPointY, and numInArray to systems
    for (var i = 0; i < systemData.length; i++) {
      if (systemData[i] !== false && systemData[i] !== undefined) {
        systemData[i]["URL"] = "https://www.swcombine.com/rules/?Galaxy_Map&systemID=" + systemData[i]["uid"].slice(2);
        systemData[i]["infoWindowPointX"] = swcXToMapX(systemData[i]["coordinates"]["galaxy"]["@attributes"]["x"]);
        systemData[i]["infoWindowPointY"] = swcYToMapY(systemData[i]["coordinates"]["galaxy"]["@attributes"]["y"]);
        systemData[i]["numInArray"] = i;
        systemData[i]["entityType"] = "system";
        systemData[i]["sector-url"] = "https://www.swcombine.com/rules/?Galaxy_Map&sectorID=" + systemData[i]["sector"]["@attributes"]["uid"].slice(3);
          if (systemData[i].hasOwnProperty("planets")) {
            if (systemData[i]["planets"] !== undefined && systemData[i]["planets"].hasOwnProperty("planet")) {
              if (systemData[i]["planets"]["planet"] !== undefined && systemData[i]["planets"]["planet"].hasOwnProperty("0")) {
                // for each system add the URL attribute
                for (var s = 0; s < systemData[i]["planets"]["planet"].length; s++) {
                  if (systemData[i]["planets"]["planet"][s] !== undefined && systemData[i]["planets"]["planet"][s].hasOwnProperty("@attributes")) {
                    if (systemData[i]["planets"]["planet"][s]["@attributes"] !== undefined && systemData[i]["planets"]["planet"][s]["@attributes"].hasOwnProperty("uid")) {
                      systemData[i]["planets"]["planet"][s]["@attributes"]["URL"] = 'https://www.swcombine.com/rules/?Galaxy_Map&planetID=' + systemData[i]["planets"]["planet"][s]["@attributes"]["uid"].slice(2);
                      planetsInSystems.push({"name":systemData[i]["planets"]["planet"][s]["@attributes"]["name"],"uid":systemData[i]["planets"]["planet"][s]["@attributes"]["uid"], "URL":systemData[i]["planets"]["planet"][s]["@attributes"]["URL"],"system":systemData[i]["name"],"sector":systemData[i]["sector"]["@attributes"]["name"],"infoWindowPointX":swcXToMapX(systemData[i]["coordinates"]["galaxy"]["@attributes"]["x"]),"infoWindowPointY":swcYToMapY(systemData[i]["coordinates"]["galaxy"]["@attributes"]["y"]),"entityType":"planet","system-url":systemData[i]["URL"],"sector-url":systemData[i]["sector-url"], "system-coordinates":{x:systemData[i]["coordinates"]["galaxy"]["@attributes"]["x"],y:systemData[i]["coordinates"]["galaxy"]["@attributes"]["y"]}});
                    }
                  } else {
                    if (systemData[i]["planets"]["planet"] !== undefined && systemData[i]["planets"]["system"].hasOwnProperty("@attributes")) {
                      if (systemData[i]["planets"]["planet"]["@attributes"] !== undefined && systemData[i]["planets"]["system"].hasOwnProperty("uid")) {
                      systemData[i]["planets"]["planet"]["@attributes"]["URL"] = 'https://www.swcombine.com/rules/?Galaxy_Map&systemID=' + systemData[i]["planets"]["planet"]["@attributes"]["uid"].slice(2);
                      planetsInSystems.push({"name":systemData[i]["planets"]["planet"]["@attributes"]["name"],"uid":systemData[i]["planets"]["planet"]["@attributes"]["uid"], "URL":systemData[i]["planets"]["planet"]["@attributes"]["URL"],"system":systemData[i]["name"],"sector":systemData[i]["sector"]["@attributes"]["name"],"infoWindowPointX":swcXToMapX(systemData[i]["coordinates"]["galaxy"]["@attributes"]["x"]),"infoWindowPointY":swcYToMapY(systemData[i]["coordinates"]["galaxy"]["@attributes"]["y"]),"entityType":"planet","system-url":systemData[i]["URL"],"sector-url":systemData[i]["sector-url"], "system-coordinates":{x:systemData[i]["coordinates"]["galaxy"]["@attributes"]["x"],y:systemData[i]["coordinates"]["galaxy"]["@attributes"]["y"]}});
                      }
                    }
                  }
                }
              }
            }
          }
      }
    }

    // assign each planet the numInArray value of its number in the array for use later
    for (p = 0; p < planetsInSystems.length; p++){
      planetsInSystems[p]["numInArray"] = p;
    }

    // add infoWindowPointX, infoWindowPointY, and numInArray to planets
    // for (var i = 0; i < planetData.length; i++) {
    //   if (planetData[i] !== false && planetData[i] !== undefined) {
    //     planetData[i]["URL"] = "https://www.swcombine.com/rules/?Galaxy_Map&planetID=" + planetData[i]["uid"].slice(2);
    //     planetData[i]["infoWindowPointX"] = swcXToMapX(planetData[i]["coordinates"]["galaxy"]["@attributes"]["x"]);
    //     planetData[i]["infoWindowPointY"] = swcYToMapY(planetData[i]["coordinates"]["galaxy"]["@attributes"]["y"]);
    //     planetData[i]["numInArray"] = i;
    //     planetData[i]["entityType"] = "planet";
    //     }
    // }


    // end of InitMap()
    }



    // create the TotalOwnedSectors value for each faction and set it to 0
    for (s = 0; s < factionData.length; s++) {
      if (factionData[s] !== undefined && factionData[s].hasOwnProperty("name")) {
        if (factionData[s]["name"] !== undefined) {
          factionData[s]["TotalOwnedSectors"] = 0;
        }
      }
    }

    // normalize the name searched so it can be found in the sector JSON
    function normalizeName(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(function(word) {
            return word[0].toUpperCase() + word.substr(1);
        })
        .join(' ')
        .split('-')
        .map(function(word) {
            return word[0].toUpperCase() + word.substr(1);
        })
        .join('-');
     }


     // convert rgb value
    function rgbToHex(r, g, b) {
      r = r.toString(16);
      g = g.toString(16);
      b = b.toString(16);

      if (r.length == 1) {
        r = "0" + r;
      }
      if (g.length == 1) {
        g = "0" + g;
      }
      if (b.length == 1) {
        b = "0" + b;
      }

      return "#" + r + g + b;
    }

    // retrieve the x coordinate value from the array for the given sector and coordinate pair number
    function getX (sectorNum, pointNum) {
      let x = sectorData[sectorNum].coordinates["point"][pointNum]["@attributes"].x;
      x = parseFloat(x);
      return x;
    }

    // retrieve the y coordinate value from the array for the given sector and coordinate pair number
    function getY (sectorNum, pointNum) {
      let y = sectorData[sectorNum].coordinates["point"][pointNum]["@attributes"].y;
      y = parseFloat(y);
      return y;
    }

    // convert Star Wars Combine's map X to my map's X for 1024 map
    function swcXToMapX (swcX) {
      let MapX;
      if (swcX <= 0){
        MapX = (swcX/5.7);
      } else {
        MapX = (swcX/5.65);
      }
      return MapX;
    }

    // convert Star Wars Combine's map Y to my map's Y for 1024 map
    function swcYToMapY (swcY) {
      let MapY = -(swcY/11.39);
      return MapY;
    }

    // create a new infoWindow
    function newInfoWindow (name, type, numInArray, windowX, windowY) {
      if(infoWindowIsOpen) infoWindowIsOpen.close();
      windowPointX = parseFloat(windowX);
      windowPointY = parseFloat(windowY);
      let windowPoint = {lat: windowPointY, lng: windowPointX};
      var infowindow = new google.maps.InfoWindow;
      if(type == "sector"){
        let controlledByFaction = "Not Controlled By a Faction";
        if (sectorData[numInArray]["controlled-by"][0] !== undefined) {controlledByFaction = sectorData[numInArray]["controlled-by"][0]};
        let knownSystemsInSector = "<li>No known systems</li>";
        if (window[name]["knownSystems"] !== undefined){knownSystemsInSector = window[name]["knownSystems"]};
        infowindow.setContent('<div style="font-weight: bold; font-size: 18px"><a target="_blank" href="' + sectorData[numInArray]["URL"] + '">' + sectorData[numInArray].name + '</a></div>' + 'Controlled by: <a target="_blank" href="' + window[name]["factionURL"] + '">' + controlledByFaction + '</a><br><br><div class="system-list">Known Systems:<br><ul>' + knownSystemsInSector + '</ul></div>');
      }
      if(type == "system"){
        let planets = "";
        let planetName = "";
        let planetUID = "";
        let controlledBy = "Not Controlled by a Faction";
        let controlledByURL = "https://www.swcombine.com/";
        let systemX = "";
        let systemY = "";
        for(p = 0; p < systemData[numInArray]["planets"]["planet"].length; p++){
          if (systemData[numInArray]["planets"] !== false && systemData[numInArray]["planets"].hasOwnProperty("planet") && systemData[numInArray]["planets"]["planet"].hasOwnProperty("0")){
            planetName = systemData[numInArray]["planets"]["planet"][p]["@attributes"]["name"];
            planetUID = systemData[numInArray]["planets"]["planet"][p]["@attributes"]["uid"].slice(2);
            planets += '<li><a target="_blank" href="https://www.swcombine.com/rules/?Galaxy_Map&planetID=' + planetUID + '">' + planetName + '</a></li>';
          } else {
            if (systemData[numInArray]["planets"] !== false && systemData[numInArray]["planets"].hasOwnProperty("planet") && systemData[numInArray]["planets"]["planet"].hasOwnProperty("@attributes")){
              planetName = systemData[numInArray]["planets"]["planet"]["@attributes"]["name"];
              planetUID = systemData[numInArray]["planets"]["planet"]["@attributes"]["uid"].slice(2);
              planets += '<li><a target="_blank" href="https://www.swcombine.com/rules/?Galaxy_Map&planetID=' + planetUID + '">' + planetName + '</a></li>';
            }
          }
        }
        if (systemData[numInArray]["controlled-by"].hasOwnProperty("0") == true){
          controlledBy = systemData[numInArray]["controlled-by"][0];
          controlledByURL = 'https://www.swcombine.com/community/factions.php?facName=' + systemData[numInArray]["controlled-by"]["@attributes"]["uid"].slice(3);
        }
        if (systemData[numInArray]["coordinates"] !== undefined){
          systemX = systemData[numInArray]["coordinates"]["galaxy"]["@attributes"]["x"];
          systemY = systemData[numInArray]["coordinates"]["galaxy"]["@attributes"]["y"];
        }
        infowindow.setContent('<div class="system-title"><a target="_blank" href="' + systemData[numInArray]["URL"] + '">' + systemData[numInArray].name + '</a></div> <div class="system-goto"><a target="_blank" href="https://www.swcombine.com/members/cockpit/travel/directed.php?travelClass=2&supplied=1&galX='+systemX+'&galY='+systemY+'"><img src="goto.jpeg"></a></div> <div class="system-sector">Sector: <a target="_blank" href="https://www.swcombine.com/rules/?Galaxy_Map&sectorID=' + systemData[numInArray]["sector"]["@attributes"]["uid"].slice(3) + '">' + systemData[numInArray]["sector"]["@attributes"]["name"] + '</a></div>' + 'Controlled by: <a target="_blank" href="' + controlledByURL + '">' + controlledBy + '</a><br><br>Known Planets:<br><ul>' + planets + '</ul>');
      }
      if(type == "planet"){
        infowindow.setContent('<div class="planet-title"><a target="_blank" href="' + planetsInSystems[numInArray]["URL"] + '">' + planetsInSystems[numInArray].name + '</a></div> <div class="planet-system-list">System: <a target="_blank" href="' + planetsInSystems[numInArray]["system-url"] + '">' + planetsInSystems[numInArray]["system"] + '</a></div> <div class="system-list-goto"><a target="_blank" href="https://www.swcombine.com/members/cockpit/travel/directed.php?travelClass=2&supplied=1&galX='+planetsInSystems[numInArray]["system-coordinates"]["x"]+'&galY='+planetsInSystems[numInArray]["system-coordinates"]["y"]+'"><img src="goto.jpeg"></a></div><br><div class="sector-list">Sector: <a target="_blank" href="' + planetsInSystems[numInArray]["sector-url"] + '">' + planetsInSystems[numInArray]["sector"] + '</a></div>');
      }
      infowindow.setPosition(windowPoint);
      infowindow.open(map);
      infoWindowIsOpen = infowindow;
    }

    // search the polygon json
    function searchPolygons(elem) {
      // var searchText = normalizeName(elem.value);
      var searchText = elem.value.toLowerCase();
      if (searchText == ""){searchText = "]"};
      if (searchText == "*" || searchText == "All"){searchText = ""};
      if(searchText.indexOf("'")>=0){searchText = searchText.replace("'","&#039;")};
      let polygonResults = polygons.filter(function(val, index){
        let lowerCase = val.name.toLowerCase();
        if(lowerCase.indexOf(searchText)>=0) {
          return true;
        }
      });
      // for (i = 0; i < polygonResults.length; i++){
      // // if(polygonResults[i] == "D'Aelgoth"){polygonResults[i] = "D&#039;Aelgoth"}};
      //   // if(polygonResults[i].name.indexOf("'")>=0){
      //   //   console.log(polygonResults[i].name);
      //   //   polygonResults[i].name = polygonResults[i].name.replace("'","&#039;")
      //   // }
      // };
        var results = polygonResults;
        let systemResults = systemData.filter(function(val, index){
          let lowerCase = val.name.toLowerCase();
          if(lowerCase.indexOf(searchText)>=0) {
            return true;
          }
      });
      systemResults = systemResults.filter(function(val, index){
        if(val.name.indexOf("(system)") == -1) {
          val.name = val.name.replace(val.name, val.name + " (system)");
          return true;
        } else {
          return true;
        }
      });
      results = results.concat(systemResults);
      let planetResults = planetsInSystems.filter(function(val, index){
        let lowerCase = val.name.toLowerCase();
        if(lowerCase.indexOf(searchText)>=0) {
          return true;
        }
        // let lowerCase = val.name.toLowerCase();
        // if(lowerCase.indexOf(searchText)>=0) {
        //   return true;
        // }
      });
      planetResults = planetResults.filter(function(val, index){
        if(val.name.indexOf("(planet)") == -1) {
          val.name = val.name.replace(val.name, val.name + " (planet)");
          return true;
        } else {
          return true;
        }
      });
      results = results.concat(planetResults);
      var searchHTML = "<ul>";
      var item;
      for(var i=0; i<results.length;i++) {
        item = results[i];
        searchHTML += "<li><a href='javascript: newInfoWindow(\""+item.name+"\",\""+item.entityType+"\",\""+item.numInArray+"\",\""+item.infoWindowPointX+"\",\""+item.infoWindowPointY+"\");'>"+item.name+"</a></li>";
      }
      searchHTML += "</ul>";
      document.getElementById("searchResults").innerHTML = searchHTML;
    }
