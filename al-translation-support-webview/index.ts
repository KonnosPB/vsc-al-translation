import * as fs from 'fs';

import {LanguageParser} from './LanguageParser'


var lp = new LanguageParser('D:\\Repos\\GitHub\\KonnosPB\\vsc-al-translation\\DemoTranslationFiles\\Med\\');

const result = lp.calcDataGridAsync();
result.then(async value=>{
    const isDirty = await lp.isDirtyAsync();
    console.info(isDirty);
    const dataSource = await lp.buildDataAsync();
    const diagnostics = await lp.getDiagnosticsAsync();

});
result.catch(reason=>{
    console.error(reason);

});