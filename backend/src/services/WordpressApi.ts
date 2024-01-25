
import axios, { AxiosResponse }            from "axios";
import OpenAI from "openai";
import MarkdownIt from 'markdown-it';


import { ScrapedData }  from "../siteScrapers/interface/VanityfairInterface";
import dotenv from 'dotenv';
import Article, { ArticleType, ArticleWithIdType } from "../database/mongodb/models/Article";
import Site, { SiteType, SiteWithIdType } from "../database/mongodb/models/Site";
import connectMongoDB from "../database/mongodb/connect";

const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });



class WordpressApi {    
    
    constructor() {
        connectMongoDB();
    }

    public async  sendToWPApi(siteName: string, send: number) {        
            console.log(siteName);
            const site:SiteWithIdType|null          = await Site.findOne({ site: siteName  });
            const article:ArticleWithIdType|null    = await Article.findOne({ site: site?._id, send: send });
            
                    
            // Se articleGpt è valido, aggiorna il campo bodyGpt dell'articolo
            if (article !== null) {
                console.log('sii');
                const auth = {
                    username: 'Admin',
                    password: 'dUJ44cXYK5%DtCKBW8B%6xy('
                };
                
                // URL dell'endpoint delle API di WordPress per la creazione di un nuovo post
                const wordpressAPIURL = 'https://www.cronacalive.it/wp-json/wp/v2/posts';
                
                const postData = {
                    title: article.titleGpt,
                    content: article.bodyGpt,
                    status: 'publish',
                    author: 19
                };

                // Effettua la richiesta POST per creare il post
                axios.post(wordpressAPIURL, postData, { auth })
                    .then(response => {
                        console.log('Post inserito con successo:', response.data);
                    })
                    .catch(error => {
                        console.error('Errore durante l\'inserimento del post:', error.response.data);
                    });

                await Article.updateOne({ _id: article._id }, 
                    { $set: {                             
                        send:    1 
                    } 
                });
                console.log('Campo bodyGpt dell\'articolo aggiornato con successo.');
            } else {
                console.log('Impossibile aggiornare il campo bodyGpt: articleGpt è null.');
            }
        
    
        
    }

    
}


export default WordpressApi;