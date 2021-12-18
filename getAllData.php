<?php
error_log(-1);
include "getDataFromSWC.php";

// exec('/usr/local/bin/php getSectors.php');
// print `echo /usr/bin/php -q getSectors.php | at now`;
// print `echo /usr/bin/php -q getSystems.php | at now`;
// print `echo /usr/bin/php -q getFactions.php | at now`;
print `echo /usr/bin/php -q getPlanets.php | at now`;


?>
