
import axios, { AxiosResponse }            from "axios";
import OpenAI from "openai";

import { ScrapedData }  from "../siteScrapers/interface/VanityfairInterface";
import dotenv from 'dotenv';
import Article, { ArticleType, ArticleWithIdType } from "../database/mongodb/models/Article";
import Site, { SiteType, SiteWithIdType } from "../database/mongodb/models/Site";
import connectMongoDB from "../database/mongodb/connect";

const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });


interface HeadersGpt {
    ContentType: string,
    Authorization: string
}

interface ChatCompletionRequest {
    model: string;
    temperature: number;
    top_p: number;
    prompt: { role: string; content: string }[];
}

interface ChatCompletionResponse {
    choices: { text: string }[];
}

class ChatGptApi {    
    
    openai = new OpenAI({baseURL:process.env.OPENAI_BASE_URL, apiKey:process.env.OPENAI_API_KEY});

    constructor() {
        connectMongoDB();
    }

    public async  getArticleBySiteAndGenerate(siteName: string, generateValue: number) {
        try {
            
            const site:SiteWithIdType|null        = await Site.findOne({ site: siteName  });
            const article:ArticleWithIdType|null  = await Article.findOne({ site: site?._id, genarateGpt: generateValue });
            if(article !== null){
                const data:ScrapedData = {
                    bodyContainerHTML: article.body,
                    h1Content: article.h1,
                    metaTitle: article.title,
                    metaDescription: article.description
                }
                const articleGpt:string|null = await this.processArticle(data);
                console.log(articleGpt);

                // Se articleGpt è valido, aggiorna il campo bodyGpt dell'articolo
                if (articleGpt !== null) {
                    await Article.updateOne({ _id: article._id }, { $set: { bodyGpt: articleGpt, genarateGpt: 1 } });
                    console.log('Campo bodyGpt dell\'articolo aggiornato con successo.');
                } else {
                    console.log('Impossibile aggiornare il campo bodyGpt: articleGpt è null.');
                }
            }
            
        } catch (error) {
            console.error('Errore durante il recupero degli articoli:', error);
        }
    }

    public async processArticle(scrapedData:ScrapedData): Promise<string | null> {
        try {      
            const s:ScrapedData = scrapedData;
            const text = s?.bodyContainerHTML;

            if (text) {
                console.log('Invio richiesta a chat gpt');
                const completion = await this.openai.chat.completions.create({
                    messages: [
                        //Il messaggio di sistema aiuta a impostare il comportamento dell'assistente
                        {"role": "system", "content": "Riscrivi articolo e Adotta uno stile giornalistico professionale. Concentrati sull'uso di un linguaggio vario e ricco, evitando formule ripetitive o tipiche dell'IA. Struttura il testo come un vero pezzo giornalistico, con un'introduzione accattivante, sviluppo approfondito e una conclusione significativa. Utilizza interviste, citazioni e dati verificabili per arricchire il contenuto. Assicurati di variare le lunghezze delle frasi e di includere elementi stilistici umani, come metafore leggere, aneddoti rilevanti e osservazioni incisive, per rendere il testo dinamico e coinvolgente. Evita l'uso di jargon tecnico e scrivi in modo che sia comprensibile e interessante sia per un pubblico generico sia per lettori esperti sull'argomento, non terminare mai l'articolo con in conclusione, Usa il formato html, includi titoli di livello 2 (##) per ogni paragrafo."},
                        // I messaggi dell'utente forniscono richieste o commenti a cui l'assistente può rispondere
                        {"role": "user", "content": text},
                        {"role": "user", "content": "Ricordati che sei un giornalista di gossip che riscrive notizie in 600 parole con stile naturale, assicurandoti di non copiare, ma di riformulare il contenuto con lo stesso significato. Usa il formato Markdown, includi titoli di livello 2 (##) per ogni paragrafo. Metti in grassetto nomi e cognomi e frasi che ritieni importanti, e usa il corsivo per le citazioni importanti. Assicurati che il testo segua le linee guida SEO, Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT"},
                        {"role": "user", "content": "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT, ricordati di usare il formato Markdown, includi titoli di livello 2 (##) per ogni paragrafo. Metti in grassetto nomi e cognomi e frasi che ritieni importanti in grassetto, e usa il corsivo per le citazioni"}
                    ],
                    model: "gpt-3.5-turbo",
                    temperature: 0.6,
                    top_p: 0.9,
                  });
                  
                  return completion.choices[0].message.content;
            }
            return null;
        } catch (error) {
            console.error('Errore durante l\'elaborazione dell\'articolo:', error);
            return '';
        }
    }

    public async processTitle(scrapedData:ScrapedData): Promise<string | null> {
        try {      
            const s:ScrapedData = scrapedData;
            const text = s?.bodyContainerHTML;

            if (text) {
                const completion = await this.openai.chat.completions.create({
                    messages: [                        
                        {"role": "user", "content": `Crea un dettagliato e incisivo in italiano che contiene informazioni dettagliate su persone o fatti, riflettendo accuratamente il contenuto dell'articolo, non superare i 80 caratteri, mi raccomando non inserire mai le virgolette all'interno del titolo o apici doppi. : ${text}`},
                        {"role": "user", "content": "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT e ricorda di non includere virgolette di alcun tipo nel titolo, e ricorda di non superare gli 80 caratteri."},
                    ],
                    model: "gpt-3.5-turbo",
                    temperature: 0.6,
                    top_p: 0.9,
                  });
                
                  return completion.choices[0].message.content;
            }
            return null;
        } catch (error) {
            console.error('Errore durante l\'elaborazione dell\'articolo:', error);
            return '';
        }        
    }
    
}

export {ChatCompletionRequest};
export default ChatGptApi;