import { CronJob }      from 'cron';
import Vanityfair       from '../siteScrapers/api/Vanityfair';

const job = new CronJob(
	'*/30 * * * *', // cronTime
	function () {		
        new Vanityfair('readSitemap');        
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);