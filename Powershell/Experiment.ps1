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
    $pasmScore  = Get-PasmScore -String1 $a -String2 $b -Algorithm $Algorithm      
    if ($LessThan){        
        $result = $pasmScore -le $ScoreLimitValue        
    }else{        
        $result = $pasmScore -ge $ScoreLimitValue
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
    Write-Host "Ausgabe für $($MethodDeclarationSyntaxNode.Name): $SerializedString"

    return $SerializedString
}

################################################################
# Hier geht der interessante Teil los
################################################################

# 1.) 
Install-HelperModules

# 2.) Alle Compiler DLL geladen, so dass sie via Powershell nutzbar sind
Import-CompilerDlls $alcCompilerBinDirpath

# 3.) Hier wird ein Visual Studio Code Workspace Editor Host Instanz erzeugt. Das hï¿½chste Abstarktionslayer, welchen ich vorgefunden habe.
$vsCodeWorkSpace = New-VSCodeWorkspace 

# 4.) Fï¿½ge ein Projekt der Umgebung hinzu. Wie in VS-Code auch, kann das Objekt VSCodeWorkspace mehrere Projekte verwalten.
Add-ProjectPath $vsCodeWorkSpace $demoProjectDirPath

# 5.) Extrahiere aus dem einzigen Projekt ein "Project" Objekt.
$project = Get-Projects $vsCodeWorkSpace | Select-Object -First 1

# 6.) Unterhalb eines Projektes gibt es jede Menge Strukturen. Unter anderem auch ein "Document" Objekt, dass den Dateipfad als Name hat.
$document = Get-Document $project -DocumentName $documentName
$documentState = Get-DocumentState $document
$syntaxTree = Get-DocumentSyntaxTree $document
$rootSyntaxNode = Get-DocumentRootSyntaxNode $document # SyntaxNode Struktur kenn ich grob. Ziemlich detailiert und komplex.
$SemanticModel = Get-DocumentSemanticModel $document # Ist das besser geeignet als Syntax Knoten?

# Hier meine vorläufige Idee
# <gelöst> Wie bekomme ich eine Methoden-Object? Syntax-Knoten oder semantische Model (was auch immer das ist?)
$methodDeclarations = Select-MethodDeclarationNodes $rootSyntaxNode

# Wie komme ich an die Variablen und ParameterList einer Methode? (Wieso? Ich will Variablennamen umbenennenen. Beispiel: SalesLineLoc soll zu "Sales Line" werden)
# <gelöst> 
foreach($methodDeclaration in $methodDeclarations){
    $variableNodes = Select-VariableNodes $methodDeclaration 
    $parameterNodes = Select-ParameterListNodes $methodDeclaration 
}

# Wie bekomme ich den Method Body?
# <gelöst> 
$bodyNode = Get-BodyNode $methodDeclaration 

# Umwandlung der Anweisungen in einer Methode in eine Einzeiler-Zeichenkette im Stile von Stringify. 
# Dabei werden Variablenname durch ihren Typ ersetzt (Also aus SalesLineLoc wird "Sales Line"). Besondere Herausforderung: Rec muss auch zum Typen umgewandelt werden: Also aus Rec.SetRange oder SetRange => "Sales Line".SetRange
# Tipp für die Analyse: IlSpy (gibt es neuerdings im Windows-Store) => Microsoft.Dynamics.Nav.CodeAnalysis.dll
# <für einige Fälle gelöst, Rec nicht, With Rec nicht, CurrPage nicht, CurrReport nicht und und und>
foreach($methodDeclaration in $methodDeclarations){
    $methodBodyOneLiner = New-MethodBodyAsOneLiner $methodDeclaration
}

# TODO: Sammlung der umgewandelten Strings in ein Dictionary  <PositionsInfo, Umgewandelte Zeichenkette>.


# IDEE: Via approximativen Stringvergleich werden die umgewandelten Strings miteinander verglichen und die Abweichung bewertet.
# Müssen prüfen, welche Algorithmus am geeignesten ist. 
# Zur Auswahl stehen HammingDistance, JaccardDistance, JaccardIndex, JaroDistance, JaroWinklerDistance, LevenshteinDistance, LongestCommonSubsequence, LongestCommonSubstring, OverlapCoefficient 
# Gegebenenfalls müssen wir einen eigenen Score basteln. Beispiel wie sowas gehen könnte: https://github.com/gravejester/Communary.PASM/blob/master/Functions/Get-FuzzyMatchScore.ps1


#$a = 'integer.reset;integer.setrange(number,1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
#$a = 'integer.reset;integer.setrange(number,1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
$a = 'rec.reset;rec.setfilter(number,''%1..%2'',1,5);ifrec.findsetthenbeginrepeatuntilrec.next=0;end;'
#$a = 'integer.reset;integer.setfilter(number,''%1..%2'',1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
$b = 'integer.reset;integer.setfilter(number,''%1..%2'',1,5);ifinteger.findsetthenbeginrepeatuntilinteger.next=0;end;'
$result = Match-Approximatelly $a $b
Write-Host $result