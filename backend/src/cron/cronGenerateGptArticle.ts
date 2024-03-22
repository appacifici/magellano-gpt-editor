import { CronJob } 		from 'cron';
import ChatGptApi       from '../services/ChatGptApi';
import OpenAiService from '../services/OpenAi/OpenAiService';

new CronJob(
	'*/4 * * * *', // cronTime
	function () {		
        const openAiService: OpenAiService  = new OpenAiService();
		openAiService.getInfoPromptAi('roma.cronacalive.it', "65fdb1790b624b6378727c20", 0);
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);


new CronJob(
	'*/3 * * * *', // cronTime
	function () {		
        const openAiService: OpenAiService  = new OpenAiService();
		openAiService.getInfoPromptAi('bluedizioni.it', "65fdb1790b624b6378727c21", 0);
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);