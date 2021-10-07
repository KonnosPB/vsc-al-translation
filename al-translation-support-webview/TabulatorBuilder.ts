
import { json } from 'stream/consumers';
import { parseString, Builder } from "xml2js";
import { LanguageParser } from './LanguageParser';


export class TabulatorBuilder {
    private rootDirPath: string;
    constructor(rootDirPath: string) {
        this.rootDirPath = rootDirPath;
    }

    public async buildAsync(){
        var languageParser = new LanguageParser(this.rootDirPath);
        var tableData = await languageParser.buildDataAsync();

        var table = new Tabulator("#example-table", {
            data:await languageParser.buildDataAsync(),           //load row data from array
            layout:"fitColumns",      //fit columns to width of table
            responsiveLayout:"hide",  //hide columns that dont fit on the table
            tooltips:true,            //show tool tips on cells
            addRowPos:"top",          //when adding a new row, add it to the top of the table
            history:true,             //allow undo and redo actions on the table
            pagination:"local",       //paginate the data
            paginationSize:50,         //allow 7 rows per page of data
            movableColumns:true,      //allow column order to be changed
            resizableRows:true,       //allow row order to be changed
            initialSort:[             //set the initial sort order of the data
                {column:"name", dir:"asc"},
            ],
            columns:[                 //define the table columns
                {title:"Status", field:"languageParser", editor:"input"},
                {title:"Source (main)", field:"SourceText", hozAlign:"left", formatter:"progress", editor:true},
                {title:"Source", field:"SourceCopyText", width:95, editor:"select", editorParams:{values:["male", "female"]}},
                {title:"Target", field:"TargetText", formatter:"star", hozAlign:"center", width:100, editor:true},
                {title:"State", field:"state", width:130, editor:"input"},
                {title:"Object", field:"NavObject", width:130, sorter:"date", hozAlign:"center"},
                {title:"Element", field:"NavElement", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
                {title:"Subelement", field:"NavSubelement", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
                {title:"Comment", field:"NavComment", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
            ]
        });        
    }
}
