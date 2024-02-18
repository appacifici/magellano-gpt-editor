import { Command }      from 'commander';
import WordpressApi      from '../services/WordpressApi';

const program = new Command();
program.version('1.0.0').description('CLI team commander') 
    .option('-s, --site <type>', 'Sito da lanciare')
    .action((options) => {            
        const wodpressApi = new WordpressApi();
        switch( options.site ) {            
            case 'roma.cronacalive.it':                                             
                wodpressApi.getImagesFromWordPress(options.site);        
            break;
        } 
    });
program.parse(process.argv);

//NODE_ENV=development npx ts-node src/commands/sendToWpApi.ts -s vanityfair.it