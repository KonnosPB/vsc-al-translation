# Ganz nach unten scrollen

$alcCompilerBinDirpath = "$($env:USERPROFILE)\.vscode\extensions\ms-dynamics-smb.al-7.1.453917"
$demoProjectDirPath = [System.IO.Path]::GetFullPath($(join-path $((Resolve-Path -Path ($PSScriptRoot)).Path) '..\DemoProject'))
$documentName = join-path  $demoProjectDirPath '\HelloWorld.al'

if (-not (Test-Path($alcCompilerBinDirpath))){
    throw "AL Compiler path $alcCompilerBinDirpath not found"
}

if (-not (Test-Path($demoProjectDirPath))){
    throw "VSC Project path $documentName not found"
}

if (-not (Test-Path($documentName))){
    throw "VSC demo al file $documentName not found"
}

function Install-HelperModules {
    # https://github.com/gravejester/Communary.PASM
    $module = Get-Module Communary.PASM
    if (-not $module){
        Install-Module Communary.PASM
    }
}

function Import-CompilerDlls {
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [string] $CompilerFolder,
        [Parameter(Mandatory = $false)]
        [string] $Force
    )
    if ($Global:CompilerDllsLoaded){
        return
    }
    $compilerDlls = Get-ChildItem -Path $CompilerFolder -Filter "*.dll" -Recurse
    $position = 0
    foreach ($compilerDll in $compilerDlls) {   
        Write-Host "Loading assembly $($compilerDll.FullName)"            
        try{
            Add-Type -Path "$($compilerDll.FullName)" -ErrorAction SilentlyContinue
        }catch{}
        $position++
    }        
    $Global:CompilerDllsLoaded = $true
}

function Add-ProjectPath{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace] $VSCodeWorkSpace,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $Path     
    )

    [Microsoft.Dynamics.Nav.EditorServices.Protocol.MessageProtocol.Contract.Settings] $settings = New-Object 'Microsoft.Dynamics.Nav.EditorServices.Protocol.MessageProtocol.Contract.Settings' -ArgumentList @()
    $settings.WorkspacePath = $Path
    [System.Collections.Generic.List``1[Microsoft.Dynamics.Nav.CodeAnalysis.Diagnostics.Diagnostic]] $diagnostics = $null #New-Object 'System.Collections.Generic.List[S]'
    [Microsoft.Dynamics.Nav.CodeAnalysis.CommandLine.ProjectManifest] $projectManifest = $null
    [bool] $missingSymbols = $false
    [System.Object[]] $tryAddOrUpdateProjectParameter =  $settings, $diagnostics, $projectManifest, $missingSymbols
    
     # Rufe Methode mit folgender Signatur auf "internal bool TryAddOrUpdateProject(Settings settings, out IList<Diagnostic> diagnostics, out ProjectManifest? manifest, out bool missingSymbols)"
    $tryAddOrUpdateProjectBindingFlags = [System.Reflection.BindingFlags]::NonPublic -bor [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::Public -bor [System.Reflection.BindingFlags]::InvokeMethod
    $tryAddOrUpdateProjectBindingMethod = [Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace].GetMethod("TryAddOrUpdateProject", $tryAddOrUpdateProjectBindingFlags)
    $success = $tryAddOrUpdateProjectBindingMethod.Invoke($VSCodeWorkSpace, $tryAddOrUpdateProjectParameter)
    if (-not $success){
        throw "Could not add project $path to visual studio code workspace"
    }
    return $VSCodeWorkSpace
}

function Get-Projects{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace] $VSCodeWorkSpace     
    )         
    $solution = $VSCodeWorkSpace.CurrentSolution
    $projects = $solution.Projects    
    return $projects
}


function New-VSCodeWorkspace{    
    $hostServices = [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Host.HostServices]::DefaultHost
    $background = $true
    $vsCodeWorkspace = New-Object 'Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace' -ArgumentList @($hostServices, $background)
    return $vsCodeWorkSpace
}

function Get-Document{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Project] $Project,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $DocumentName
    )

    foreach($Document in $Project.Documents){
        if ([System.IO.Path]::GetFullPath($Document.Name) -eq [System.IO.Path]::GetFullPath($DocumentName)){
            return $Document
        }
    }
    return $null
}

function Get-RuntimeVersion{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Project] $Project        
    )
    $parseOptions = $Project.ParseOptions
    $runtimeVersion = $parseOptions.RuntimeVersion    
    return $runtimeVersion
}


function Get-DocumentState{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )

      # Rufe Methode mit folgender Signatur auf "internal bool TryAddOrUpdateProject(Settings settings, out IList<Diagnostic> diagnostics, out ProjectManifest? manifest, out bool missingSymbols)"
    $bindingFlags = [System.Reflection.BindingFlags]::NonPublic -bor [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::Public -bor [System.Reflection.BindingFlags]::InvokeMethod
    $methodInfo = [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document].GetMethod("GetDocumentState", $bindingFlags)
    $documentState = $methodInfo.Invoke($Document, $null)
    return $documentState
}

function Get-DocumentSemanticModel{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )
    $SemanticModel = $Document.GetSemanticModelAsync().GetAwaiter().GetResult()
    return $SemanticModel

}

function Get-DocumentSyntaxTree{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )    
    $SyntaxTree = $Document.GetSyntaxTreeAsync().GetAwaiter().GetResult()
    return $SyntaxTree    
}

function Get-DocumentRootSyntaxNode{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )

    $syntaxNode = $Document.GetSyntaxRootAsync().GetAwaiter().GetResult()
    return $syntaxNode
}


function Get-SyntaxTree{
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Project] $Project,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $Path
    )

    $content = Get-Content -Path $Path -Raw -Encoding UTF8
    #$version = New-Object "System.Version" $runtimeVersion
    $version = Get-RuntimeVersion $project
    $parseOptions = New-Object "Microsoft.Dynamics.Nav.CodeAnalysis.ParseOptions" $version    
    try {
        $syntaxTree = [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.SyntaxTree]::ParseObjectText($content, $Path, [System.Text.Encoding]::UTF8, $parseOptions);        
    }
    catch {
        Write-Warning "Failed to parse $($alFile)"
        continue
    }          
    return $syntaxTree
}

function Get-ChildSyntaxNodes{
     param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode,
        [Parameter(Mandatory = $true, Position = 2)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind] $SyntaxKind       
    )
           
    $childNodes = $SyntaxNode.DescendantNodes() | Where-Object { $_.Kind -eq $SyntaxKind }
    return $childNodes
}

function Select-MethodDeclarationNodes{
     param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode        
    )           
    return Get-ChildSyntaxNodes $SyntaxNode ([Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind]::MethodDeclaration)
}

function Select-VariableNodes{
     param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode        
    )           
    return $MethodDeclarationSyntaxNode.Variables    
}

function Select-ParameterListNodes{
     param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode        
    )           
    return $MethodDeclarationSyntaxNode.ParameterList    
}

function Get-BodyNode{
     param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode        
    )           
    return $MethodDeclarationSyntaxNode.Body    
}

function New-MethodData{
     param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode        
    )           
    $location = $MethodDeclarationSyntaxNode.GetLocation()
    $methodName = "$($MethodDeclarationSyntaxNode.Name)"
    $lineSpan = $location.GetLineSpan()
    $linePosition = $lineSpan.StartLinePosition
    $lineNo = $linePosition.Line
    $filePath = $location.SourceTree.FilePath
    $content = New-MethodBodyAsOneLiner $MethodDeclarationSyntaxNode
    $result = [pscustomobject]@{
        "Id" = [guid]::NewGuid()
        "FilePath" = $filePath
        "FileName" = [System.IO.Path]::GetFileName($filePath)
        "Method" = $methodName
        "Line" = $lineNo
        "SyntaxNode" = $MethodDeclarationSyntaxNode
        "Content" = $content
    }
    return $result
}

function Contains-ChildKind{
     param (               
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode,
        [Parameter(Mandatory = $true, Position = 2)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind] $SyntaxKind
    )  
    $childNodeOfKind = $SyntaxNode.DescendantNodesAndSelf() | Where {$_.Kind -eq $SyntaxKind} | Select-Object -First 1
    if ($childNodeOfKind){
        return $true
    }
    return $false
}


function Apply-MemberAccessExpressionSerialization{
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode,
        [Parameter(Mandatory = $true, Position = 2, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode
    )  
    $variables = Select-VariableNodes $MethodDeclarationSyntaxNode        
    $parameters = Select-ParameterListNodes $MethodDeclarationSyntaxNode 
   
    $memberAccessNodeString = ""
    $descendantTokens = $SyntaxNode.DescendantTokens()
    foreach ($descendantToken in $descendantTokens){
        $skipToken = $false
        $parent = $descendantToken.Parent
        $currToken = $descendantToken.ToString()     
        if ($currToken -eq ')' -or $currToken -eq '('){            
            if ($parent.ToString() -eq '()'){
                $skipToken = $true
            }
        }        
        if ($variables){
            $varNode = $variables.DescendantNodes() | Where-Object {$_.Name -and $_.Name.ToString() -eq $currToken} | Select-Object -First 1
            if ($varNode.Type.DataType.Subtype.Identifier){            
                $varSubtype = $varNode.Type.DataType.Subtype.Identifier.ToString()
                $memberAccessNodeString += $varSubtype
                $skipToken = $true
            }
        }

        if ($parameters){
            $paramNode = $parameters.DescendantNodes() | Where-Object {$_.Name -and $_.Name.ToString() -eq $currToken} | Select-Object -First 1
            if ($paramNode.Type.DataType.Subtype.Identifier){            
                $paramSubtype = $paramNode.Type.DataType.Subtype.Identifier.ToString()
                $memberAccessNodeString += $paramSubtype
                $skipToken = $true
            }
        }

        if (-not $skipToken){
            $memberAccessNodeString += $currToken
        }
    }    
    return $memberAccessNodeString.ToLower()
}

function Apply-Serialization{
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode,
        [Parameter(Mandatory = $true, Position = 2, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode
    )  
    $SerializedNodeString = ""
    $containsChildKind = Contains-ChildKind $SyntaxNode $([Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind]::MemberAccessExpression)
    if ($containsChildKind){
        $SerializedNodeString += Apply-MemberAccessExpressionSerialization $MethodDeclarationSyntaxNode $SyntaxNode
    }else{
        $dns = $SyntaxNode.DescendantTokens()
        foreach($dn in $dns){

        }
        $SerializedNodeString += $SyntaxNode.ToString().ToLower()
    }
    return $SerializedNodeString
}

function Match-Approximatelly{
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [string] $String1,
        [Parameter(Mandatory = $true, Position = 2, ValueFromPipeline = $true)]
        [string] $String2,
        [Parameter(Mandatory = $false)]
        [int] $ScoreLimitValue = 90,
        [Parameter(Mandatory = $false)]
        [Switch] $LessThan,
        [Parameter(Mandatory = $false)]
        [PasmAlgorithm] $Algorithm = [PasmAlgorithm]::JaroDistance #HammingDistance, JaccardDistance, JaccardIndex, JaroDistance, JaroWinklerDistance, LevenshteinDistance, LongestCommonSubsequence, LongestCommonSubstring, OverlapCoefficient
    )  
    #1. Favorit JaroDistance danach JaccardDistance
    $pasmScore  = Get-PasmScore -String1 $String1 -String2 $String2 -Algorithm $Algorithm      
    if ($LessThan){        
        $matchEvaluation = $pasmScore -le $ScoreLimitValue        
    }else{        
        $matchEvaluation = $pasmScore -ge $ScoreLimitValue
    }
    $result = [pscustomobject]@{
                    "ScoreLimit" = $ScoreLimitValue
                    "Algorithm" = $Algorithm
                    "Score" = $pasmScore
                    "MatchEvaluation" = $matchEvaluation  
                }
    return $result
}


function New-MethodBodyAsOneLiner{
     param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode     
     )      
     # Analyse: Wie tickt "Body"?
    $body = Get-BodyNode $MethodDeclarationSyntaxNode
    $SerializedString = ""    
    $Statements = $body.Statements
    foreach($Statement in $Statements){
        $SerializedString += Apply-Serialization $MethodDeclarationSyntaxNode $Statement
    }    
    return $SerializedString
}



function Compare-Methods{
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [object[]] $methodDataList,
        [Parameter(Mandatory = $false)]
        [int] $ScoreLimitValue = 90,
        [Parameter(Mandatory = $false)]
        [Switch] $LessThan,
        [Parameter(Mandatory = $false)]
        [PasmAlgorithm] $Algorithm = [PasmAlgorithm]::JaroDistance #HammingDistance, JaccardDistance, JaccardIndex, JaroDistance, JaroWinklerDistance, LevenshteinDistance, LongestCommonSubsequence, LongestCommonSubstring, OverlapCoefficient
    )        
    $results = @()  
    # TODO: Performanceoptimierung? Parallelverarbeitung?
    for ($i = 0; $i -lt $methodDataList.Count; $i++){
        for ($y = $i + 1; $y -lt $methodDataList.Count; $y++){
            $methodData1 = $methodDataList.Get($i)
            $methodData2 = $methodDataList.Get($y)
            if ($methodData1.Id -ne $methodData2.Id){                
                $comparisonScore = Match-Approximatelly $methodData1.Content $methodData2.Content -ScoreLimitValue $ScoreLimitValue -LessThan:$LessThan -Algorithm $Algorithm
                $result = [pscustomobject]@{
                    "MethodData1" = $methodData1
                    "MethodData2" = $methodData2
                    "Score" = $comparisonScore                   
                }
                $results += $result                
            }
        }
    }
    return $results
}

################################################################
# Hier geht der interessante Teil los
################################################################


# 1.) Alle Compiler DLLs laden, so dass sie via Powershell nutzbar sind
Import-CompilerDlls $alcCompilerBinDirpath

# 2.) Hier wird ein Visual Studio Code Workspace Editor Host Instanz erzeugt. Den höchsten Abstarktionslayer, welchen ich vorgefunden habe.
$vsCodeWorkSpace = New-VSCodeWorkspace 

# 3.) Füge ein Projekt der Umgebung hinzu. Wie in VS-Code auch, kann das Objekt VSCodeWorkspace mehrere Projekte verwalten.
Add-ProjectPath $vsCodeWorkSpace $demoProjectDirPath

# 4.) Extrahiere aus dem einzigen Projekt ein "Project" Objekt.
$project = Get-Projects $vsCodeWorkSpace | Select-Object -First 1

# 5.) Unterhalb eines Projektes gibt es jede Menge Strukturen. Unter anderem auch ein "Document" Objekt, dass den Dateipfad als Namen enthält hat.
$document = Get-Document $project -DocumentName $documentName
$documentState = Get-DocumentState $document
$syntaxTree = Get-DocumentSyntaxTree $document
$rootSyntaxNode = Get-DocumentRootSyntaxNode $document # SyntaxNode Struktur kenne ich grob. Ziemlich detailiert und komplex.
$SemanticModel = Get-DocumentSemanticModel $document # Ist das besser geeignet als Syntax Knoten? Keine Ahnung, was damit möglich ist.

# Umsetzung meiner vorläufigen Idee
# Wie bekomme ich eine Methoden-Object? Syntax-Knoten oder semantische Model (was auch immer das ist?)
# <gelöst mit Syntax Knoten>
$methodDeclarations = Select-MethodDeclarationNodes $rootSyntaxNode

# Wie komme ich an die Variablen und Parameterliste einer Methode? 
# Wieso? Ich will Variablennamen durch Umbenennenen vereinheitlichen. Beispiel: SalesLineLoc soll zu "Sales Line" werden.)
# <gelöst> 
foreach($methodDeclaration in $methodDeclarations){
    $variableNodes = Select-VariableNodes $methodDeclaration 
    $parameterNodes = Select-ParameterListNodes $methodDeclaration 
}

# Wie bekomme ich den Method Body?
# <gelöst> 
$bodyNode = Get-BodyNode $methodDeclaration 

# Umwandlung der Anweisungen in einer Methode in eine Einzeiler-Zeichenkette ähnlich Stringify-Funktionalität umhälit in einer Methoden-Datatransferobjekt. 
# Dabei werden Variablenname durch ihren Typ ersetzt (Also aus SalesLineLoc wird "Sales Line"). Besondere Herausforderung: Rec muss auch zum Typen umgewandelt werden: Also aus Rec.SetRange oder SetRange => "Sales Line".SetRange
# Tipp für die Analyse: Mit IlSpy (gibt es neuerdings im Windows-Store) die Microsoft.Dynamics.Nav.CodeAnalysis.dll prüfen.
# <für einige einfache Fälle gelöst, Rec nicht, With Rec nicht, CurrPage nicht, CurrReport nicht und und und>
$methodDataList= @()
foreach($methodDeclaration in $methodDeclarations){

    # Wrappen des Methodedeklarationknoten in ein Methodendata Objekt, die für unsere Zwecke geeigneter sind.         
    $methodData = New-MethodData $methodDeclaration    
    $methodDataList += $methodData    
}

$methodDataList| Format-Table -GroupBy FileName -Property FileName, Method, Line, Content  

# IDEE: Via approximativen Stringvergleich werden die umgewandelten MethodenbodyStrings miteinander verglichen und die Abweichung bewertet.
# Dafür sind Textdistanzalgorithmen geeignet. Welche davon am besten ist, müssen wird nur prüfen. 
# Zur Auswahl stehen HammingDistance, JaccardDistance, JaccardIndex, JaroDistance, JaroWinklerDistance, LevenshteinDistance, LongestCommonSubsequence, LongestCommonSubstring, OverlapCoefficient 
# Die besten Ergebnisse hatte ich gefühlt mit JaccardDistance. Die Test waren aber nicht variabel genug, um sicher zu sein.
# Gegebenenfalls müssen wir einen eigenen Score basteln. Beispiel wie sowas gehen könnte: https://github.com/gravejester/Communary.PASM/blob/master/Functions/Get-FuzzyMatchScore.ps1

# Experemetieren mit Distanzverglichen
#$a = 'integer.reset;integer.setrange(number,1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
#$a = 'integer.reset;integer.setrange(number,1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
#$a = 'rec.reset;rec.setfilter(number,''%1..%2'',1,5);ifrec.findsetthenbeginrepeatuntilrec.next=0;end;'
#$a = 'integer.reset;integer.setfilter(number,''%1..%2'',1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
#$b = 'integer.reset;integer.setfilter(number,''%1..%2'',1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
#$result = Match-Approximatelly $a $b
#Write-Host $result

# Konkrete Anwendung
Install-HelperModules
$compareResults = Compare-Methods $methodDataList


# Ergebnisausgabe
$displayResults = @()
foreach ($compareResult in $compareResults){
    $displayResults += [pscustomobject]@{
        "File1" = $compareResult.MethodData1.FileName
        "Method1" = $compareResult.MethodData1.Method
        "Line1" = $compareResult.MethodData1.Line
        "File2" = $compareResult.MethodData2.FileName
        "Method2" = $compareResult.MethodData2.Method
        "Line2" = $compareResult.MethodData2.Line
        "Scrore" = $compareResult.Score.Score
        "MatchEvaluation" = $compareResult.Score.MatchEvaluation
        "Algorithm"  = "<$($compareResult.Score.Algorithm)>"
    }
}
$displayResults | Format-Table
  
