<?php
include "getFromSWC.php";
// define the directory where the local sector cache data is stored
$localSectorsDir = 'Sectors/';
$localFactionsDir = "Factions/";
$localCacheDir = "swcAPIcache/";

// currently not used, may need
$swcAPILocalDir = '/home/coryjvwk/tasoli.com/';
$localSectorListDir = 'swcAPIcache/Sector-List/';
$combineSectorIDURL = 'https://www.swcombine.com/rules/?Galaxy_Map&sectorID=';

// combine dirs
$combineURL = 'https://www.swcombine.com/';
$combineSite = 'ws/v1.0/';
$combineSectorsDir = 'galaxy/sectors/';
$combineSystemsDir = 'galaxy/systems/';
$combinePlanetsDir = 'galaxy/planets/';
$combineFactionDir = 'faction/';
$combineFactionListDir = 'factions/';

// get first list files
$firstFactionList = firstList($combineFactionListDir);
$firstSectorList = firstList($combineSectorsDir);
$firstSystemList = firstList($combineSystemsDir);
$firstPlanetList = firstList($combinePlanetsDir);

// get elements from cache
function gatherFromCache ($type) {
  global $localCacheDir;
  $gatherElement = array();
  $elementsInCache = scandir($localCacheDir.$type."/");
  $numElementsInCache = count($elementsInCache);
  for ($n = 0; $n < $numElementsInCache; $n++) {
    // find the name of the sector file to load
    $elementName = $elementsInCache[$n];
    if ($elementName != "." && $elementName != ".." && empty($elementName) != true) {
    // load that sector file
    $elementTempFile = simplexml_load_file($localCacheDir.$type."/".$elementName, "SimpleXMLElement");
    array_push($gatherElement, $elementTempFile);
    }
  }
  $gatherElement = json_encode($gatherElement, JSON_UNESCAPED_SLASHES);
  return $gatherElement;
}

// get elements from combine site
function getElementFromSWC ($elementType, $listDirOnCombine, $firstListType, $localListDir) {
  global $combineSite, $swcAPILocalDir, $combineElementsPerRequest, $startIndexQuery;
  $remoteElementArray = array();
  $startIndexNum = 1;
  // decalre function variables
  $numElements = ceil($firstListType['@attributes']['total']/$combineElementsPerRequest);
  echo "Determined there are " . $numElements . " " . $elementType . " lists to get.<br><br>";
  // figure out how many elements we need to retrieve
  for ($k = 0; $k < $numElements; $k++) {
    $elementTemp = simplexml_load_file($localListDir.$elementType.$k.".xml");
    echo "Loading " . $localListDir.$elementType.$k. ".xml<br><br>";
    $elementTemp = json_encode($elementTemp);
    $elementTemp = json_decode($elementTemp,TRUE);
    for ($j = 0; $j < $combineElementsPerRequest; $j++) {
      $elementName = $elementTemp[strtolower(substr($elementType,0,-1))][$j]["@attributes"]["name"];
        if (empty($elementName) != true) {
        $elementUID = $elementTemp[strtolower(substr($elementType,0,-1))][$j]["@attributes"]["uid"];
        $elementFromCombine = getFromCombine($combineSite.$listDirOnCombine.$elementUID);
        array_push($remoteElementArray,$elementFromCombine);
        }
      }
  }
  print_r($remoteElementArray);
  $remoteElementArray = json_encode($remoteElementArray, JSON_UNESCAPED_SLASHES);
  file_put_contents('/home/coryjvwk/tasoli.com/swcAPIcache/'.$elementType.'.json', $remoteElementArray);
}

getElementFromSWC("Sectors",$combineSectorsDir,$firstSectorList,$localSectorListDir);
getElementFromSWC("Systems",$combineSystemsDir,$firstSystemList,$localSystemListDir);
getElementFromSWC("Planets",$combinePlanetsDir,$firstPlanetList,$localPlanetListDir);
getElementFromSWC("Factions",$combineFactionListDir,$firstFactionList,$localFactionListDir);


// run the function to gather sector data
// $sectorsJSON = getElementFromSWC("Sectors",$combineSectorsDir,$firstSectorList);
// $systemsJSON = getElementFromSWC("Systems",$combineSystemsDir,$firstSystemList);
// $planetsJSON = getElementFromSWC("Planets",$combinePlanetsDir,$firstPlanetList);
// $factionsJSON = getElementFromSWC("Factions",$combineFactionListDir,$firstFactionList);
// file_put_contents('/home/coryjvwk/tasoli.com/swcAPIcache/planets.json', $planetsJSON);
// file_put_contents('/home/coryjvwk/tasoli.com/swcAPIcache/sectors.json', $sectorsJSON);
// file_put_contents('/home/coryjvwk/tasoli.com/swcAPIcache/systems.json', $systemsJSON);
// file_put_contents('/home/coryjvwk/tasoli.com/swcAPIcache/factions.json', $factionsJSON);


?>
