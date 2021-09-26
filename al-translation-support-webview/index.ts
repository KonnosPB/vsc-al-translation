import * as fs from 'fs';

import {LanguageParser} from './LanguageParser'


var lp = new LanguageParser('D:\\Repos\\GitHub\\KonnosPB\\vsc-al-translation\\DemoTranslationFiles\\Med\\');

const result = lp.calcDataGridAsync();
result.then(value=>{

});
result.catch(reason=>{

});