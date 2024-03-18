import { Command } from 'commander';
import ChatGptApi from '../services/ChatGptApi';
import OpenAiService from '../services/OpenAi/OpenAiService';

const program = new Command();
program.version('1.0.0').description('CLI team commander') 
    .option('-s, --site <type>', 'Sito da lanciare')
    .action(async (options) => { // Definisci la callback come async
        const chatGptApi: ChatGptApi        = new ChatGptApi();
        const openAiService: OpenAiService  = new OpenAiService();
        switch (options.site) {            
            // case 'vanityfair.it':                                       
            // case 'ilcorrieredellacitta.com':   
            case 'roma.cronacalive.it':   
                try {
                    // await chatGptApi.getArticleBySiteAndGenerate(options.site, 0); // Usa await per attendere il completamento della promessa
                    await openAiService.getInfoPromptAi(options.site, "65f829454225d9267daf2308", 0); // Usa await per attendere il completamento della promessa
                    process.exit(0);
                } catch (error) {
                    console.error('Errore durante l\'esecuzione del comando:', error);
                    process.exit(1); // Uscire con codice di errore
                }
                break;
            default:
                console.error('Sito non supportato:', options.site);
                process.exit(1); // Uscire con codice di errore se il sito non è supportato
        }
    });
program.parse(process.argv);
