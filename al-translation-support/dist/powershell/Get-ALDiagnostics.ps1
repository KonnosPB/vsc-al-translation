param (    
    [string] $AlcFolderPath,    
    [switch] $CheckGlobalProcedures,    
    [switch] $CheckApplicationAreaValidity,    
    [switch] $CheckTranslation,    
    [string] $ValidApplicationAreas,    
    [string] $ALFileToCheck
)

# $AlcFolderPath = "C:\Users\Kosta\.vscode\extensions\ms-dynamics-smb.al-7.1.453917\"
# $ALFileToCheck = "D:\Repos\GitHub\KonnosPB\vsc-al-translation\DemoProject\HelloWorld.al"
# $CheckApplicationAreaValidity = $true
# $ValidApplicationAreas = 'KVSMEDBanana'
# $CheckTranslation = $true
# $CheckGlobalProcedures = $true
 

if (-not (Test-Path($AlcFolderPath))) {
    throw "alc compiler folder path '$AlcFolderPath' not found"
}

$codeAnalysisDllItem = Get-ChildItem -Path $AlcFolderPath -Include "Microsoft.Dynamics.Nav.CodeAnalysis.dll" -Recurse | Select-Object -First 1
if (-not (Test-Path -Path $codeAnalysisDllItem.FullName)) {
    throw "Microsoft.Dynamics.Nav.CodeAnalysis.dll not found in '$AlcFolderPath'"
}
$codeAnalysisWorkspacesDllItem = Get-ChildItem -Path $AlcFolderPath -Include "Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.dll" -Recurse | Select-Object -First 1
if (-not (Test-Path -Path $codeAnalysisWorkspacesDllItem.FullName)) {
    throw "Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.dll not found in '$AlcFolderPath'"
}
$editorServicesProtocolDllItem = Get-ChildItem -Path $AlcFolderPath -Include "Microsoft.Dynamics.Nav.EditorServices.Protocol.dll" -Recurse | Select-Object -First 1
if (-not (Test-Path -Path $editorServicesProtocolDllItem.FullName)) {
    throw "Microsoft.Dynamics.Nav.EditorServices.Protocol.dll not found in '$AlcFolderPath'"
}

if ($CheckApplicationAreaValidity) {
    if ([String]::IsNullOrWhiteSpace($ValidApplicationAreas)) {
        throw "ValidApplicationAreas not set but -CheckApplicationAreaValidity enabled"
    }
}


$Global:CurrentAlcCompilerPath = ""
$ResultObject = [PSCustomObject]@{
    CheckedFile = $ALFileToCheck
    Diagnostics = @()    
}

function Import-CompilerDlls {
    if ($Global:CurrentAlcCompilerPath -eq $CompilerFolder) {
        return;
    }

    Add-Type -Path $codeAnalysisDllItem.FullName
    Add-Type -Path $codeAnalysisWorkspacesDllItem.FullName
    Add-Type -Path $editorServicesProtocolDllItem.FullName

    $Global:CurrentAlcCompilerPath = $CompilerFolder;
}

function Test-PragmaDisabled {
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode,
        [Parameter(Mandatory = $true, Position = 2, ValueFromPipeline = $true)]
        [string] $PragmaType
    )
    $syntaxTree = $SyntaxNode.SyntaxTree
    $alRootSyntaxNode = $syntaxTree.GetRoot()
    $pragmas = $alRootSyntaxNode.DescendantTrivia() | Where-Object { ($_.Kind -eq [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind]::PragmaWarningDirectiveTrivia -and ($_.SpanStart -lt $SyntaxNode.SpanStart)) } | Select-Object -Last 1   
    $pragmaDisabled = $false
    foreach ($pragma in $pragmas) {
        $pragmaText = $pragma.ToString()
        if ($pragmaText -match "disable +kvs_invalid_application_area") {
            $pragmaDisabled = $true
        }
        elseif ($pragmaText -match "restore +kvs_invalid_application_area") {
            $pragmaDisabled = $false
        }
        if ($pragma.SpanStart -gt $SyntaxNode.SpanStart) {
            break;
        }        
    }        
    return $pragmaDisabled
}

function Add-VisualStudioCodeProject {
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
    [System.Object[]] $tryAddOrUpdateProjectParameter = $settings, $diagnostics, $projectManifest, $missingSymbols
    
    # Rufe Methode mit folgender Signatur auf "internal bool TryAddOrUpdateProject(Settings settings, out IList<Diagnostic> diagnostics, out ProjectManifest? manifest, out bool missingSymbols)"
    $tryAddOrUpdateProjectBindingFlags = [System.Reflection.BindingFlags]::NonPublic -bor [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::Public -bor [System.Reflection.BindingFlags]::InvokeMethod
    $tryAddOrUpdateProjectBindingMethod = [Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace].GetMethod("TryAddOrUpdateProject", $tryAddOrUpdateProjectBindingFlags)
    $success = $tryAddOrUpdateProjectBindingMethod.Invoke($VSCodeWorkSpace, $tryAddOrUpdateProjectParameter)
    if (-not $success) {
        throw "Could not add project $path to visual studio code workspace"
    }
    return $VSCodeWorkSpace
}

function Get-VisualStudioCodeProjects {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace] $VSCodeWorkSpace     
    )         
    $solution = $VSCodeWorkSpace.CurrentSolution
    $projects = $solution.Projects    
    return $projects
}


function New-VSCodeWorkspace {    
    $hostServices = [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Host.HostServices]::DefaultHost
    $background = $true
    $vsCodeWorkspace = New-Object 'Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace' -ArgumentList @($hostServices, $background)
    return $vsCodeWorkSpace
}

function Get-ALDocument {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Project] $Project,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $DocumentName
    )
    foreach ($Document in $Project.Documents) {
        if ([System.IO.Path]::GetFullPath($Document.Name) -eq [System.IO.Path]::GetFullPath($DocumentName)) {
            return $Document
        }
    }
    return $null
}

function Get-RuntimeVersion {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Project] $Project        
    )
    $parseOptions = $Project.ParseOptions
    $runtimeVersion = $parseOptions.RuntimeVersion    
    return $runtimeVersion
}


function Get-ALDocumentState {
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

function Get-ALDocumentSemanticModel {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )
    $SemanticModel = $Document.GetSemanticModelAsync().GetAwaiter().GetResult()
    return $SemanticModel

}

function Get-ALDocumentSyntaxTree {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )    
    $SyntaxTree = $Document.GetSyntaxTreeAsync().GetAwaiter().GetResult()
    return $SyntaxTree    
}

function Get-ALDocumentRootSyntaxNode {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )
    $syntaxNode = $Document.GetSyntaxRootAsync().GetAwaiter().GetResult()
    return $syntaxNode
}

function Get-SyntaxTree {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Project] $Project,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $ALPath
    )
    $content = Get-Content -Path $ALPath -Raw -Encoding UTF8
    $version = Get-RuntimeVersion $Project
    $parseOptions = New-Object "Microsoft.Dynamics.Nav.CodeAnalysis.ParseOptions" $version    
    try {
        $syntaxTree = [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.SyntaxTree]::ParseObjectText($content, $ALPath, [System.Text.Encoding]::UTF8, $parseOptions);        
    }
    catch {
        Write-Warning "Failed to parse $($alFile)"
        continue
    }          
    return $syntaxTree
}

function Get-ChildSyntaxNodes {
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode,
        [Parameter(Mandatory = $true, Position = 2)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind] $SyntaxKind       
    )
           
    $childNodes = $SyntaxNode.DescendantNodes() | Where-Object { $_.Kind -eq $SyntaxKind }
    return $childNodes
}

function Select-MethodDeclarationNodes {
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNode        
    )           
    return Get-ChildSyntaxNodes $SyntaxNode ([Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind]::MethodDeclaration)
}

function Select-VariableNodes {
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode        
    )           
    return $MethodDeclarationSyntaxNode.Variables    
}

function Select-ParameterListNodes {
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode        
    )           
    return $MethodDeclarationSyntaxNode.ParameterList    
}

function Get-BodyNode {
    param (         
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MethodDeclarationSyntax] $MethodDeclarationSyntaxNode        
    )           
    return $MethodDeclarationSyntaxNode.Body    
}

function Get-ProjectFolderPath {
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [string]$AlFile        
    )
    $currentPath = $AlFile;
    do {
        $currentPath = [System.IO.Path]::GetDirectoryName($currentPath);
        $vscodeDir = [System.IO.Path]::Combine($currentPath, ".vscode");
    } until ((Test-Path($vscodeDir)) -or ($vscodeDir -eq [System.IO.Path]::GetPathRoot($vscodeDir)))

    if ($vscodeDir -eq [System.IO.Path]::GetPathRoot($vscodeDir)) {
        return $null
    }
    return $currentPath
}

function Get-ObjectInfo {
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document        
    )
    $alRootSyntaxNode = Get-ALDocumentRootSyntaxNode $Document
    $childNodes = [Linq.Enumerable]::ToArray($alRootSyntaxNode.ChildNodes())    
    $objectNode = $childNodes[0]
    if (-not $objectNode ) {
        return $null
    }    
    $childNodes = [Linq.Enumerable]::ToArray($alRootSyntaxNode.ChildNodes())    
    if (-not ($childNodes)) {
        return $null
    }
    $objectNode = $childNodes[0]
    if (-not ($objectNode)) {
        return $null
    }

    if (-not $objectNode.ObjectId) {
        return $null
    }
    if (-not $objectNode.ObjectId.Value) {
        return $null
    }
    if (-not $objectNode.ObjectId.Value.ValueText) {
        return $null
    }
    $objectId = $objectNode.ObjectId.Value.ValueText

    if (-not $objectNode.Name) {
        return $null
    }

    if (-not $objectNode.Name.Identifier) {
        return $null
    }

    if (-not $objectNode.Name.Identifier.ValueText) {
        return $null
    }
    $objectName = $objectNode.Name.Identifier.ValueText   
    if ($objectName.StartsWith('"') -and $objectName.EndsWith('"')) {
        $objectName = $objectName.Substring(1, $objectName.Length - 2)
    }

    if (-not $objectNode.Kind) {
        return $null
    }
    $objectKind = "$($objectNode.Kind)"
    $objectType = $objectKind.ToLower() -replace "object", "" 
    $result = [PSCustomObject]@{
        "ObjectId"         = $objectId
        "ObjectName"       = $objectName
        "ObjectType"       = $objectType 
        "ObjectSyntaxNode" = $objectNode
    }
    return $result
}


function Write-Result {
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [PSCustomObject]$ResultObject        
    )
    Write-Host ">>>ResultObject>>>"
    ConvertTo-Json $ResultObject
    Write-Host "<<<ResultObject<<<"
}

function Get-AllDescendantPropertyNodes { 
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNote,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $PropertyName
    )
    $propertyNodes = $objectInfo.ObjectSyntaxNode.DescendantNodes() | Where-Object { ($_.Kind -eq [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind]::Property) -and ($_.Name.Identifier.ValueText -eq $PropertyName) }   
    return $propertyNodes    
}

function Get-SyntaxNodeProperty { 
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $SyntaxNote,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $PropertyName
    )
    if (-not $syntaxNote.PropertyList) {
        return $false
    } 

    $properties = $syntaxNote.PropertyList.Properties
    if (-not $properties) {
        return $false
    } 
    $property = $properties | Where-Object { $_.Name -and $_.Name.Identifier -and $_.Name.Identifier.ValueText -eq $propertyName } | Select-Object -First 1    
    return $property
}

function Get-ApplicationAreas { 
    param (
        [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document
    )    
    $rootSyntaxNode = Get-ALDocumentRootSyntaxNode $Document
    $applicationAreaPropertyNodes = Get-AllDescendantPropertyNodes $rootSyntaxNode 'ApplicationArea'
    return $applicationAreaPropertyNodes
}

function Test-HasSyntaxNodeProperty { 
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $syntaxNote,
        [Parameter(Mandatory = $true, Position = 2)]
        [string] $propertyName
    )
    $prop = Get-SyntaxNodeProperty $syntaxNote $propertyName
    if ($prop) {
        return $true
    }
    return $false
}

function Get-PageActions {
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document                 
    )
    $objectInfo = Get-ObjectInfo $Document  
    if (-not $objectInfo) {
        return $null
    }
  
    $actions = $objectInfo.ObjectSyntaxNode.DescendantNodes() | Where-Object { $_.Kind -eq [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind]::PageAction }   
    return $actions
}


function Get-PropertyValuePosition{
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.PropertySyntax] $propertySyntaxNote       
    )
    return Get-SyntaxNodePosition $propertySyntaxNote.Value
}

function Get-SyntaxNodePosition{
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxNode] $syntaxNote       
    )

    $location = $syntaxNote.GetLocation().GetLineSpan()    
    return $location;
}

function Test-ApplicationAreaValidity {
    param (         
        [Parameter(Mandatory = $true, Position = 1)]
        [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Document] $Document,
        [Parameter(Mandatory = $true, Position = 2)]
        [string[]] $ValidApplicationAreas
    )        

    if (-not $ValidApplicationAreas) {
        return
    }

    $objectInfo = Get-ObjectInfo $Document      
    if (-not $objectInfo) {
        return
    } 
    
    $applicationAreaPropertyNodes = Get-ApplicationAreas $Document
    if (-not $applicationAreaPropertyNodes) {
        return
    } 

    $multiAppAreasInvalid = $false
    foreach ($applicationAreaPropertyNode in $applicationAreaPropertyNodes) {
        if (-not (Test-PragmaDisabled $applicationAreaPropertyNode 'kvs_invalid_application_area')) {
            $diagnosticDescriptionMessage = $null
            foreach ($applicationAreaValue in $applicationAreaPropertyNode.Value.Values) {
                $applicationAreaValueText = $applicationAreaValue.Identifier.ValueText
                if (-not ($ValidApplicationAreas -ccontains $applicationAreaValueText)) {
                    if (-not $diagnosticDescriptionMessage) {
                        $diagnosticDescriptionMessage = "ApplicationArea $applicationAreaValueText"
                    }
                    else {
                        $multiAppAreasInvalid = $true
                        $diagnosticDescriptionMessage += ", $applicationAreaValueText"
                    }
                }
            }  

            if ($diagnosticDescriptionMessage) {
                if ($multiAppAreasInvalid) {
                    $diagnosticDescriptionMessage += " are"
                }
                else {
                    $diagnosticDescriptionMessage += " is"
                }
                $diagnosticDescriptionMessage += " invalid AL-EXT-COP(001))"

                #Line = $applicationAreaPropertyValueNode.Location.GetLineSpan().StartLinePosition.Line  # Internal. 
                $position = Get-PropertyValuePosition $applicationAreaPropertyNode

                $invalidApplicationAreaDiagnostic = [PSCustomObject]@{
                    DiagnosticSeverity = "Error" #Hidden, Info, Warning, Error
                    Title              = "Invalid Application Area"
                    Description        = $diagnosticDescriptionMessage
                    StartLinePositionLine = $position.StartLinePosition.Line
                    StartCharacter    = $position.StartLinePosition.Character
                    EndLinePositionLine  = $position.EndLinePosition.Line
                    EndCharacter        = $position.EndLinePosition.Character
                }
                $ResultObject.Diagnostics += $invalidApplicationAreaDiagnostic
            }      
        }
    }    
}

function New-AnalysisReport {
    param (
        [Parameter(Mandatory = $true, Position = 1)]
        [string]$AlcFolderPath,
        [Parameter(Mandatory = $true, Position = 2)]
        [string]$AlFile,
        [Parameter(Mandatory = $true, Position = 3)]
        [boolean]$CheckApplicationAreaValidity,
        [Parameter(Mandatory = $true, Position = 4)]
        [string[]]$ValidApplicationAreas
    )
    if (-not(Test-Path($AlFile))) {
        Write-Result $resultObject
        return
    }        
    
    Import-CompilerDlls -CompilerFolder $AlcFolderPath    
    $vsCodeProjectPath = Get-ProjectFolderPath $AlFile
    if (-not $vsCodeProjectPath) {
        # No project to file found. How to parse without knowing the runtime version? Aborting with empty result.
        Write-Result $resultObject
        return
    }    
    $vsCodeWorkSpace = New-VSCodeWorkspace     
    Add-VisualStudioCodeProject $vsCodeWorkSpace $vsCodeProjectPath    
    $vsCodeProject = Get-VisualStudioCodeProjects $vsCodeWorkSpace | Select-Object -First 1    
    $alDocument = Get-ALDocument $vsCodeProject -DocumentName $AlFile    
    if ($CheckApplicationAreaValidity) {
        Test-ApplicationAreaValidity $alDocument $ValidApplicationAreas
    }
    Write-Result $resultObject
}

New-AnalysisReport -AlcFolderPath $AlcFolderPath `
    -AlFile $ALFileToCheck `
    -CheckApplicationArea $CheckApplicationAreaValidity `
    -ValidApplicationAreas $ValidApplicationAreas `


#Write-Result $ResultObject

<#
$compilerDlls = Get-ChildItem -Path $CompilerFolder -Filter "*.dll" -Recurse        
foreach ($compilerDll in $compilerDlls) { 
   try{
        Add-Type -Path "$($compilerDll.FullName)" -ErrorAction SilentlyContinue
        $hostServices = [Microsoft.Dynamics.Nav.CodeAnalysis.Workspaces.Host.HostServices]::DefaultHost
        $background = $true
        $vsCodeWorkspace = New-Object 'Microsoft.Dynamics.Nav.EditorServices.Protocol.VsCodeWorkspace' -ArgumentList @($hostServices, $background)
        Write-Host $compilerDll 
    }catch{
        #Write-Error $compilerDll 
    }
} 
#> 