
import axios                                from "axios";
import dotenv                               from 'dotenv';
import Article, { ArticleWithIdType }       from "../database/mongodb/models/Article";
import Site, { SiteType, SiteWithIdType }   from "../database/mongodb/models/Site";
import connectMongoDB                       from "../database/mongodb/connect";
import SitePublication, 
{ SitePublicationWithIdType }               from "../database/mongodb/models/SitePublication";

const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

class WordpressApi {

    constructor() {
        connectMongoDB();
    }
    
    public async getImagesFromWordPress(siteName: string) {
        try {
            const site: SiteWithIdType | null                       = await Site.findOne({ site: siteName });
            const sitePublication:SitePublicationWithIdType|null    = await SitePublication.findOne({ sitePublication: site?.sitePublication.toString() }); 
            if( sitePublication !== null ) {
                const response = await axios.get(sitePublication.url);
                
                if (response.data && Array.isArray(response.data)) {
                    response.data.forEach(image => {
                        console.log('Image ID:', image.id);
                        console.log('Image Title:', image.title.rendered);
                        console.log('Image URL:', image.source_url);
                        console.log('Image Alt Text:', image.alt_text);
                        console.log('Image Description:', image.description);
                        console.log('---------------------------');
                    });
                } else {
                    console.log('No images found.');
                }
            }
        } catch (error) {
            console.error('Error fetching images:', error);
        }        
    }
    
    public async sendToWPApi(siteName: string, send: number): Promise<Boolean> {        
        const site: SiteWithIdType | null                       = await Site.findOne({ site: siteName });
        const article: ArticleWithIdType | null                 = await Article.findOne({ site: site?._id, send: send, genarateGpt: 1 });
        const sitePublication:SitePublicationWithIdType|null    = await SitePublication.findOne({ _id: article?.sitePublication.toString() });   

        if( sitePublication === null ) {
            return false;
        }

        const userData = {
            username: sitePublication.username,
            password: sitePublication.password
        };

        // URL per il punto finale di autenticazione JWT
        const authUrl = sitePublication.tokenUrl;

        console.log(userData);
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
                console.error(siteName+': Errore durante la generazione del token:', error);
            });
        return true;
    }
}

export default WordpressApi;