import { Command }      from 'commander';
import Vanityfair       from '../siteScrapers/api/Vanityfair';

const program = new Command();
program.version('1.0.0').description('CLI team commander') 
    .option('-s, --site <type>', 'Sito da lanciare')
    .option('-a, --action <type>', 'Azione da lanciare')
    .action((options) => {            
        switch( options.site ) {            
            case 'vanityfair.it':                       
                new Vanityfair(options.action);                
            break;
        }
    });
program.parse(process.argv);

//NODE_ENV=development npx ts-node src/commands/importSitemapArticle.ts -s vanityfair.it -a readSitemap