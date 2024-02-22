import { CronJob } 		from 'cron';
import WordpressApi     from '../services/WordpressApi';

const job = new CronJob(
	'*/10 * * * *', // cronTime
	function () {		
		const wodpressApi = new WordpressApi();
        wodpressApi.getImagesFromWordPress('roma.cronacalive.it'); 
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);