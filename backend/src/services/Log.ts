import fs from 'fs';
import path from 'path';

// Funzione per scrivere il log di errore su file
function writeErrorLog(logError:string) {
    // Otteniamo la data corrente
    const dataCorrente = new Date();
    // Formattiamo la data nel formato YYYY-MM-DD
    const dataFormattata = dataCorrente.toISOString().slice(0, 10);

    const cartellaLogs = path.join(`${process.env.PATH_LOGS}`, '');

    // Costruiamo il percorso del file utilizzando la data
    const percorsoFile = path.join(cartellaLogs, `error_logs_${dataFormattata}.txt`);

    // Testo da scrivere nel file
    const testoDaScrivere = `[${dataCorrente.toISOString()}] ${logError}\n`;

    console.log(percorsoFile);
    console.log(testoDaScrivere);

    // Scriviamo il log di errore sul file
    fs.appendFile(percorsoFile, testoDaScrivere, (err) => {
        if (err) {
            console.error('Errore durante la scrittura del log di errore:', err);
        } else {
            console.log('Log di errore salvato correttamente.');
        }
    });
}

export {writeErrorLog};
