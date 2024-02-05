import { Command }      from 'commander';
import ChatGptApi       from '../services/ChatGptApi';

const program = new Command();
program.version('1.0.0').description('CLI team commander') 
    .option('-s, --site <type>', 'Sito da lanciare')
    .action((options) => {            
        const chatGptApi:ChatGptApi = new ChatGptApi();
        switch( options.site ) {            
            case 'vanityfair.it':                                       
            case 'ilcorrieredellacitta.com':                                       
                chatGptApi.getArticleBySiteAndGenerate(options.site, 0);
            break;
        }
    });
program.parse(process.argv);

//NODE_ENV=development npx ts-node src/commands/generateGptArticle.ts -s vanityfair.it