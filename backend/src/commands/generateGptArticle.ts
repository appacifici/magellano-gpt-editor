import { Command }      from 'commander';
import ChatGptApi       from '../services/ChatGptApi';
import OpenAiService    from '../services/OpenAi/OpenAiService';
import AlertUtility     from '../services/Utility/AlertService';

const program = new Command();
program.version('1.0.0').description('CLI team commander') 
    .option('-s, --site <type>', 'Sito da lanciare')
    .action(async (options) => { // Definisci la callback come async
        const chatGptApi:    ChatGptApi         = new ChatGptApi();
        const openAiService: OpenAiService      = new OpenAiService();
        const alertUtility:  AlertUtility       = new AlertUtility();

        //avvia l'alert utility
        const processName:string                = 'processName';
        const alertProcess:string               = alertUtility.initProcess(processName); //. date('YmdHis')
        alertUtility.setLimitWrite(60000);

        alertUtility.setCallData(alertProcess, 'dd');
        alertUtility.setError(alertProcess, 'cosa da spampare');
        alertUtility.setDebug(alertProcess, 'cosa da spampare');
        alertUtility.write(alertProcess, processName);

        switch (options.site) {                        
            case 'roma.cronacalive.it':   
                try {
                    // await chatGptApi.getArticleBySiteAndGenerate(options.site, 0); // Usa await per attendere il completamento della promessa
                    await openAiService.getInfoPromptAi(options.site, "66007615b34e648222f5f3f5", 0); // Usa await per attendere il completamento della promessa
                    process.exit(0);
                } catch (error) {
                    console.error('Errore durante l\'esecuzione del comando:', error);
                    process.exit(1); // Uscire con codice di errore
                }
                break; 
            case 'bluedizioni.it':    
                try {
                    // await chatGptApi.getArticleBySiteAndGenerate(options.site, 0); // Usa await per attendere il completamento della promessa
                    await openAiService.getInfoPromptAi(options.site, "66007615b34e648222f5f3f6", 0); // Usa await per attendere il completamento della promessa
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
