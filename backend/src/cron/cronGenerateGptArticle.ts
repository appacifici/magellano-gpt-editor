import { CronJob } from 'cron';
import ChatGptApi       from '../services/ChatGptApi';

const job = new CronJob(
	'*/5 * * * *', // cronTime
	function () {		
        const chatGptApi:ChatGptApi = new ChatGptApi();
		chatGptApi.getArticleBySiteAndGenerate('vanityfair.it', 0);
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);