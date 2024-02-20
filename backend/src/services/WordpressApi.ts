
import axios                                from "axios";
import dotenv                               from 'dotenv';
import * as fs                              from 'fs';
import FormData                             from 'form-data';
import csv                                  from 'csv-parser';
import { Readable }                         from "stream";

import Article, { ArticleWithIdType }       from "../database/mongodb/models/Article";
import Site, { SiteWithIdType }             from "../database/mongodb/models/Site";
import connectMongoDB                       from "../database/mongodb/connect";
import SitePublication, 
{ SitePublicationWithIdType }               from "../database/mongodb/models/SitePublication";
import ImageWP,{ ImageType }                from "../database/mongodb/models/ImageWP";
import { findImageByWords }                 from "./MongooseFind";
import ChatGptApi                           from "./ChatGptApi";

const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
class WordpressApi {
    constructor() {
        connectMongoDB();
    }

    public async getImagesFromWordPress(siteName: string ) {
        try {
            const sitePublication: any = await SitePublication.findOne({ sitePublication: siteName });
            const page = sitePublication?.page;
            if (sitePublication !== null) {
                const url       =`${sitePublication.urlImages}?per_page=100&page=${page}&orderby=id&order=asc`;                
                const response  = await axios.get(url);
                if (response.data && Array.isArray(response.data)) {
                    for (const image of response.data) {
                        console.log('Image ID:', image.id);
                        console.log('Image link:', image.link);
                        console.log('Image Title:', image.title.rendered);
                        console.log('Image URL:', image.source_url);
                        console.log('Image Alt Text:', image.alt_text);
                        console.log('Image Description:', image.description);
                        console.log('---------------------------');    
                        try {                            
                            let imageData: ImageType = {
                                sitePublication: sitePublication._id,
                                imageID: image.id,
                                imageLink: image.link,
                                imageTitle: image.title.rendered.replace(/-/g, " "),
                                imageURL: image.source_url,
                                imageAltText: image.alt_text.replace(/-/g, " ")
                            }
                            const newImage = new ImageWP(imageData);
                            await newImage.save();
                            console.log(`Immagine con ID ${newImage.imageID} salvata correttamente.`);
                        } catch (error) {
                            console.error(`Si è verificato un errore durante il salvataggio dell'immagine con ID ${image.id}: ${error}`);
                        }
                    }
                } else {
                    console.log('No images found.');
                }
                
                try {
                    sitePublication.page += 1;
                    await sitePublication.save();
                    this.getImagesFromWordPress(siteName);
                    console.log("Aggiornamento di 'page' completato con successo.");
                } catch (error) {
                    console.error("Si è verificato un errore durante l'aggiornamento di 'page':", error);
                }                                
            }
            
        } catch (error) {
            console.error('Error fetching images',error);
            process.exit();
        }       
    }

    private async downloadImage(url: string, outputPath: string): Promise<void> {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });
    
        response.data.pipe(fs.createWriteStream(outputPath));
    
        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                console.log('immagine scaricata correttamente');
                resolve();                
            });
    
            response.data.on('error', (err: Error) => {
                reject(err);
            });
        }); 
    }


    private async uploadImageAndGetId(imagePath: string, sitePublication: SitePublicationWithIdType, titleGpt:string|undefined): Promise<object> {
        const imageName = titleGpt !== undefined ? this.removeStopWords(titleGpt) : 'img_'+Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
        const newImg    = imageName.replace(/ /g, "_");

        const pathSave = `/home/node/app/download/${newImg}.jpg`;
        await this.downloadImage(imagePath, pathSave);
    
        const formData = new FormData();
        formData.append('file', fs.createReadStream(pathSave));
    
        const userData = {
            username: sitePublication.username,
            password: sitePublication.password
        };
        
        const authUrl = sitePublication.tokenUrl;
        try {
            const authResponse = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            const authData = await authResponse.json();
            const token = authData.token;
    
            const response = await axios.post(sitePublication.urlImages, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(response.data);
            return response.data;
        } catch (error) {
            console.error('Errore durante il caricamento dell\'immagine:', error);
            throw error; // Rilancia l'errore per gestirlo in un punto superiore
        }
    }
    
    
    public async sendToWPApi(siteName: string, send: number): Promise<Boolean> {
        const site: SiteWithIdType | null                       = await Site.findOne({ site: siteName });
        const article: ArticleWithIdType | null                 = await Article.findOne({ site: site?._id, send: send, genarateGpt: 1 });
        const sitePublication:SitePublicationWithIdType|null    = await SitePublication.findOne({ _id: article?.sitePublication.toString() });
        if( sitePublication === null ) {
            return false;
        }
        if( article === null || article.titleGpt === undefined ) {
            return false;
        }

        const chatGptApi = new ChatGptApi();
        const jsonString: string | null = await chatGptApi.getCsvKeywords(article.titleGpt);

        if (jsonString === null) {
            console.error('La stringa CSV è null');    
            console.log(jsonString);        
            return false;
        }

        console.log(jsonString);
        let results:any  = [];        
        results = JSON.parse(jsonString);
        console.log(results);

        let imageWP = await findImageByWords(results, sitePublication._id);
        console.log("=>"+article.titleGpt);
        console.log(imageWP);
        
        if( imageWP == undefined && article.titleGpt !== undefined ) {
            console.log('eccomi');
            const words = this.adaptReponseWeight(article.titleGpt);
            console.log(words);
            imageWP = await findImageByWords(words,  sitePublication._id);                    
        }
        

        const reponseImage:any = await this.uploadImageAndGetId(imageWP.imageLink, sitePublication, article.titleGpt);
        console.log('imageId: '+reponseImage.id);
        console.log('imageId: '+reponseImage.guid.raw);

        const userData = {
            username: sitePublication.username,
            password: sitePublication.password
        };

        // URL per il punto finale di autenticazione JWT
        const authUrl = sitePublication.tokenUrl;
        
        // Effettua una richiesta POST per generare il token di autenticazione
        fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
            .then(data => {                
                const token = data.token;                
                if( article !== null ) {                
                const auth = {
                    'Authorization': `Bearer ${token}`
                };
                const wordpressAPIURL   = sitePublication.url;        
                const postData          = {
                    title: article.h1Gpt,
                    content: `<img src="${reponseImage.guid.raw}">`+article.bodyGpt,
                    _yoast_wpseo_title: article.titleGpt,
                    _yoast_wpseo_metadesc: article.descriptionGpt,
                    yoast_title: article.titleGpt,
                    yoast_meta: {
                        description: article.descriptionGpt
                    },
                    status: 'publish',   
                    featured_media: reponseImage.id                                                                     
                };

                // Effettua la richiesta POST per creare il post
                axios.post(wordpressAPIURL, postData, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    console.log(siteName+': Post inserito con successo:');
                    const filtro = { _id: article._id };
                    const aggiornamento = { send: 1 }; // Specifica i campi da aggiornare e i loro nuovi valori

                    Article.findOneAndUpdate(filtro, aggiornamento, { new: true })
                    .then((documentoAggiornato) => {
                        console.log(siteName+': Set send 1 avvenuta con successo');
                    })
                    .catch((errore) => {
                        console.log(siteName+': Errore send:', response.data);
                    });
                })
                .catch(error => {
                    console.error(siteName+': Errore durante l\'inserimento del post:', error.response.data);
                });
            }
        })
        .catch(error => {
            console.error(siteName+': Errore durante la generazione del token:');
        });
            
        return true;
    }


    
    public removeStopWords(testo:string):string {
        // Array di congiunzioni e articoli da rimuovere
        const paroleDaRimuovere = /\b(a|abbia|abbiamo|abbiano|abbiate|ad|adesso|ai|al|alla|alle|allo|allora|altre|altri|altro|anche|ancora|avemmo|avendo|avesse|avessero|avessi|avessimo|aveste|avesti|avete|aveva|avevamo|avevano|avevate|avevi|avevo|avrai|avranno|avrebbe|avrebbero|avrei|avremmo|avremo|avreste|avresti|avrete|avrà|avrò|avuta|avute|avuti|avuto|c|che|chi|ci|coi|col|come|con|contro|cui|da|dagli|dai|dal|dall|dalla|dalle|dallo|degl|degli|dei|del|dell|della|delle|dello|dentro|di|dopo|dove|e|ebbe|ebbero|ebbi|ecc|ed|era|erano|eravamo|eravate|eri|ero|esempio|essa|esse|essendo|esser|essere|essi|essimo|esso|estate|farai|faranno|fare|farebbe|farebbero|farei|faremmo|faremo|fareste|faresti|farete|farà|farò|fece|fecero|feci|fin|finalmente|finche|fine|fino|forse|fosse|fossero|fossi|fossimo|foste|fosti|fra|frattempo|fu|fui|fummo|furono|giu|ha|hai|hanno|ho|i|il|improvviso|in|infatti|insieme|intanto|io|l|la|lavoro|le|lei|li|lo|loro|lui|lungo|ma|magari|mai|male|malgrado|malissimo|me|medesimo|mediante|meglio|meno|mentre|mesi|mezzo|mi|mia|mie|miei|mila|miliardi|milio|molta|molti|molto|momento|mondo|ne|negli|nei|nel|nell|nella|nelle|nello|no|noi|nome|non|nondimeno|nonsia|nostra|nostre|nostri|nostro|o|od|oggi|ogni|ognuna|ognuno|oltre|oppure|ora|otto|paese|parecchi|parecchie|parecchio|parte|partendo|peccato|peggio|per|perche|perché|perciò|perfino|pero|persino|persone|piu|piuttosto|più|pochissimo|poco|poi|poiche|possa|possedere|posteriore|posto|potrebbe|preferibilmente|presa|press|prima|primo|proprio|puoi|pure|purtroppo|può|qua|quale|quali|qualcosa|qualcuna|qualcuno|quale|quali|qualunque|quando|quanto|quasi|quattro|quel|quella|quelli|quelle|quello|quest|questa|queste|questi|questo|qui|quindi|quinto|realmente|recente|recentemente|registrazione|relativo|riecco|salvo|sara|sarai|saranno|sarebbe|sarebbero|sarei|saremmo|saremo|sareste|saresti|sarete|sarà|sarò|scola|scopo|scorso|se|secondo|seguente|seguito|sei|sembra|sembrare|sembrato|sembrava|sembri|sempre|senza|sette|si|sia|siamo|siano|siate|siete|sig|solito|solo|soltanto|sono|sopra|soprattutto|sotto|spesso|sta|stai|stando|stanno|starai|staranno|starebbe|starebbero|starei|staremmo|staremo|stareste|staresti|starete|starà|starò|stata|state|stati|stato|stava|stavamo|stavano|stavate|stavi|stavo|stemmo|stessa|stesse|stessero|stessi|stessimo|stesso|steste|stesti|stette|stettero|stetti|stia)\b/g;
        // Rimuovi le congiunzioni e gli articoli sostituendoli con una stringa vuota

        const testoPulito = testo.replace(paroleDaRimuovere, '');
        return testoPulito;  
    }

    public adaptReponseWeight(testo:string):any {
        // Array di congiunzioni e articoli da rimuovere
        const paroleDaRimuovere = /\b(in|con|su|per|tra|fra|sopra|sotto|e|né|o|oppure|ma|anche|neanche|neppure|nemmeno|sia|sia... sia|tanto|quanto|benché|sebbene|perciò|pertanto|quindi|dunque|però|tuttavia|ciononostante|nondimeno|mentre|poiché|siccome|affinché|onde|perché|dato che|in quanto|siccome|giacché|qualora|a meno che|a patto che|salvo che|tranne che|senza che|purché|nel caso che|qualunque|sia... che|che|quando|se|come|anche se|per quanto|pure se|ovunque|dove|dovunque|laddove|finché|fintantoché|purché|fino a che|affinché|tanto che|perché|da... a|da... fino a|da... fino a che|da... da|dal... al|dal... al|dal... al|fra... e|tra... e|tra... e|fra... e|fra... e|al posto di|invece di|piuttosto che|anziché|quanto|quanto|che|qualunque|quale|qualsiasi|qualsivoglia|quale|qualunque|quale|qualsiasi|qualsivoglia|a|abbia|abbiamo|abbiano|abbiate|ad|adesso|ai|al|alla|alle|allo|allora|altre|altri|altro|anche|ancora|avemmo|avendo|avesse|avessero|avessi|avessimo|aveste|avesti|avete|aveva|avevamo|avevano|avevate|avevi|avevo|avrai|avranno|avrebbe|avrebbero|avrei|avremmo|avremo|avreste|avresti|avrete|avrà|avrò|avuta|avute|avuti|avuto|c|che|chi|ci|coi|col|come|con|contro|cui|da|dagli|dai|dal|dall|dalla|dalle|dallo|degl|degli|dei|del|dell|della|delle|dello|dentro|di|dopo|dove|e|ebbe|ebbero|ebbi|ecc|ed|era|erano|eravamo|eravate|eri|ero|esempio|essa|esse|essendo|esser|essere|essi|essimo|esso|estate|farai|faranno|fare|farebbe|farebbero|farei|faremmo|faremo|fareste|faresti|farete|farà|farò|fece|fecero|feci|fin|finalmente|finche|fine|fino|forse|fosse|fossero|fossi|fossimo|foste|fosti|fra|frattempo|fu|fui|fummo|furono|giu|ha|hai|hanno|ho|i|il|improvviso|in|infatti|insieme|intanto|io|l|la|lavoro|le|lei|li|lo|loro|lui|lungo|ma|magari|mai|male|malgrado|malissimo|me|medesimo|mediante|meglio|meno|mentre|mesi|mezzo|mi|mia|mie|miei|mila|miliardi|milio|molta|molti|molto|momento|mondo|ne|negli|nei|nel|nell|nella|nelle|nello|no|noi|nome|non|nondimeno|nonsia|nostra|nostre|nostri|nostro|o|od|oggi|ogni|ognuna|ognuno|oltre|oppure|ora|otto|paese|parecchi|parecchie|parecchio|parte|partendo|peccato|peggio|per|perche|perché|perciò|perfino|pero|persino|persone|piu|piuttosto|più|pochissimo|poco|poi|poiche|possa|possedere|posteriore|posto|potrebbe|preferibilmente|presa|press|prima|primo|proprio|puoi|pure|purtroppo|può|qua|quale|quali|qualcosa|qualcuna|qualcuno|quale|quali|qualunque|quando|quanto|quasi|quattro|quel|quella|quelli|quelle|quello|quest|questa|queste|questi|questo|qui|quindi|quinto|realmente|recente|recentemente|registrazione|relativo|riecco|salvo|sara|sarai|saranno|sarebbe|sarebbero|sarei|saremmo|saremo|sareste|saresti|sarete|sarà|sarò|scola|scopo|scorso|se|secondo|seguente|seguito|sei|sembra|sembrare|sembrato|sembrava|sembri|sempre|senza|sette|si|sia|siamo|siano|siate|siete|sig|solito|solo|soltanto|sono|sopra|soprattutto|sotto|spesso|sta|stai|stando|stanno|starai|staranno|starebbe|starebbero|starei|staremmo|staremo|stareste|staresti|starete|starà|starò|stata|state|stati|stato|stava|stavamo|stavano|stavate|stavi|stavo|stemmo|stessa|stesse|stessero|stessi|stessimo|stesso|steste|stesti|stette|stettero|stetti|stia)\b/g;
        // Rimuovi le congiunzioni e gli articoli sostituendoli con una stringa vuota

        const testoPulito = testo.replace(paroleDaRimuovere, '');
        const parole = testoPulito.split(' ');

        // Crea un array finale nel formato desiderato
        const arrayFinale = parole
        // Filtra le parole vuote
        .filter(parola => parola.trim() !== '')
        // Mappa le parole rimanenti in arrayFinale
        .map(parola => ({ keyword: parola.trim().toLowerCase(), peso: 1 }));
    
        return arrayFinale;   
    }
}

// Francesco Totti e i suoi luoghi preferiti nel Lazio: da Sabaudia ad Anzio

export default WordpressApi;