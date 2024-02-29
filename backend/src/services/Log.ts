import fs from 'fs';
import path from 'path';

// Funzione per scrivere il log di errore su file
async function writeErrorLog(logError:string): Promise<boolean> {
    // Otteniamo la data corrente
    const dataCorrente = new Date();
    // Formattiamo la data nel formato YYYY-MM-DD
    const dataFormattata = dataCorrente.toISOString().slice(0, 10);

    const cartellaLogs = path.join(`${process.env.PATH_LOGS}`, '');

    // Costruiamo il percorso del file utilizzando la data
    const percorsoFile = path.join(cartellaLogs, `error_logs_${dataFormattata}.txt`);

    const commandLine = process.argv[1];
    const nomeFile = path.basename(commandLine);
    console.log('Comando di avvio:', commandLine);


    // Testo da scrivere nel file
    const testoDaScrivere = `[${dataCorrente.toISOString()}] ${logError}\n`;

    // Scriviamo il log di errore sul file
    try {
        await fs.promises.appendFile(percorsoFile, testoDaScrivere);
        return true;
        
    } catch (err) {
        console.error('Errore durante la scrittura del log di errore:', err);        
        throw err; // Rilancia l'errore per gestirlo nel blocco catch esterno
    }
}

export {writeErrorLog};
