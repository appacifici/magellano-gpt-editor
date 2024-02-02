import { Command }      from 'commander';
import Vanityfair       from '../siteScrapers/api/Vanityfair';
import WordpressApi      from '../services/WordpressApi';

const program = new Command();
program.version('1.0.0').description('CLI team commander') 
    .option('-s, --site <type>', 'Sito da lanciare')
    .action((options) => {            
        const wodpressApi = new WordpressApi();
        switch( options.site ) {            
            case 'vanityfair.it':                                       
                wodpressApi.sendToWPApi(options.site, 0);
            break;
        } 
    });
program.parse(process.argv);

//NODE_ENV=development npx ts-node src/commands/sendToWpApi.ts -s vanityfair.it