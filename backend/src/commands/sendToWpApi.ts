import { Command } from 'commander';
import WordpressApi from '../services/WordpressApi';
import { writeErrorLog } from '../services/Log';

// writeErrorLog('Errore durante il caricamento dell\'immagine:'+ error);

const program = new Command();
program.version('1.0.0').description('CLI team commander')
    .option('-s, --site <type>', 'Sito da lanciare')
    .action(async (options) => { // Aggiungi async qui
        const wodpressApi = new WordpressApi();
        switch (options.site) {
            case 'vanityfair.it':
            case 'ilcorrieredellacitta.com':
                await wodpressApi.sendToWPApi(options.site, 0); // Aggiungi await qui
                process.exit(1); // Ora puoi mettere l'exit qui
                break;
        }
    });
program.parse(process.argv);
