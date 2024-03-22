import { CronJob } 		from 'cron';
import WordpressApi     from '../services/WordpressApi';

new CronJob(
	'*/30 * * * *', // cronTime
	function () {		
		const wodpressApi = new WordpressApi();
        wodpressApi.sendToWPApi('roma.cronacalive.it', 0); 
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'*/25 * * * *', // cronTime
	function () {		
		const wodpressApi = new WordpressApi();
        wodpressApi.sendToWPApi('bluedizioni.it', 0); 
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);




