
import dotenv                                               from 'dotenv';
import OpenAI                                               from "openai";
import MarkdownIt                                           from 'markdown-it';
import cheerio                                              from 'cheerio';
import SitePublication, { SitePublicationWithIdType }       from '../../database/mongodb/models/SitePublication';
import PromptAi, { PromptAiArrayType, PromptAiWithIdType }  from "../../database/mongodb/models/PromptAi";
import connectMongoDB                                       from "../../database/mongodb/connect";
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionUserMessageParam}            from 'openai/resources';
import { ACTION_CREATE_DATA_SAVE, ACTION_UPDATE_SCHEMA_ARTICLE, PromptAICallInterface, PromptAiCallsInterface, StructureChapter, StructureChaptersData, TYPE_IN_JSON, TYPE_READ_STRUCTURE_FIELD }    from './Interface/OpenAiInterface';
import Site, { SiteWithIdType }                             from '../../database/mongodb/models/Site';
import Article, { ArticleWithIdType }                       from '../../database/mongodb/models/Article';

const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

class OpenAiService {
    htmlText:string;

    openai  = new OpenAI({baseURL:process.env.OPENAI_BASE_URL, apiKey:process.env.OPENAI_API_KEY});
    md      = new MarkdownIt();    

    constructor() {
        this.htmlText = '';
        connectMongoDB();
    }

    public async getInfoPromptAi(siteName: string, generateValue: number): Promise<boolean> {
        try {
            const sitePublication: SitePublicationWithIdType | null         = await SitePublication.findOne({sitePublication: siteName});
            const article:ArticleWithIdType | null                          = await Article.findOne({ sitePublication: sitePublication?._id, genarateGpt: generateValue });
            const text:string|undefined                                     = article?.body;

            //Recupera la logina di generazione in base al sito su cui pubblicare
            const promptAi: PromptAiWithIdType| null                        = await PromptAi.findOne({sitePublication: siteName});           

            if(promptAi !== null && text !== undefined && article !== null ) {                
                //Recupero la chiamata da fare definita nel db promptAi
                const call:PromptAICallInterface|null                       = this.getCurrentCall(promptAi);
                
                if( call != null ) {
                    const updateCalls:PromptAiCallsInterface                = this.setCompleteCall(promptAi,call.key) as PromptAiCallsInterface;                    
                    
                    //Recupero i dati params per lo step corrente
                    const step:ChatCompletionCreateParamsNonStreaming|null  = this.getCurrentStep(promptAi,call.key);                    
                    console.log(step);
                    if( step != null ) {                        
                        const jsonChatCompletation:ChatCompletionCreateParamsNonStreaming = this.appendUserMessage(step,call,promptAi,text);
                        console.log(article?.title);
                        const response: string | null | null                              = await this.runChatCompletitions(jsonChatCompletation);
                        if( response !== null ) {
                            //Aggiorna il campo calls e il campo data del PromptAiSchema
                            
                            if( call.saveFunction == ACTION_CREATE_DATA_SAVE ) {
                                //Genera il dato da salvare in base ai parametri settati nelle calls del PromptAI
                                await this.createDataSave(response, promptAi, call, updateCalls, siteName );
                            } else if( call.saveFunction == ACTION_UPDATE_SCHEMA_ARTICLE ) {
                                await this.updateSchemaArticle(response, call, article );
                            }
                                                        
                        } else {
                            console.log('Nessun risposta PromptAI');
                        }                        
                    } else {
                        console.log('Nessuno step trovato PromptAI');
                    }
                }
            } else {
                console.log('Nessun PromptAI');
            }                                      
        } catch (error:any) {         
            console.error( 'Errore durante il recupero degli articoli',error);            
            return false;
        }
        return true;
    }

    /**
     * Funzione che appende il role user al ChatCompletation     
     */
    private appendUserMessage(step:ChatCompletionCreateParamsNonStreaming,call:PromptAICallInterface,promptAi: PromptAiWithIdType,title:string): ChatCompletionCreateParamsNonStreaming {
                
        switch( call.msgUser.type ) {
            //Se il tipo è inJson significa che il messaggio utente e nello stesso campo
            case TYPE_IN_JSON:
                if( call.msgUser.user !== undefined ) {
                    for (const userMsg of call.msgUser.user) {
                        const placeholder:string    = '[plachehorderContent]';
                        title                       = title.replace(/\\"/g, '\\"');
                        const msg:string            = title.replace(placeholder, title);
                        let chatMessage:ChatCompletionUserMessageParam = {
                            role:    'user', 
                            content: this.unifyString(msg)
                        };
                        step.messages.push(chatMessage)
                    }    
                } else {
                    console.log('appendUserMessage: Manca il campo call.msgUser.user');
                }         
            break;
            case TYPE_READ_STRUCTURE_FIELD:
                if( call.msgUser.field !== undefined ) {
                    call.msgUser.key
                    console.log("step");
                    console.log(step);
                    console.log("call");
                    console.log(call);
                    console.log("promptAi");
                    const chiave                        = call.msgUser.field.toString();
                    const data:StructureChaptersData    = (promptAi as any)[chiave];                    
                    const chapter:StructureChapter|null = this.readStructureField(data);
                    if( chapter !== null ) {
                        let message                     = call.msgUser.message;
                        const placeholder:string        = '[plachehorderContent]';
                        message                         = message.replace(/\\"/g, '\\"');
                        message                         = message.replace(placeholder, chapter.value);

                        let chatMessage:ChatCompletionUserMessageParam = {
                            role:    'user', 
                            content: '"""'+this.unifyString(this.removeHtmlTags(title))+'""". '+message
                        };
                        step.messages.push(chatMessage)
                    }
                    console.log("step");
                    console.log(step);
                }
            break;
        }        
        return step;
    }

    /**
     * Lette la struttura 1 definita per generare un articolo
     */
    private readStructureField(data:StructureChaptersData):StructureChapter|null {
        console.log("data");
        console.log(data[0].getStructure.chapters);
        let firstChapter:StructureChapter|null = null;
        for (const item of data) {
            const chapters = item.getStructure.chapters;
            for (const chapter of chapters) {
                if (chapter.toGenerate === 'true') {
                    firstChapter = chapter;
                    break;
                }
            }            
        }
          
        if( firstChapter !== null ) {
            return firstChapter;
        }

        return null;
    }

    /**
     * Salva il dato nella tabella Article
     */
    private async updateSchemaArticle(response: string, call: PromptAICallInterface, article:ArticleWithIdType) {
                        
        const lastArticle:ArticleWithIdType | null                          = await Article.findOne({ _id: article._id });
        console.log(call);
        
        const filter            = { _id: article._id };
        const update            = { [call.saveTo] : lastArticle?.bodyGpt+' '+response  };
        console.log("=="+update);
        await Article.findOneAndUpdate(filter, update);
    }

    /**
     * Salva il dato nella tabella promptAI
     */
    private async createDataSave(response: string, promptAi: PromptAiWithIdType, call: PromptAICallInterface, updateCalls:PromptAiCallsInterface, siteName:string): Promise<boolean> {
        const field: string = call.saveTo;
        let dataField: any = {}; // Inizializza dataField come un oggetto vuoto
    
        switch (field) {
            case 'data':                                
                dataField = promptAi.data || '';
                break;
        }
    

        if( dataField == '' ) {
            dataField = [{[call.saveKey]: JSON.parse(response)}];
        } else {
            dataField = dataField.map((item:any) => ({ ...item, [call.saveKey]: JSON.parse(response) }));    
        }
        
        const filter            = { sitePublication: siteName };
        const update            = { [field] : dataField, calls: updateCalls };
        await PromptAi.findOneAndUpdate(filter, update);
        
        return true;
    }
    

    /**
     * Recupera la chiamata che deve essere effettuata da inviare a OpenAi     
     */
    public getCurrentCall(promptAi: PromptAiWithIdType): PromptAICallInterface | null {
        const calls: PromptAiCallsInterface = promptAi.calls as PromptAiCallsInterface;

        for (let i = 0; i < calls.length; i++) {
            const call = calls[i];
            if (call.complete === 0) { // Assumo che `complete` sia 0 per le chiamate non completate
                return call;
            }
        }
        return null;
    }

     /**
     * Recupera la chiamata che deve essere effettuata da inviare a OpenAi     
     */
     public setCompleteCall(promptAi: PromptAiWithIdType,key:string): PromptAiCallsInterface | null {
        const calls: PromptAiCallsInterface = promptAi.calls as PromptAiCallsInterface;        

        for (let i = 0; i < calls.length; i++) {
            const call = calls[i];
            if (call.key === key) { // Assumo che `complete` sia 0 per le chiamate non completate
                call.complete = 1;
            }
        }
        return calls;
    }

    /**
     * Recupera il ChatCompletionCreateParamsNonStreaming dello step attuale     
     */
    public getCurrentStep(promptAi: PromptAiWithIdType, call:string): ChatCompletionCreateParamsNonStreaming|null {
        const steps: any = promptAi.steps;   
        
        for (const item of steps) {
            if (item.hasOwnProperty(call)) {
                return item[call];                
            }
        }       
        return null;
    }
    
   
    public async runChatCompletitions(chatCompletionParam:ChatCompletionCreateParamsNonStreaming): Promise<string | null> {
        try {      
            if (chatCompletionParam) {                                                
                console.log(chatCompletionParam);
                const completion = await this.openai.chat.completions.create(chatCompletionParam);       
                console.log(completion.choices[0].message.content);           
                return completion.choices[0].message.content;
               
                // if( structureArticle != null ) {
                //     //TODO salva in Schema PromptAI
                //     const jsonString = this.ucfirst(structureArticle);
                //     if( jsonString != null ) {
                //         const data = JSON.parse(jsonString);
                //         console.log(data);

                //         let testGenerate = '';
                //         for (const key in data) {
                //             if (data.hasOwnProperty(key)) {
                //                 const element = data[key];
                //                 // Chiamare la funzione getArticle per ogni iterazione
                //                 // console.log(element.h2);
                //                 testGenerate += element.h2;
                                                                
                //                 let prompt:string = 'The buying guide: '+title+'. I write the text delimited by triple quotes. """'+element.h2+'""". I provide you with the structure of the chapters to write in json format:'+ jsonString;
                //                 let liPrompt:string = '. Subchapters: ';
                //                 for (const subtitle of element.h3) {
                //                     // console.log( subtitle );
                //                     // testGenerate += subtitle ;
                //                     // testGenerate += await this.getArticle('Scrivi il testo per il paragrafo h2 delimitato da virgolette triple in circa 150 parole. """' + title + '""","""' + element.h2 + '""","""' + subtitle + '"""',testGenerate);
                //                     // await this.sleep(21000);
                                    
                //                     liPrompt += `"""${subtitle}""",`;
                //                 }
                //                 //prompt += liPrompt;

                //                 testGenerate += await this.getArticle(prompt,structureArticle);
                //                 console.log(`--- \n ${prompt} \n`);
                //                 await this.sleep(21000);
                                
                //             }                      
                //             console.log(this.md.render(testGenerate));
                //         }
                        
                //         console.log(this.md.render(testGenerate));
                //         console.log('###');
                //     }
                // }
                
            }
            return null;
        } catch (error:any) {            
            console.error('processArticle: Errore durante l\'elaborazione dell\'articolo', error);
            return null;
        }
    }

    private unifyString(stringWithNewlines:string):string {
        const unifiedString = stringWithNewlines.replace(/\n|\r\n|\r/g, '');
        return unifiedString;
    }

    private removeHtmlTags(htmlString:string) {
        // Carica la stringa HTML utilizzando cheerio
        const $ = cheerio.load(htmlString);
        
        // Trova tutti i tag HTML e rimuovili
        $('*').each((index: any, element: any) => {
          $(element).replaceWith($(element).text().trim());
        });
        
        // Ritorna la stringa senza tag HTML
        return $.text().trim();
      }

    public sleep(ms:any) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

// const c = new OpenAiService();
// c.getInfoPromptAi('acquistigiusti.it', 'Come scegliere un cardiofrequenzimetro');

export default OpenAiService;


