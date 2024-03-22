import { CronJob }      from 'cron';
import Vanityfair       from '../siteScrapers/api/Vanityfair';
import IlCorriereDellaCitta       from '../siteScrapers/api/IlCorriereDellaCitta';
import GalleriaBorghese from '../siteScrapers/api/GalleriaBorghese';
import BluesHouse from '../siteScrapers/api/BluesHouse';
import RomaToday from '../siteScrapers/api/RomaToday';
import DinamycScraper from '../siteScrapers/api/DinamycScraper';

new CronJob(
	//'*/30 * * * *', //ogni 30 minuti
	'20 * * * *', // 00:30 1:30 2:30
	function () {		
        new Vanityfair('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'22 * * * *', // cronTime
	function () {		
        new IlCorriereDellaCitta('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'24 * * * *', // cronTime
	function () {		
        new RomaToday('readGzSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);


new CronJob(
	'26 * * * *', // cronTime
	function () {		
        new GalleriaBorghese('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'28 * * * *', // cronTime
	function () {		  
        new BluesHouse('readSitemap');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'30 * * * *', // cronTime
	function () {		
        new DinamycScraper('readSitemap','arabonormannaunesco.it');      
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'32 * * * *', // cronTime
	function () {		        
		new DinamycScraper('readSitemap', 'inabruzzo.it');       
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'34 * * * *', // cronTime
	function () {		
		new DinamycScraper('readSitemap', 'ilciriaco.it');       
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'36 * * * *', // cronTime
	function () {		
		new DinamycScraper('readSitemap', 'larchitetto.it');       
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'38 * * * *', // cronTime
	function () {		
		new DinamycScraper('readSitemap', 'biopianeta.it');       
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);

new CronJob(
	'40 * * * *', // cronTime
	function () {		
		new DinamycScraper('readSitemap', 'wineandfoodtour.it');       
	}, // onTick
	null, // onComplete
	true, // start
	'Europe/Rome' // timeZone
);