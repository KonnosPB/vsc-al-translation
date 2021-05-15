class ALProject{    
    [string] $RootPath

    ALProject([string]$Path){
        $this.RootPath = $this.GetRootPath($Path)
    } 

    hidden [string] GetRootPath([string]$Path){
        return $Path
    }

    [TranslationProvider[]] GetTranslationFiles(){        
        $result = Get-ChildItem -Path $this.RootPath -Filter *.xlf -Recurse | ForEach-Object {[TranslationFile]::new($_.FullName)}
        return $result;
    }
}

class ALFile{

}

class TranslationFile{
    [string] $Path
    [xml] $XmlDocument

    TranslationFile([string]$Path){
        $this.Path = $Path
        $this.XmlDocument = Get-Content $this.Path
    }

    [string] GetTargetLanguage(){        
        $result = $this.XmlDocument.xliff.file."target-language"
        return $result
    }

    [bool] SourceExist([string]$translationFilePath){
        
        if (Get-Content $this.Path | Select-String $translationFilePath){
            return $true
        }
        return $false        
    }

    [bool] TargetExist([string]$translationFilePath){
        if (Get-Content $this.Path | Select-String $translationFilePath){
            return $true
        }
        return $false        
    }
}

class TranslatableNode{
    [string] GetPath(){

    }

}

class Configuration{

}

class TranslationProvider{

}