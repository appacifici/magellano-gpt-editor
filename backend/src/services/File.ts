import axios from "axios";
import fs from 'fs';
import { createGunzip } from 'zlib';
import { writeErrorLog } from "./Log";

async function readFileToServer(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Si è verificato un errore durante la lettura del file:', err);
                reject(err); // Rejected con l'errore
                return;
            }
            
            // Risolvi con il contenuto del file
            resolve(data);
        });
    });
}

async function extractGzip(inputFilePath: string, outputFilePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        // Crea un lettore stream per il file .gz
        const readStream = fs.createReadStream(inputFilePath);

        // Crea un writer stream per il file estratto
        const writeStream = fs.createWriteStream(outputFilePath);

        // Crea un flusso di decompressione gzip
        const gzip = createGunzip();

        // Pipe il flusso di lettura nel flusso di decompressione e quindi nel flusso di scrittura
        readStream.pipe(gzip).pipe(writeStream);

        // Gestisci gli eventi di completamento e di errore
        writeStream.on('finish', () => {
            console.log('File decompresso con successo.');
            resolve(); // Risolvi la promessa quando la decompressione è completata
        });

        writeStream.on('error', (err) => {
            console.error('Si è verificato un errore durante la decompressione:', err);
            reject(err); // Rejected con l'errore in caso di errore
        });
    });
}


async function download(url: string, outputPath: string): Promise<void> {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        response.data.pipe(fs.createWriteStream(outputPath));

        await new Promise((resolve) => {
            response.data.on('end', () => {
                console.log('BaseApi: file scaricato correttamente: '+outputPath);
                resolve(null); // Passiamo null o undefined come argomento
            });

            response.data.on('error', async (err: any) => {
                await writeErrorLog("download:");
                await writeErrorLog(err);
                throw err; // Lancio l'errore per essere catturato dal blocco catch esterno
            });
        });
    } catch (error) {
        // Gestione dell'errore
        console.error("Si è verificato un errore durante il download del file");
        await writeErrorLog("download:");
        await writeErrorLog(error);
        throw error; // Rilancio l'errore per propagarlo
    }
}

export {download,extractGzip,readFileToServer};