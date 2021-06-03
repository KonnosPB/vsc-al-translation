$fileToCheck = $args[0]

$resultObject = [PSCustomObject]@{
    CheckedFile = $fileToCheck    
}

ConvertTo-Json $resultObject
