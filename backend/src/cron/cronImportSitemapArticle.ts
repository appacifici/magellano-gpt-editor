import { CronJob }      from 'cron';
import Vanityfair       from '../siteScrapers/api/Vanityfair';
import IlCorriereDellaCitta       from '../siteScrapers/api/IlCorriereDellaCitta';

const job = new CronJob(
	'* * * * *', // cronTime
	function () {		
        // new Vanityfair('readSitemap');        
        new IlCorriereDellaCitta('readSitemap');      
		process.exit(1);   
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);