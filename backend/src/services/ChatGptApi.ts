
import axios, { AxiosResponse }             from "axios";
import dotenv                               from 'dotenv';
import OpenAI                               from "openai";
import MarkdownIt                           from 'markdown-it';
import fs                                   from 'fs';

import { ScrapedData }                      from "../siteScrapers/interface/VanityfairInterface";
import Article, { ArticleWithIdType}        from "../database/mongodb/models/Article";
import Site, { SiteWithIdType }             from "../database/mongodb/models/Site";
import connectMongoDB                       from "../database/mongodb/connect";
import { findImageByWords }                 from "./MongooseFind";
const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

interface ChatCompletionRequest {
    model: string;
    temperature: number;
    top_p: number;
    prompt: { role: string; content: string }[];
}

class ChatGptApi {
    static getCsvKeywords(titleGpt: string) {
        throw new Error("Method not implemented.");
    }    
    
    openai  = new OpenAI({baseURL:process.env.OPENAI_BASE_URL, apiKey:process.env.OPENAI_API_KEY});
    md      = new MarkdownIt();

    constructor() {
        connectMongoDB();
    }

    private ucfirst(str:string|null):string|null {
        if (str == null || typeof str !== 'string' || str.length === 0) {
            return null;
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    public async getArticleBySiteAndGenerate(siteName: string, generateValue: number) {
        try {            
            const site: SiteWithIdType | null       = await Site.findOne({ site: siteName });
            const article: ArticleWithIdType | null = await Article.findOne({ site: site?._id, genarateGpt: generateValue });
    
            if (article !== null) {
                const data: ScrapedData = {
                    bodyContainerHTML:  article.body,
                    h1Content:          article.h1,
                    metaTitle:          article.title,
                    metaDescription:    article.description
                };
    
                const articleGpt: string | null | null  = await this.processArticle(data);
                const titleGpt: string | null           = await this.processTitle(articleGpt);
                const descriptionGpt: string | null     = await this.processDescription(articleGpt);
                const h1Gpt: string | null              = await this.processH1(articleGpt);
                console.log('fine richieste gpt');
    
                // Se articleGpt è valido, aggiorna il campo bodyGpt dell'articolo
                if (articleGpt !== null) {
                    await Article.updateOne({ _id: article._id }, {
                        $set: {
                            bodyGpt:        this.md.render(articleGpt),
                            titleGpt:       titleGpt,
                            descriptionGpt: descriptionGpt,
                            h1Gpt:          h1Gpt,
                            genarateGpt:    1
                        }
                    });
                    console.log(siteName + ': Campo bodyGpt dell\'articolo aggiornato con successo.');
                } else {
                    console.log(siteName + ': Impossibile aggiornare il campo bodyGpt: articleGpt è null.');
                }
            }
        } catch (error) {
            console.error(siteName + ': Errore durante il recupero degli articoli:', error);
        }
    }

    public async leggiFile(filePath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          fs.readFile(filePath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(data);
          });
        });
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
                        {"role": "system", "content": "Riscrivi articolo e Adotta uno stile giornalistico professionale. Concentrati sull'uso di un linguaggio vario e ricco, evitando formule ripetitive o tipiche dell'IA. Struttura il testo come un vero pezzo giornalistico, diviso in capitoli con il formato Markdow (##), con un'introduzione accattivante, sviluppo approfondito e una conclusione significativa. Utilizza interviste, citazioni e dati verificabili per arricchire il contenuto. Assicurati di variare le lunghezze delle frasi e di includere elementi stilistici umani, come metafore leggere, aneddoti rilevanti e osservazioni incisive, per rendere il testo dinamico e coinvolgente. Evita l'uso di jargon tecnico e scrivi in modo che sia comprensibile e interessante sia per un pubblico generico sia per lettori esperti sull'argomento, non terminare mai l'articolo con in conclusione, Usa il formato html, includi titoli di livello 2 (##) per ogni paragrafo."},
                        // I messaggi dell'utente forniscono richieste o commenti a cui l'assistente può rispondere
                        {"role": "user", "content": text},
                        {"role": "user", "content": `Scrivi il testo in maniera naturale in minuscolo, tranne le iniziali dei nomi propri di persona e della prima parola`},
                        {"role": "user", "content": "Ricordati che sei un giornalista di gossip che riscrive notizie in 600 parole con stile naturale, assicurandoti di non copiare, ma di riformulare il contenuto con lo stesso significato. Usa il formato Markdown, includi titoli di livello 2 (##) per ogni paragrafo, scrivi tutto in minuscolo, tranne le iniziali dei nomi propri di persona e della prima parola. Metti in grassetto nomi e cognomi e frasi che ritieni importanti, e usa il corsivo per le citazioni importanti. Assicurati che il testo segua le linee guida SEO, Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT"},
                        {"role": "user", "content": "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT, ricordati di usare il formato Markdown, includi titoli di livello 2 (##) per ogni paragrafo. Metti in grassetto nomi e cognomi e frasi che ritieni importanti in grassetto, e usa il corsivo per le citazioni"}
                    ],
                    model: "gpt-3.5-turbo-1106",
                    temperature: 0.6,
                    top_p: 0.9,
                  });
                  
                  return this.ucfirst(completion.choices[0].message.content);
            }
            return null;
        } catch (error:any) {
            console.error('Errore durante l\'elaborazione dell\'articolo:', error.error);
            return null;
        }
    }

    public async processTitle(articleGpt:string|null): Promise<string | null> {
        try {      
                      
            if (articleGpt) {
                const completion = await this.openai.chat.completions.create({
                    messages: [      
                        {"role": "user", "content": articleGpt},                  
                        {"role": "user", "content": `Crea il meta title seo per il testo che ti ho fornito`},
                        {"role": "user", "content": `Scrivi il testo in maniera naturale in minuscolo, tranne le iniziali dei nomi propri di persona e della prima parola`},
                        {"role": "user", "content": `utilizza massimo 80 caratteri`},
                        {"role": "user", "content": `Non inserire mai le virgolette all'interno del titolo o apici doppi`},
                        {"role": "user", "content": "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT e ricorda di non includere virgolette di alcun tipo nel titolo, e ricorda di non superare gli 80 caratteri."},
                    ],
                    model: "gpt-3.5-turbo-1106",
                    temperature: 0.6,
                    top_p: 0.9,
                  });
                
                  return this.ucfirst(completion.choices[0].message.content);
            }
            return null;
        } catch (error) {
            console.error('Errore durante l\'elaborazione title:', error);
            return '';
        }        
    }
    
    public async processDescription(articleGpt:string|null): Promise<string | null> {
        try {                  
            if (articleGpt) {
                const completion = await this.openai.chat.completions.create({
                    messages: [          
                        {"role": "user", "content": articleGpt},                        
                        {"role": "user", "content": `Crea una meta description SEO incisiva in italiano per il testo che ti ho fornito.`},
                        {"role": "user", "content": `Scrivi il testo in maniera naturale in minuscolo, tranne le iniziali dei nomi propri di persona e della prima parola`},
                        {"role": "user", "content": `utilizza massimo 160 caratteri`},
                        {"role": "user", "content": `Non inserire mai le virgolette all'interno del titolo o apici doppi`},
                        {"role": "user", "content": "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT e ricorda di non includere virgolette di alcun tipo nella descrizione, e ricorda di non superare gli 160 caratteri."},
                    ],
                    model: "gpt-3.5-turbo-1106",
                    temperature: 0.6,
                    top_p: 0.9,
                  });
                
                  return this.ucfirst(completion.choices[0].message.content);
            }
            return null;
        } catch (error) {
            console.error('Errore durante l\'elaborazione description:', error);
            return '';
        }        
    }

    public async processH1(articleGpt:string|null): Promise<string | null> {
        try {                            
            
            if (articleGpt) {
                const completion = await this.openai.chat.completions.create({
                    messages: [                      
                        {"role": "user", "content": articleGpt},       
                        {"role": "user", "content": `Crea il testo per il tag h1 in ottica seo in italiano per il testo che ti ho fornito`},
                        {"role": "user", "content": `Scrivi il testo in maniera naturale in minuscolo, tranne le iniziali dei nomi propri di persona e della prima parola`},
                        {"role": "user", "content": `utilizza massimo 80 caratteri`},
                        {"role": "user", "content": `Non inserire mai le virgolette all'interno del titolo o apici doppi`},
                        {"role": "user", "content": "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT e ricorda di non includere virgolette di alcun tipo nel testo, e ricorda di non superare gli 80 caratteri."},
                    ],
                    model: "gpt-3.5-turbo-1106",
                    temperature: 0.6,
                    top_p: 0.9,
                  });
                
                  return this.ucfirst(completion.choices[0].message.content);
            }
            return null;
        } catch (error) {
            console.error('Errore durante l\'elaborazione h1:', error);
            return '';
        }        
    }

    public async getCsvKeywords(title:string|null): Promise<string | null> {
        try {                            
            
            if (title) {
                const completion = await this.openai.chat.completions.create({
                    messages: [                      
                        {"role": "user", "content": title},       
                        {"role": "user", "content": `Crea un json con la lista di keywords da massimo 1 parola, aggiungi il peso che hanno nella ricerca`},                                                
                        {"role": "user", "content": `Rispondimi solo con un json in questo formato:[
                            { keyword: string, peso: int },
                            { keyword: string, peso: int }                            
                          ]`},                        
                    ],
                    model: "gpt-3.5-turbo-1106",
                    temperature: 0.6,
                    top_p: 0.9,
                  });
                
                  return completion.choices[0].message.content;
            }
            return null;
        } catch (error) {
            console.error('Errore durante l\'elaborazione h1:', error);
            return '';
        }        
    }
    
}

export {ChatCompletionRequest};
export default ChatGptApi;