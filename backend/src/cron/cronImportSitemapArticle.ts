import { CronJob }      from 'cron';
import Vanityfair       from '../siteScrapers/api/Vanityfair';
import IlCorriereDellaCitta       from '../siteScrapers/api/IlCorriereDellaCitta';

const job = new CronJob(
	'*/50 * * * *', // cronTime
	function () {		
        // new Vanityfair('readSitemap');        
        new IlCorriereDellaCitta('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);