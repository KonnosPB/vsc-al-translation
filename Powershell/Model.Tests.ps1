using module .\Model.psm1

#BeforeAll { 
#     function Get-Planet ([string]$Name = '*') {
#         $planets = @(
#             @{ Name = 'Mercury' }
#             @{ Name = 'Venus'   }
#             @{ Name = 'Earth'   }
#             @{ Name = 'Mars'    }
#             @{ Name = 'Jupiter' }
#             @{ Name = 'Saturn'  }
#             @{ Name = 'Uranus'  }
#             @{ Name = 'Neptune' }
#         ) | ForEach-Object { [PSCustomObject] $_ }

#         $planets | Where-Object { $_.Name -like $Name }
#     }
#}

Describe 'TranslationFile.GetTargetLanguage' {
    It 'Should provide target language code' {
        $translationFile = [TranslationFile]::new("D:\Repos\GitHub\KonnosPB\vsc-al-translation\Powershell\KUMAVISION med Call Bridge.de-DE.xml")
        $translationFile.GetTargetLanguage() | Should -Be 'de-DE'
    }
}

$translationFile = [TranslationFile]::new("D:\Repos\GitHub\KonnosPB\vsc-al-translation\Powershell\KUMAVISION med Call Bridge.de-DE.xml")
$result = $translationFile.GetTargetLanguage()

