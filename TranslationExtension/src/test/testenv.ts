import * as path from 'path';

export class data {   
	public static getXlfDEPath():string{
		const p = path.resolve(__dirname, '../../test-resources/KUMAVISION med.de-DE.xlf');
		return p ;
	}
	
	public static getXlfGlobalPath():string{
		const p = path.resolve(__dirname, '../../test-resources/KUMAVISION med.g.xlf');
		return p ;
	}
}