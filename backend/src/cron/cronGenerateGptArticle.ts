import { CronJob } 		from 'cron';
import ChatGptApi       from '../services/ChatGptApi';
import OpenAiService from '../services/OpenAi/OpenAiService';
import { NextArticleGenerate } from '../services/OpenAi/Interface/OpenAiInterface';

new CronJob(
	'*/4 * * * *', // cronTime
	async function () {		
        const openAiService: OpenAiService  					= new OpenAiService();
		const nextArticleGenerate:NextArticleGenerate|null 		= await openAiService.getNextArticleGenerate('roma.cronacalive.it', 0);
		if( nextArticleGenerate !== null && nextArticleGenerate.article !== null ) {
			const processName:string                			= `roma.cronacalive.it ${nextArticleGenerate.article._id}`;
			const alertProcess:string               			= openAiService.alertUtility.initProcess(processName); //. date('YmdHis')
			openAiService.alertUtility.setLimitWrite(60000);

			await openAiService.getInfoPromptAi(alertProcess, processName, 'roma.cronacalive.it', "65fdb1790b624b6378727c20", 0);
			openAiService.alertUtility.write(alertProcess, processName);
		}
	},
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);


new CronJob(
	'*/3 * * * *', // cronTime
	async function () {		        
		const openAiService: OpenAiService  					= new OpenAiService();
		const nextArticleGenerate:NextArticleGenerate|null 		= await openAiService.getNextArticleGenerate('bluedizioni.it', 0);
		if( nextArticleGenerate !== null && nextArticleGenerate.article !== null ) {
			const processName:string                			= `bluedizioni.it ${nextArticleGenerate.article._id}`;
			const alertProcess:string               			= openAiService.alertUtility.initProcess(processName); //. date('YmdHis')
			openAiService.alertUtility.setLimitWrite(60000);
			openAiService.getInfoPromptAi(alertProcess, processName, 'bluedizioni.it', "65fdb1790b624b6378727c21", 0);
		}
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);