import axios, { AxiosResponse }            from "axios";
import OpenAI from "openai";

import { ScrapedData }  from "../siteScrapers/interface/VanityfairInterface";
import dotenv from 'dotenv';
dotenv.config();

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
    OPENAI_API_KEY = process.env.CHATGPT_API;

    constructor() {
        
    }

    public async processArticle(scrapedData:ScrapedData): Promise<string | null> {
        try {
      
            const s:ScrapedData = scrapedData;
            const text = s?.bodyContainerHTML;

            if (text) {
                const requestData: ChatCompletionRequest = {
                    model: 'davinci',
                    temperature: 0.6,
                    top_p: 0.9,
                    prompt: [
                        {
                            role: 'system',
                            content: "Riscrivi articolo e Adotta uno stile giornalistico professionale. Concentrati sull'uso di un linguaggio vario e ricco, evitando formule ripetitive o tipiche dell'IA. Struttura il testo come un vero pezzo giornalistico, con un'introduzione accattivante, sviluppo approfondito e una conclusione significativa. Utilizza interviste, citazioni e dati verificabili per arricchire il contenuto. Assicurati di variare le lunghezze delle frasi e di includere elementi stilistici umani, come metafore leggere, aneddoti rilevanti e osservazioni incisive, per rendere il testo dinamico e coinvolgente. Evita l'uso di jargon tecnico e scrivi in modo che sia comprensibile e interessante sia per un pubblico generico sia per lettori esperti sull'argomento, non terminare mai l'articolo con in conclusione, Usa il formato Markdown, includi titoli di livello 2 (##) per ogni paragrafo.",
                        },
                        {
                            role: 'user',
                            content: text,
                        },
                        {
                            role: 'user',
                            content: "Ricordati che sei un giornalista di gossip che riscrive notizie in 600 parole con stile naturale, assicurandoti di non copiare, ma di riformulare il contenuto con lo stesso significato. Usa il formato Markdown, includi titoli di livello 2 (##) per ogni paragrafo. Metti in grassetto nomi e cognomi e frasi che ritieni importanti, e usa il corsivo per le citazioni importanti. Assicurati che il testo segua le linee guida SEO, Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT",
                        },
                        {
                            role: 'user',
                            content: "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT, ricordati di usare il formato Markdown, includi titoli di livello 2 (##) per ogni paragrafo. Metti in grassetto nomi e cognomi e frasi che ritieni importanti in grassetto, e usa il corsivo per le citazioni .",
                        },
                    ],
                };
        
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
                };
                console.log(headers);  
                const response:AxiosResponse<ChatCompletionResponse, any> = await axios.post<ChatCompletionResponse>('https://api.openai.com/v1/engines/davinci/completions', requestData, {
                    headers:headers,
                });
                              

                const formattedMarkdown = response.data.choices[0].text.trim();
                return formattedMarkdown;
            }
            return null;
        } catch (error) {
            console.error('Errore durante l\'elaborazione dell\'articolo:', error);
            return '';
        }
    }

    public async processTitle(text: string): Promise<string> {
        try {
            const requestData: ChatCompletionRequest = {
                model: 'davinci',
                temperature: 0.5,
                top_p: 0.85,
                prompt: [
                    { role: 'user', content: `Crea un dettagliato e incisivo in italiano che contiene informazioni dettagliate su persone o fatti, riflettendo accuratamente il contenuto dell'articolo, non superare i 80 caratteri, mi raccomando non inserire mai le virgolette all'interno del titolo o apici doppi. : ${text}` },
                    { role: 'user', content: "Evita l'uso di frasi o parole tipicamente utilizzate dal modello ChatGPT e ricorda di non includere virgolette di alcun tipo nel titolo, e ricorda di non superare gli 80 caratteri." }
                ],
            };
    
            const response = await axios.post<ChatCompletionResponse>('https://api.openai.com/v1/engines/davinci/completions', requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
                },
            });
    
            const title = response.data.choices[0].text.trim();
            return title;
        } catch (error) {
            console.error('Errore durante l\'elaborazione del titolo:', error);
            return '';
        }
    }
    
    
}

const chatGptApi = new ChatGptApi();
export {ChatCompletionRequest};
export default chatGptApi;