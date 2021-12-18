<?php
// combine dirs
$combineURL = 'https://www.swcombine.com/';
$combineSite = 'ws/v1.0/';
$combineSectorsDir = 'galaxy/sectors/';
$combineSystemsDir = 'galaxy/systems/';
$combinePlanetsDir = 'galaxy/planets/';
$combineFactionDir = 'faction/';
$combineFactionListDir = 'factions/';


// local dirs
$swcAPILocalDir = '/home/coryjvwk/tasoli.com/';
$localSectorListDir = 'swcAPIcache/Sector list/';
$localSystemListDir = 'swcAPIcache/System list/';
$localPlanetListDir = 'swcAPIcache/Planet list/';
$localFactionListDir = "swcAPIcache/Faction list/";
$localSectorsDir = 'swcAPIcache/Sectors/';
$localSystemsDir = 'swcAPIcache/Systems/';
$localPlanetsDir = 'swcAPIcache/Planets/';
$localFactionsDir = 'swcAPIcache/Factions/';

// replace these primary files with a scan of the dir and retrieval of first file
$primarySectorListFile = "Sectors0.xml";
$primaryFactionListFile = "Factions0.xml";
$primaryFactionsFile = "CorSec.xml";
$primarySectorFile = "Bakura.xml";

// combine properties
$combineElementsPerRequest = 50;
$startIndexQuery = '?start_index=';

// get first list files
$firstFactionList = firstList($combineFactionListDir);
$firstSectorList = firstList($combineSectorsDir);
$firstSystemList = firstList($combineSystemsDir);
$firstPlanetList = firstList($combinePlanetsDir);

// get oldest file
$oldestSector = findOldestFile($localSectorsDir);
$oldestSectorList = findOldestFile($localSectorListDir);
$oldestFaction = findOldestFile($localFactionsDir);
$oldestFactionList = findOldestFile($localFactionListDir);
$oldestSystem = findOldestFile($localSystemsDir);
$oldestSystemList = findOldestFile($localSystemListDir);
$oldestPlanet = findOldestFile($localPlanetsDir);
$oldestPlanetList = findOldestFile($localPlanetListDir);

// get the first list file
function firstList($listDirOnCombine) {
  global $combineSite;
  $firstList = getFromCombine($combineSite.$listDirOnCombine);
  $firstList = json_encode($firstList);
  $firstList = json_decode($firstList,TRUE);
  echo "Returning list file for " . $listDirOnCombine . "<br><br>";
  return $firstList;
}

// find the oldest file we have
function findOldestFile($directory) {
  $iterator = new DirectoryIterator($directory);
  $mtime = 999999999999999;
  $file;
  // foreach($directory as $file) {
  //   if(is_file($file)) {
  //     $mod_date=date("Ymd", filemtime($file));
  //     echo "$file last modified on ". $mod_date . "<br><br>";
  //     if($mod_date < $mtime) {
  //       $mtime = $mod_date;
  //     }
  //   } else {
  //     echo "$file is not a correct file<br><br>";
  //   }
  // }
  // return $mtime;

  foreach ($iterator as $fileinfo) {
      if ($fileinfo->isFile()) {
          if ($fileinfo->getMTime() < $mtime) {
              $file = $fileinfo->getFilename();
              $mtime = $fileinfo->getMTime();
              echo "Checking mtime of " . $file . " which is " . date("Ymd",$mtime) . "<br><br>";
          }
      }
  }
  $formattedMTime = date("Ymd",filemtime($directory.$file));
  echo "Oldest mtime for " . $directory . " is " . $formattedMTime . " for " . $file . "<br><br>";
  return $formattedMTime;
}

function dir_is_empty($dir) {
  $handle = opendir($dir);
  while (false !== ($entry = readdir($handle))) {
    if ($entry != "." && $entry != "..") {
      closedir($handle);
      return FALSE;
    }
  }
  closedir($handle);
  return TRUE;
}

// Check list and files
checkDateOfCacheList ($localSectorListDir, $oldestSectorList, "Sector list", $combineSectorsDir);
checkDateOfCacheList ($localPlanetListDir, $oldestPlanetList, "Planet list", $combinePlanetsDir);
checkDateOfCacheList ($localSystemListDir, $oldestSystemList, "System list", $combineSystemsDir);
checkDateOfCacheList ($localFactionListDir, $oldestFactionList, "Faction list", $combineFactionListDir);
checkDateOfCacheFiles ($localFactionListDir, $oldestFaction, "Factions", $firstFactionList, 2, $combineFactionDir, $localFactionsDir);
checkDateOfCacheFiles ($localSectorListDir, $oldestSector, "Sectors", $firstSectorList, 2, $combineSectorsDir, $localSectorsDir);
checkDateOfCacheFiles ($localSystemListDir, $oldestSystem, "Systems", $firstSystemList, 2, $combineSystemsDir, $localSystemsDir);
checkDateOfCacheFiles ($localPlanetListDir, $oldestPlanet, "Planets", $firstPlanetList, 2, $combinePlanetsDir, $localPlanetsDir);
exit();

function checkDateOfCacheFiles ($localListDir, $oldestFile, $type, $firstListType, $offset, $combineDir, $localElementDir) {
  echo "Checking " . $type . " files. ";
  if (dir_is_empty($localElementDir) != true) {
    // check if these are ever equal for factions
    if ((count(scandir($localElementDir))-$offset) != $firstListType['@attributes']['total']) {
      echo "The number of local " . $type . " files don't match the number of server files, fetching...<br><br>";
      echo "The number of local " . $type . " files is " . (count(scandir($localElementDir))-$offset) . " and remote is " . $firstListType['@attributes']['total'].".<br><br>";
      getElement($type, $combineDir, $localListDir, $localElementDir, $firstListType);
    } else {
      if ($oldestFile < date("Ymd")) {
      echo "The local file mtime is " . $oldestFile . " which is less than today ". date("Ymd") .", fetching...<br><br>";
      getElement($type, $combineDir, $localListDir, $localElementDir, $firstListType);
      } else {
      echo "The local " . $type . " files were gathered today, exiting.<br><br>";
      }
    }
  } else {
    echo "The local " . $type . " files didn't exist, fetching...<br><br>";
    getElement($type, $combineDir, $localListDir, $localElementDir, $firstListType);
  }
}

function checkDateOfCacheList ($localListDir, $oldestFile, $type, $combineDir) {
  echo "Checking " . $type . " files. ";
  if (dir_is_empty($localListDir) != true) {
      if ($oldestFile < date("Ymd")) {
      echo "The local file mtime is " . $oldestFile . " which is less than today ". date("Ymd") .", fetching...<br><br>";
      getList($type, $combineDir, $localListDir);
      } else {
      echo "The local " . $type . " files were gathered today, exiting<br><br>";
      // for debugging only, gather the list each time
      // getList($type, $combineDir, $localListDir);
      }
  } else {
    echo "The local " . $type . " files didn't exist, fetching...<br><br>";
    getList($type, $combineDir, $localListDir);
  }
}

// get elements from combine site
function getElement ($elementType, $listDirOnCombine, $localListDir, $localElementDir, $firstListType) {
  global $combineSite, $swcAPILocalDir, $combineElementsPerRequest;
  // decalre function variables
  $numElements = ceil($firstListType['@attributes']['total']/$combineElementsPerRequest);
  echo "Determined there are " . $numElements . " " . $elementType . " lists to get.<br><br>";
  $elementsToRemove = [];
  $localElementArray = [];
  $remoteElementArray = [];
  $localElementArray = scandir($localElementDir);
  // figure out how many elements we need to retrieve
  for ($k = 0; $k < $numElements; $k++) {
    $elementTemp = simplexml_load_file($localListDir.$elementType.$k.".xml");
    echo "Loading " . $localListDir.$elementType.$k. ".xml<br><br>";
    $elementTemp = json_encode($elementTemp);
    $elementTemp = json_decode($elementTemp,TRUE);
    // get each element from the combine site and save it to the local cache directory
    for ($j = 0; $j < $combineElementsPerRequest; $j++) {
      $elementName = $elementTemp[strtolower(substr($elementType,0,-1))][$j]["@attributes"]["name"];
      // if ($elementName != undefined && $elementName != '') {
        if (empty($elementName) != true) {
        $elementNameXML = [$elementName . ".xml"];
        echo "ElementNameXML is " . print_r($elementNameXML) . "<br><br>";
        array_push($remoteElementArray,$elementNameXML);
        $elementUID = $elementTemp[strtolower(substr($elementType,0,-1))][$j]["@attributes"]["uid"];
        echo '> Getting ' . $elementName . ' file.<br><br>';

          $elementNameGetXMLElement = getFromCombine($combineSite.$listDirOnCombine.$elementUID);
          $elementNameGetXMLElement->asXML($swcAPILocalDir.$localElementDir.$elementName.".xml");
        } else {
          echo "Element name is empty: " . $elementName . " - aborting get<br><br>";
        }
      // }
    }
  }
  echo "Local array now includes " . print_r($localElementArray) . "<br><br><hr>";
  echo "Remote array now includes " . print_r($remoteElementArray) . "<br><br><hr>";
  $elementsToRemove = array_diff($localElementArray, $remoteElementArray);
  echo "Remove array now includes " . print_r($elementsToRemove) . "<br><br>";
  // for each element we have that the server doesn't, remove that element
  for ($d = 0; $d < count($elementsToRemove); $d++) {
    if (is_file($localListDir.$elementsToRemove[$d])){
      unlink($localListDir.$elementsToRemove[$d]);
      echo "-- Removing " . $localListDir.$elementsToRemove[$d] . " as it is no longer needed.<br><br>";
    }
  }
  $elementsToRemove = null;
  $localElementArray = null;
  $remoteElementArray = null;
}

// get list files from the combine site
function getList ($listType, $listDirOnCombine, $localListDir) {
  global $combineSite, $swcAPILocalDir, $startIndexNum, $startIndexQuery, $combineElementsPerRequest;
  // declare the variables
  $simpleXMLElement = '';
  $listName = '';
  $numCalls = '';
  $listTemp = '';
  // get the first list file, determine how many elements it has, then save the first list file to cache
  echo "Getting first " . $listType . " file.<br><br>";
  $simpleXMLElement = getFromCombine($combineSite.$listDirOnCombine);
  $listName = substr($listType, 0, -5) . "s";
  $simpleXMLElement = json_encode($simpleXMLElement);
  $simpleXMLElement = json_decode($simpleXMLElement,TRUE);
  $numCalls = ceil(($simpleXMLElement['@attributes']['total']/$combineElementsPerRequest));
  echo "Using " . $simpleXMLElement['@attributes']['total'] . " to determine number of files to get.<br><br>";
  $simpleXMLElement = getFromCombine($combineSite.$listDirOnCombine);
  $simpleXMLElement->asXML($swcAPILocalDir.$localListDir.$listName."0.xml");
  $startIndexNum = 1 + $combineElementsPerRequest;
  echo "Getting remaining " . $listType . " files.<br><br>";
  // get the remaining list files and save them to cache
  for ($i = 1; $i < $numCalls; $i++) {
    $listTemp = getFromCombine($combineSite.$listDirOnCombine.$startIndexQuery.$startIndexNum);
    $listTemp->asXML($swcAPILocalDir.$localListDir.$listName.$i.".xml");
    echo "Saving list file " . $localListDir.$listName.$i . ".xml<br><br>";
    $startIndexNum = $startIndexNum + $combineElementsPerRequest;
  }
}

// function to get a file from SWcombine
function getFromCombine ($fileToGet) {
  global $combineURL, $simpleXMLElement;
  $newXMLElement = new SimpleXMLElement($combineURL.$fileToGet, null, true);
  return $newXMLElement;
}

// get first list files
$firstFactionList = null;
$firstSectorList = null;
$firstSystemList = null;
$firstPlanetList = null;


?>
