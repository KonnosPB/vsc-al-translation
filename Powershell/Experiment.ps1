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
        $currToken = $descendantToken.ToString()     
        if ($currToken -eq ')' -or $currToken -eq '('){
            $parent = $descendantToken.Parent
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
        $SerializedNodeString += $SyntaxNode.ToString().ToLower()
    }
    return $SerializedNodeString
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
        <#
        switch($Statement.Kind){    # M�gliche Kind : None,EmptyToken,Int32LiteralToken,Int64LiteralToken,DecimalLiteralToken,DateLiteralToken,TimeLiteralToken,DateTimeLiteralToken,StringLiteralToken,XmlEntityLiteralToken,XmlTextLiteralToken,XmlTextLiteralNewLineToken,IdentifierToken,BadToken,FalseKeyword,TrueKeyword,RDivToken,PlusToken,MinusToken,MultiplyToken,IDivKeyword,ModuloKeyword,AssignToken,AssignRDivToken,AssignPlusToken,AssignMinusToken,AssignMultiplyToken,LessThanToken,LessThanEqualsToken,NotEqualsToken,EqualsToken,GreaterThanToken,GreaterThanEqualsToken,CommaToken,DotToken,ColonToken,SemicolonToken,ColonColonToken,DotDotToken,AtToken,MinusMinusToken,PlusPlusToken,DoubleQuoteToken,SingleQuoteToken,QuestionToken,AmpersandToken,BarToken,CaretToken,PercentToken,TildeToken,EqualsEqualsToken,ExclamationEqualsToken,ExclamationToken,LessThanLessThanToken,HashToken,OpenParenToken,CloseParenToken,OpenBracketToken,CloseBracketToken,OpenBraceToken,CloseBraceToken,AndKeyword,OrKeyword,XorKeyword,NotKeyword,ExitKeyword,BeginKeyword,CaseKeyword,DoKeyword,DownToKeyword,ElseKeyword,EndKeyword,ForKeyword,IfKeyword,InKeyword,OfKeyword,RepeatKeyword,ThenKeyword,ToKeyword,UntilKeyword,WithKeyword,WhileKeyword,ProgramKeyword,ProcedureKeyword,FunctionKeyword,VarKeyword,ArrayKeyword,TemporaryKeyword,LocalKeyword,InternalKeyword,ProtectedKeyword,EventKeyword,AssertErrorKeyword,SuppressDisposeKeyword,SecurityFilteringKeyword,ForEachKeyword,TriggerKeyword,CodeunitKeyword,TableKeyword,TableDataKeyword,SystemKeyword,PageKeyword,ReportKeyword,QueryKeyword,XmlPortKeyword,ControlAddInKeyword,ProfileKeyword,ProfileExtensionKeyword,DotNetKeyword,PageCustomizationKeyword,CustomizesKeyword,FieldsKeyword,FieldKeyword,AssemblyKeyword,TypeKeyword,BreakKeyword,FieldGroupsKeyword,FieldGroupKeyword,KeysKeyword,KeyKeyword,PageLayoutKeyword,PageAreaKeyword,PageGroupKeyword,PageRepeaterKeyword,PageCueGroupKeyword,PageFixedKeyword,PageGridKeyword,PagePartKeyword,PageSystemPartKeyword,PageChartPartKeyword,PageUserControlKeyword,ActionsKeyword,ActionKeyword,SeparatorKeyword,TableExtensionKeyword,PageExtensionKeyword,ExtendsKeyword,AddFirstKeyword,AddLastKeyword,AddBeforeKeyword,AddAfterKeyword,MoveFirstKeyword,MoveLastKeyword,MoveBeforeKeyword,MoveAfterKeyword,ModifyKeyword,DataSetKeyword,DataItemKeyword,ColumnKeyword,LabelsKeyword,LabelKeyword,RequestPageKeyword,XmlPortSchemaKeyword,XmlPortTableElementKeyword,XmlPortFieldElementKeyword,XmlPortTextElementKeyword,XmlPortFieldAttributeKeyword,XmlPortTextAttributeKeyword,FilterKeyword,QueryElementsKeyword,AndFilterKeyword,OrFilterKeyword,EnumKeyword,EnumExtensionKeyword,EnumValueKeyword,ViewsKeyword,ViewKeyword,ReportExtensionKeyword,AddKeyword,InterfaceKeyword,ImplementsKeyword,PermissionSetKeyword,PermissionSetExtensionKeyword,EntitlementKeyword,WhereFormulaKeyword,FieldFormulaKeyword,ConstFormulaKeyword,FilterFormulaKeyword,UpperLimitFormulaKeyword,ExistCalculationFormulaKeyword,CountCalculationFormulaKeyword,SumCalculationFormulaKeyword,AverageCalculationFormulaKeyword,MinCalculationFormulaKeyword,MaxCalculationFormulaKeyword,LookupCalculationFormulaKeyword,OrderKeyword,SortingKeyword,AscendingKeyword,DescendingKeyword,ElifKeyword,EndIfKeyword,RegionKeyword,EndRegionKeyword,DefineKeyword,UndefKeyword,PragmaKeyword,WarningKeyword,DisableKeyword,RestoreKeyword,EnableKeyword,ImplicitWithKeyword,SlashGreaterThanToken,LessThanSlashToken,XmlCommentStartToken,XmlCommentEndToken,XmlCDataStartToken,XmlCDataEndToken,XmlProcessingInstructionStartToken,XmlProcessingInstructionEndToken,EndOfDocumentationCommentToken,EndOfDirectiveToken,EndOfFileToken,List,EndOfLineTrivia,WhiteSpaceTrivia,CommentTrivia,LineCommentTrivia,DocumentationCommentExteriorTrivia,SingleLineDocumentationCommentTrivia,MultiLineDocumentationCommentTrivia,SkippedTokensTrivia,DisabledTextTrivia,BooleanLiteralValue,Int32SignedLiteralValue,Int64SignedLiteralValue,DecimalSignedLiteralValue,DateLiteralValue,TimeLiteralValue,DateTimeLiteralValue,StringLiteralValue,AssignmentStatement,CompoundAssignmentStatement,IfStatement,OrphanedElseStatement,CaseStatement,RepeatStatement,WhileStatement,ForStatement,ForEachStatement,ExitStatement,Block,WithStatement,EmptyStatement,ExpressionStatement,AssertErrorStatement,BreakStatement,ParenthesizedExpression,AddExpression,SubtractExpression,MultiplyExpression,DivideExpression,IntegerDivideExpression,ModuloExpression,EqualsExpression,NotEqualsExpression,GreaterThanExpression,GreaterThanOrEqualExpression,LessThanExpression,LessThanOrEqualExpression,LogicalOrExpression,LogicalAndExpression,LogicalXorExpression,RangeExpression,UnaryPlusExpression,UnaryMinusExpression,UnaryNotExpression,ArrayIndexExpression,InvocationExpression,MemberAccessExpression,OptionAccessExpression,InListExpression,LiteralExpression,IdentifierOrLiteralExpression,IdentifierName,QualifiedName,IdentifierNameOrEmpty,ArgumentList,BracketedArgumentList,CaseLine,CaseElse,CompilationUnit,PropertyList,OptionValues,ObjectReference,ObjectId,ObjectNameReference,ParameterList,MethodBody,VarSection,GlobalVarSection,TriggerDeclaration,EventTriggerDeclaration,MethodDeclaration,EventDeclaration,Parameter,VariableDeclaration,VariableListDeclaration,VariableDeclarationName,ReturnValue,SimpleTypeReference,RecordTypeReference,DotNetTypeReference,DataType,GenericDataType,OptionDataType,TextConstDataType,LabelDataType,DotNetDataType,LengthDataType,SubtypedDataType,EnumDataType,Array,BracketedDimensionList,Dimension,MemberAttribute,FieldList,Field,DotNetAssembly,DotNetTypeDeclaration,FieldExtensionList,FieldModification,KeyList,Key,FieldGroupList,FieldGroup,PageLayout,PageActionList,GroupActionList,PageArea,PageGroup,PageField,PageLabel,PagePart,PageSystemPart,PageChartPart,PageUserControl,PageAction,PageActionGroup,PageActionArea,PageActionSeparator,PageExtensionActionList,ActionAddChange,ActionMoveChange,ActionModifyChange,PageExtensionLayout,ControlAddChange,ControlMoveChange,ControlModifyChange,PageExtensionViewList,ViewAddChange,ViewMoveChange,ViewModifyChange,ReportDataSetSection,ReportLabelsSection,ReportDataItem,ReportColumn,ReportLabel,ReportLabelMultilanguage,XmlPortSchema,XmlPortTableElement,XmlPortFieldElement,XmlPortTextElement,XmlPortFieldAttribute,XmlPortTextAttribute,RequestPage,RequestPageExtension,QueryElements,QueryDataItem,QueryColumn,QueryFilter,Label,EnumType,EnumValue,EnumExtensionType,FieldGroupExtensionList,FieldGroupAddChange,PageViewList,PageView,ReportExtension,ReportExtensionModifyChange,ReportExtensionAddDataItemChange,ReportExtensionAddColumnChange,ReportExtensionDataSetSection,ReportExtensionDataSetAddColumn,ReportExtensionDataSetAddDataItem,ReportExtensionDataSetModify,Property,EmptyProperty,PropertyName,InvalidPropertyValue,Int32PropertyValue,Int64PropertyValue,DecimalPropertyValue,StringPropertyValue,TimePropertyValue,DatePropertyValue,DateTimePropertyValue,MultilanguagePropertyValue,LabelPropertyValue,EnumPropertyValue,BooleanPropertyValue,ImagePropertyValue,OptionValuePropertyValue,IdentifierOrLiteralPropertyValue,MemberAccessOrIdentifierPropertyValue,PageFieldReferencePropertyValue,LanguageId,TableRelationStatement,TableRelationJoinCondition,TableFilterExpression,ConstExpression,FieldFilterExpression,SimpleFieldExpression,FilterExpression,FieldUpperLimitExpression,FieldUpperLimitFilterExpression,InvalidFilterExpressionValue,InvalidPropertyExpression,IfTableRelationExpression,ElseTableRelationExpression,ExistCalculationFormulaStatement,CountCalculationFormulaStatement,SumCalculationFormulaStatement,AverageCalculationFormulaStatement,MinCalculationFormulaStatement,MaxCalculationFormulaStatement,LookupCalculationFormulaStatement,UnknownCalculationFormulaStatement,WhereExpression,DecimalPlaces,OptionValuesPropertyValue,PermissionPropertyValue,PermissionSyntaxPropertyValue,PermissionValue,CommaSeparatedPropertyValue,CommaSeparatedStringsPropertyValue,CommaSeparatedIdentifierEqualsStringList,CommaSeparatedIdentifierEqualsLiteralList,CommaSeparatedIdentifierEqualsStringListPropertyValue,CommaSeparatedIdentifierOrLiteralPropertyValue,CommaSeparatedIdentifierEqualsIdentifierList,CommaSeparatedIdentifierEqualsIdentifierPropertyValue,CommaSeparatedIdentifierEqualsIdentifierListPropertyValue,IdentifierEqualsString,IdentifierEqualsLiteral,IdentifierEqualsIdentifier,QualifiedObjectReferencePropertyValue,ObjectReferencePropertyValue,ExpressionPropertyValue,BooleanExpressionPropertyValue,ClientSideBooleanExpressionPropertyValue,IntegerExpressionPropertyValue,TextExpressionPropertyValue,DecimalPlacesPropertyValue,TableFilterPropertyValue,TableViewPropertyValue,FiltersPropertyValue,SortingExpression,OrderExpression,StyleExpressionPropertyValue,MemberReferencePropertyValue,MemberReferencePropertyValueSyntax,OrderByPropertyValue,OrderByExpression,QueryDataItemLinkPropertyValue,QueryDataItemLinkExpression,ReportDataItemLinkPropertyValue,ReportDataItemLinkExpression,ParenthesizedFilterExpressionValue,UnaryNotEqualsFilterExpression,UnaryEqualsFilterExpression,UnaryLessThanFilterExpression,UnaryLessThanEqualsFilterExpression,UnaryGreaterThanFilterExpression,UnaryGreaterThanEqualsFilterExpression,AndFilterExpression,OrFilterExpression,RangeBetweenFilterExpression,RangeFromFilterExpression,RangeToFilterExpression,CodeunitObject,TableObject,TableExtensionObject,PageObject,PageExtensionObject,ReportObject,XmlPortObject,QueryObject,ControlAddInObject,ReportExtensionObject,ProfileObject,ProfileExtensionObject,PageCustomizationObject,DotNetPackage,Interface,PermissionSet,PermissionSetExtension,Entitlement,AttributeArgumentList,LiteralAttributeArgument,MethodReferenceAttributeArgument,OptionAccessAttributeArgument,InvalidAttributeArgument,XmlName,XmlElement,XmlEmptyElement,XmlText,XmlCData,XmlProcessingInstruction,XmlComment,XmlElementStartTag,XmlElementEndTag,XmlTextAttribute,XmlNameAttribute,XmlPrefix,XmlCDataSection,DefineDirectiveTrivia,UndefDirectiveTrivia,IfDirectiveTrivia,ElifDirectiveTrivia,ElseDirectiveTrivia,EndIfDirectiveTrivia,RegionDirectiveTrivia,EndRegionDirectiveTrivia,PreprocessingMessageTrivia,BadDirectiveTrivia,PragmaWarningDirectiveTrivia,PragmaImplicitWithDirectiveTrivia,BadPragmaDirectiveTrivia        
            $([Microsoft.Dynamics.Nav.CodeAnalysis.SyntaxKind]::ExpressionStatement) {                
                # Offensichtlich recursive verarbeitung
                [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.ExpressionStatementSyntax] $ExpressionStatement = $Statement
                [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.InvocationExpressionSyntax] $InvocationExpression = $ExpressionStatement.Expression                
                $type = $InvocationExpression.GetType()  
                $childNodes = $InvocationExpression.ChildNodes()
                foreach($childNode in $childNodes){
                    [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.MemberAccessExpressionSyntax] $memberAccessExpressionSyntax = $childNode
                    [Microsoft.Dynamics.Nav.CodeAnalysis.Syntax.CodeExpressionSyntax] $codeAccessExpressionSyntax = $childNode
                    Write-Host $memberAccessExpressionSyntax
                }
                Write-Host $type #Was folgt als n�chstes
                
            }
        }
        #>    
    }
    Write-Host "Ausgabe f�r $($MethodDeclarationSyntaxNode.Name): $SerializedString"

    return $SerializedString
}

################################################################
# Hier geht der interessante Teil los
################################################################

# 1.) Alle Compiler DLL geladen, so dass sie via Powershell nutzbar sind
Import-CompilerDlls $alcCompilerBinDirpath

# 2.) Hier wird ein Visual Studio Code Workspace Editor Host Instanz erzeugt. Das h�chste Abstarktionslayer, welchen ich vorgefunden habe.
$vsCodeWorkSpace = New-VSCodeWorkspace 

# 3.) F�ge ein Projekt der Umgebung hinzu. Wie in VS-Code auch, kann das Objekt VSCodeWorkspace mehrere Projekte verwalten.
Add-ProjectPath $vsCodeWorkSpace $demoProjectDirPath

# 4.) Extrahiere aus dem einzigen Projekt ein "Project" Objekt.
$project = Get-Projects $vsCodeWorkSpace | Select-Object -First 1

# 5.) Unterhalb eines Projektes gibt es jede Menge Strukturen. Unter anderem auch ein "Document" Objekt, dass den Dateipfad als Name hat.
$document = Get-Document $project -DocumentName $documentName
$documentState = Get-DocumentState $document
$syntaxTree = Get-DocumentSyntaxTree $document
$rootSyntaxNode = Get-DocumentRootSyntaxNode $document # SyntaxNode Struktur kenn ich grob. Ziemlich detailiert und komplex.
$SemanticModel = Get-DocumentSemanticModel $document # Ist das besser geeignet als Syntax Knoten?

# Hier meine erste Idee
# <gel�st> Wie bekomme ich eine Methoden-Object? Syntax-Knoten oder semantische Model (was auch immer das ist?)
$methodDeclarations = Select-MethodDeclarationNodes $rootSyntaxNode

# <gel�st> Wie komme ich an die Variablen und ParameterList einer Methode? (Wieso? Ich will Variablennamen umbenennenen. Beispiel: SalesLineLoc soll zu "Sales Line" werden)
foreach($methodDeclaration in $methodDeclarations){
    $variableNodes = Select-VariableNodes $methodDeclaration 
    $parameterNodes = Select-ParameterListNodes $methodDeclaration 
}

# <gel�st> Wie bekomme ich den Method Body?
$bodyNode = Get-BodyNode $methodDeclaration 

# <einfache F�lle gel�st, Rec noch nicht>: Umwandlung der Anweisungen in einer Methode in eine Einzeiler-Zeichenkette im Stile von Stringify. 
# Dabei werden Variablenname durch ihren Typ ersetzt (Also aus SalesLineLoc wird "Sales Line"). Besondere Herausforderung: Rec muss auch zum Typen umgewandelt werden: Also aus Rec.SetRange oder SetRange => "Sales Line".SetRange
# Tipp f�r die Analyse: IlSpy (gibt es neuerdings im Windows-Store) => Microsoft.Dynamics.Nav.CodeAnalysis.dll
foreach($methodDeclaration in $methodDeclarations){
    $bodyOneLine = New-MethodBodyAsOneLiner $methodDeclaration
}

# TODO: Sammlung der umgewandelten Strings in ein Dictionary  <PositionsInfo, Umgewandelte Zeichenkette>.

# IDEE: Via naiver Volltextsuche werden die umgewandelten Strings miteinander Verglichen.  https://de.wikipedia.org/wiki/Knuth-Morris-Pratt-Algorithmus = Bei einem möglichen Treffer gibt es einen Hinweis an den Anwender. 

