import { CronJob }      from 'cron';
import Vanityfair       from '../siteScrapers/api/Vanityfair';
import IlCorriereDellaCitta       from '../siteScrapers/api/IlCorriereDellaCitta';
import GalleriaBorghese from '../siteScrapers/api/GalleriaBorghese';
import BluesHouse from '../siteScrapers/api/BluesHouse';
import AraboNormannaUnesco from '../siteScrapers/api/AraboNormannaUnesco';

const job = new CronJob(
	'*/50 * * * *', // cronTime
	function () {		
        new GalleriaBorghese('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

const job2 = new CronJob(
	'*/45 * * * *', // cronTime
	function () {		  
        new BluesHouse('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

const job3 = new CronJob(
	'*/40 * * * *', // cronTime
	function () {		
        new AraboNormannaUnesco('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);