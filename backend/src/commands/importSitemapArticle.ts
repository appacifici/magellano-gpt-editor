import { Command }      from 'commander';
import Vanityfair       from '../siteScrapers/api/Vanityfair';
import IlCorriereDellaCitta from '../siteScrapers/api/IlCorriereDellaCitta';
import RomaToday from '../siteScrapers/api/RomaToday';
import GalleriaBorghese from '../siteScrapers/api/GalleriaBorghese';
import BluesHouse from '../siteScrapers/api/BluesHouse';
import AraboNormannaUnesco from '../siteScrapers/api/AraboNormannaUnesco';
import DinamycScraper from '../siteScrapers/api/DinamycScraper';

const program = new Command();
program.version('1.0.0').description('CLI team commander') 
    .option('-s, --site <type>', 'Sito da lanciare')
    .option('-a, --action <type>', 'Azione da lanciare')
    .action((options) => {            
        switch( options.site ) {            
            case 'vanityfair.it':                       
                new Vanityfair(options.action);                
            break;
            case 'ilcorrieredellacitta.com':                       
                new IlCorriereDellaCitta(options.action);                
            break;
            case 'romatoday.it':                       
                new RomaToday(options.action);                
            break;
            // case 'galleriaborghese.it':                       
            //     new GalleriaBorghese(options.action);                
            // break;
            // case 'blueshouse.it':                       
            //     new BluesHouse(options.action);                
            // break;
            // case 'arabonormannaunesco.it':
            //     new AraboNormannaUnesco(options.action);                
            // break;
            case 'galleriaborghese.it':
            case 'blueshouse.it':
            case 'arabonormannaunesco.it':
            case 'inabruzzo.it':                       
            case 'ilciriaco.it':                       
            case 'larchitetto.it':                       
            case 'biopianeta.it':                       
            case 'wineandfoodtour.it':                       
                new DinamycScraper(options.action, options.site);                
            break;
        }
    });
program.parse(process.argv);

//NODE_ENV=development npx ts-node src/commands/importSitemapArticle.ts -s vanityfair.it -a readSitemap