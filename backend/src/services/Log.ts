import fs from 'fs';
import path from 'path';

// Funzione per scrivere il log di errore su file
async function writeErrorLog(logError:any): Promise<boolean> {    
    const dataCorrente      = new Date();
    const dataFormattata    = dataCorrente.toISOString().slice(0, 10);
    const cartellaLogs      = path.join(`${process.env.PATH_LOGS}`, '');

    const commandLine       = process.argv[1];
    let nomeFile            = path.basename(commandLine);
    nomeFile                = nomeFile.replace('.ts', '.txt');
    nomeFile                = nomeFile.replace('.cjs', '.txt');
    console.log('Comando di avvio:', nomeFile);

    // Costruiamo il percorso del file utilizzando la data
    const percorsoFile = path.join(cartellaLogs, `${nomeFile}_error_${dataFormattata}.txt`);

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
