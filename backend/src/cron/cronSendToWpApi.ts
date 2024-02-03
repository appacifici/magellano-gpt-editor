import { CronJob } from 'cron';
import WordpressApi      from '../services/WordpressApi';

const job = new CronJob(
	'*/10 * * * *', // cronTime
	function () {		
		const wodpressApi = new WordpressApi();
        wodpressApi.sendToWPApi('vanityfair.it', 0); 
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);