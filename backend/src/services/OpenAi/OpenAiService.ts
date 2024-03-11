
import dotenv                                               from 'dotenv';
import OpenAI                                               from "openai";
import MarkdownIt                                           from 'markdown-it';
import SitePublication, { SitePublicationWithIdType }       from '../../database/mongodb/models/SitePublication';
import PromptAi, { PromptAiArrayType, PromptAiWithIdType }  from "../../database/mongodb/models/PromptAi";
import connectMongoDB                                       from "../../database/mongodb/connect";
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionUserMessageParam}            from 'openai/resources';
import { PromptAICallInterface, PromptAiCallsInterface, StructureChapter, StructureChaptersData, TYPE_IN_JSON, TYPE_READ_STRUCTURE_FIELD }    from './Interface/OpenAiInterface';
import Site, { SiteWithIdType } from '../../database/mongodb/models/Site';
import Article, { ArticleWithIdType } from '../../database/mongodb/models/Article';

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
            const article:ArticleWithIdType | null  = await Article.findOne({ sitePublication: sitePublication?._id, genarateGpt: generateValue });
            const text:string|undefined             = article?.body;
            
            //Recupera il sito su cui pubblicare
            
            

            //Recupera la logina di generazione in base al sito su cui pubblicare
            const promptAi: PromptAiWithIdType| null                        = await PromptAi.findOne({sitePublication: siteName});           

            if(promptAi != null && text != undefined ) {                
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
                        // const response: string | null | null                        = await this.runChatCompletitions(jsonChatCompletation);
                        // if( response !== null ) {
                        //     //Aggiorna il campo calls e il campo data del PromptAiSchema
                        //     const field:string = call.saveTo;
                            
                        //     //Genera il dato da salvare in base ai parametri settati nelle calls del PromptAI
                        //     const dataSave:Object = this.createDataSave(response, promptAi, call);

                        //     const filter = { sitePublication: siteName };
                        //     const update = { [field] : dataSave, calls: updateCalls };
                        //     await PromptAi.findOneAndUpdate(filter, update);
                            
                        // } else {
                        //     console.log('Nessun risposta PromptAI');
                        // }                        
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
                            content: msg
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
                    const chiave = call.msgUser.field.toString();
                    const data:StructureChaptersData = (promptAi as any)[chiave];                    
                    this.readStructureField(data);
                }
            break;
        }        
        return step;
    }

    private readStructureField(data:StructureChaptersData) {
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
            console.log(firstChapter);
        }

    }

    private createDataSave(response: string, promptAi: PromptAiWithIdType, call: PromptAICallInterface): Object {
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
        return dataField;
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

    public sleep(ms:any) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // public async getArticle(info:string,testGenerate:string): Promise<string | null> {
    //     try {                          
    //         if (info) {                                
    //             const completion = await this.openai.chat.completions.create({                   
    //                 messages: [                        
    //                     {
    //                         role: "system",
    //                         content: 'Act as: Copywriter. Text type: Buying guide. Explain well in the chapter the items delimited by triple quotes. Min Length chapters: 700 words. Min Length subchapters: 200 words. Formatting: Important words in bold. Writing style: persuasive. Tone: professional. Italian language. Don\'t generate chapters: Conclusions, Objective: write paragraphs regarding a specific topic of a purchasing guide, to help the reader make a purchase. MyStructure: Write chapters with the Markdown format (##). Write: The chapter must have a short introduction.',
    //                     },                                                
    //                     {
    //                         role: "user", 
    //                         content: info
    //                     }                        
    //                 ],
    //                 model: "gpt-3.5-turbo-1106",
    //                 temperature: 0.6,
    //                 top_p: 0.9,
    //                 // response_format: { "type": "json_object" }
    //             });
                  
    //             let article = this.ucfirst(completion.choices[0].message.content);
    //             if( article != null ) {
    //                 article = article.replace(/<img[^>]*>/g, '');

    //             }
    //             return this.ucfirst(completion.choices[0].message.content);
                
    //         }
    //         return null;
    //     } catch (error:any) {            
    //         console.error('processArticle: Errore durante l\'elaborazione dell\'articolo', error);
    //         return null;
    //     }
    // }
}

// const c = new OpenAiService();
// c.getInfoPromptAi('acquistigiusti.it', 'Come scegliere un cardiofrequenzimetro');

export default OpenAiService;


