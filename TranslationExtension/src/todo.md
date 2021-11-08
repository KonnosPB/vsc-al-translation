# TODO Liste
- Language Service bietet eine Funktion welchee die SourceXML findet   
  _Fehlermeldung wenn die Source XML nicht da ist_

- Language Service bietet eine Funktion welche die SourceXML in ein Daten Array umwandelt.   
  _So performant wie möglich_

- Language Service bietet eine Funktion welche die TargetXml in ein Daten Array umwandelt.   

- Language Service bietet eine Funktion welche die TargetXml gegen die SourceXml validiert. Das Ergebnis wird im TargetXml DatenArray angereichert.
  - _Überschüssige Einträge der TargetXml sollen ebenfalls erfasst werden_
  - _Die Prüfung auf Einzeleinträge aber auch auf alles zusammen muss möglich sein_

- Language Service biete ein Event bei einer externen Aktualisierung der SourceXML
  - _Wenn sich die SourceXML ändert muss eine AktualisierungsEvent die Validierung gegen ein TargetXML anstoßen_

- Xlf Source Document Provider bietet eine Readonly View für die Source-Xlf Datei

- Xlf Target Document Provider bietet eine Editierbare View für die Target-Xlf Datei

- YaTT Target Viewer bietet eine editierbare Tabelle an  
  -  _Spalten filterbar_
  -  _Spalten sortierbar_
  -  _Teilaktualisierung ist möglich. Nicht der komplette Inhalt wird aktualisiert_
  -  _Undo/Redo_
  
- Extension bietet ein TranslationProvider im Target Viewer Modus an.
  - _Powershell Provider_
  - _C/AL Txt Provider_
  - _Einrichtung möglich_

- Extension Features
  - Undo/Redo
  - Save
  - Reload
  - Übersetzungsvorschlag
  - 