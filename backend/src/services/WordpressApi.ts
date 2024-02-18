
import axios                                from "axios";
import dotenv                               from 'dotenv';
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
        const csvString: string | null = await chatGptApi.getCsvKeywords(article.titleGpt);

        if (csvString === null) {
            console.error('La stringa CSV è null');
            return false;
        }

        const results:any  = [];

        console.log(csvString);

        // Crea uno stream di lettura dalla stringa CSV
        const readableStream = Readable.from([csvString]);

        
        readableStream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(results);
            
                const imageWP = await findImageByWords(results, sitePublication._id);
                console.log("=>"+article.titleGpt);
                console.log(imageWP);
                

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
                            content: article.bodyGpt,
                            _yoast_wpseo_title: article.titleGpt,
                            _yoast_wpseo_metadesc: article.descriptionGpt,
                            yoast_title: article.titleGpt,
                            yoast_meta: {
                                description: article.descriptionGpt
                            },
                            status: 'publish',                                                                        
                        };

                        // Effettua la richiesta POST per creare il post
                        // axios.post(wordpressAPIURL, postData, {
                        //     headers: {
                        //       'Authorization': `Bearer ${token}`
                        //     }
                        // })
                        // .then(response => {
                        //     console.log(siteName+': Post inserito con successo:');
                        //     const filtro = { _id: article._id };
                        //     const aggiornamento = { send: 1 }; // Specifica i campi da aggiornare e i loro nuovi valori

                        //     Article.findOneAndUpdate(filtro, aggiornamento, { new: true })
                        //     .then((documentoAggiornato) => {
                        //         console.log(siteName+': Set send 1 avvenuta con successo');
                        //     })
                        //     .catch((errore) => {
                        //         console.log(siteName+': Errore send:', response.data);
                        //     });
                        // })
                        // .catch(error => {
                        //     console.error(siteName+': Errore durante l\'inserimento del post:', error.response.data);
                        // });
                    }
                })
                .catch(error => {
                    console.error(siteName+': Errore durante la generazione del token:', error);
                });
            });
        return true;
    }

    public rimuoviCongiunzioniArticoli(testo:string) {
        // Array di congiunzioni e articoli da rimuovere
        const paroleDaRimuovere = /\b(e|ed|o|dei|nei|nella|nel|sulla|ma|per|che|di|da|in|con|su|per|tra|fra|un|:|ad|una|uno|il|la|i|le|gli|l|suoi)\b/g;
        // Rimuovi le congiunzioni e gli articoli sostituendoli con una stringa vuota

        const testoPulito = testo.replace(paroleDaRimuovere, '');
        return testoPulito;
    }
}

// Francesco Totti e i suoi luoghi preferiti nel Lazio: da Sabaudia ad Anzio

export default WordpressApi;