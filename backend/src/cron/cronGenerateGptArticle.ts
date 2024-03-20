import { CronJob } 		from 'cron';
import ChatGptApi       from '../services/ChatGptApi';
import OpenAiService from '../services/OpenAi/OpenAiService';

const job = new CronJob(
	'* * * * *', // cronTime
	function () {		
        const openAiService: OpenAiService  = new OpenAiService();
		openAiService.getInfoPromptAi('bluedizioni.it', "65fac26a927f73f984737a0d", 0);
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);