
import dotenv                                               from 'dotenv';
import OpenAI                                               from "openai";
import MarkdownIt                                           from 'markdown-it';
import cheerio                                              from 'cheerio';
import xml2js from 'xml2js';
import SitePublication, { SitePublicationWithIdType }       from '../../database/mongodb/models/SitePublication';
import PromptAi, { PromptAiWithIdType }                     from "../../database/mongodb/models/PromptAi";
import connectMongoDB                                       from "../../database/mongodb/connect";
import Article, { ArticleWithIdType }                       from '../../database/mongodb/models/Article';
import { 
    ChatCompletionCreateParamsNonStreaming, 
    ChatCompletionUserMessageParam}                         from 'openai/resources';
import { 
    ACTION_CREATE_DATA_SAVE, 
    ACTION_UPDATE_SCHEMA_ARTICLE,
    TYPE_IN_JSON, 
    TYPE_READ_STRUCTURE_FIELD, 
    PromptAICallInterface, 
    PromptAiCallsInterface, 
    StructureChapter, 
    StructureChaptersData, 
    ACTION_WRITE_BODY_ARTICLE,
    ACTION_WRITE_TOTAL_ARTICLE}                                 from './Interface/OpenAiInterface';
import { Console } from 'console';

const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

class OpenAiService {
    htmlText:string;

    openai  = new OpenAI({baseURL:process.env.OPENAI_BASE_URL, apiKey:process.env.OPENAI_API_KEY});
    md      = new MarkdownIt();    

    constructor() {
        this.htmlText = '';
        connectMongoDB();
    }

    public async getInfoPromptAi(siteName: string, promptAiId:string, generateValue: number): Promise<boolean> {
        try {
            const sitePublication: SitePublicationWithIdType | null         = await SitePublication.findOne({sitePublication: siteName});
            const article:ArticleWithIdType | null                          = await Article.findOne({ sitePublication: sitePublication?._id, genarateGpt: generateValue });
            if( article?.body === undefined) {
                return false;
            }
            const text:string|undefined                                     = this.unifyString(this.removeHtmlTags(article?.body));

            //Recupera la logina di generazione in base al sito su cui pubblicare
            const promptAi: PromptAiWithIdType| null                        = await PromptAi.findOne({sitePublication: siteName, _id: promptAiId});           

            if(promptAi !== null && text !== undefined && article !== null ) {                
                //Recupero la chiamata da fare definita nel db promptAi
                const call:PromptAICallInterface|null                       = this.getCurrentCall(promptAi);
                
                if( call != null ) {
                    //Crea il json della call corrente con il campo complete ad 1 per il successivo salvataggio
                    const updateCalls:PromptAiCallsInterface                = this.setCompleteCall(promptAi,call.key) as PromptAiCallsInterface;                    
                    
                    //Recupero i dati params per lo step corrente
                    const step:ChatCompletionCreateParamsNonStreaming|null  = this.getCurrentStep(promptAi,call.key);                    
                    console.log(step);
                    if( step != null ) {                        
                        const jsonChatCompletation:ChatCompletionCreateParamsNonStreaming = this.appendUserMessage(step,call,promptAi,text);
                        console.log(article?.title);
                        const response: string | null                                     = await this.runChatCompletitions(jsonChatCompletation);
                        if( response !== null ) {
                            //Aggiorna il campo calls e il campo data del PromptAiSchema
                            
                            //Slvataggio della struttura
                            if( call.saveFunction == ACTION_CREATE_DATA_SAVE ) {
                                //Genera il dato da salvare in base ai parametri settati nelle calls del PromptAI
                                await this.createDataSave(response, promptAi, call, updateCalls, siteName );

                            //Salvataggio Diretto del body
                            } else if( call.saveFunction == ACTION_WRITE_TOTAL_ARTICLE ) {
                                try {                            
                                    const responseUpdate:boolean = await this.updateSchemaArticle(response, call, article );  
                                    if( responseUpdate === true ) {                                               
                                        //await this.setArticleComplete(article, promptAi);                                    
                                        console.log('Articolo generato correttamente e completato con successo.');
                                    } else {
                                        console.error('Si è verificato un errore durante l\'aggiornamento:');    
                                    }
                                } catch (error) {
                                    console.error('Si è verificato un errore durante l\'aggiornamento:', error);
                                }

                            } else if( call.saveFunction == ACTION_WRITE_BODY_ARTICLE ) {
                                try {                            
                                    const responseUpdate:boolean = await this.updateSchemaArticle(response, call, article );  
                                    if( responseUpdate === true ) {                                               
                                        await this.setArticleComplete(article, promptAi);                                    
                                        console.log('Articolo generato correttamente e completato con successo.');
                                    } else {
                                        console.error('Si è verificato un errore durante l\'aggiornamento:');    
                                    }
                                } catch (error) {
                                    console.error('Si è verificato un errore durante l\'aggiornamento:', error);
                                }
                            
                            //Salvataggio capitolo in body
                            } else if( call.saveFunction == ACTION_UPDATE_SCHEMA_ARTICLE ) {
                                //Recupero il capitolo corrente gestisto
                                const chiave                                            = call.msgUser.field.toString();
                                const data:StructureChaptersData                        = (promptAi as any)[chiave];                    
                                const structureChapter:StructureChapter|null            = this.readStructureField(data);
                                const structureChaptersData:StructureChaptersData|null  = this.setStructureFieldChapterGenerate(data,'false');                                         
                                await PromptAi.findByIdAndUpdate(promptAi._id, { data: structureChaptersData });

                                //Appenda il capitolo nel caso di generazione da struttura definita
                                const chapterArticle:string             = structureChapter !== null ? `<${structureChapter?.type}>${structureChapter?.value}</${structureChapter?.type}>${response}` : '';
                                const responseUpdate:boolean            = await this.updateSchemaArticle(chapterArticle, call, article );

                                const checkIfLastChapter:boolean        = this.checkIfLastChapter(structureChaptersData,'false');     
                                //Deve essere fatto solo quando è alla generazione dell'ultimo capitolo
                                if( responseUpdate === true && checkIfLastChapter === true ) {                                                                                                             
                                    console.log(structureChaptersData[0].getStructure.chapters);
                                    try {                                                                                                                        
                                        await this.setArticleComplete(article, promptAi);                                    
                                        console.log('Articolo generato correttamente e completato con successo.');
                                    } catch (error) {
                                        console.error('Si è verificato un errore durante l\'aggiornamento:', error);
                                    }
                                }                                
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

    private async setArticleComplete(article:ArticleWithIdType, promptAi: PromptAiWithIdType) {
        try {
            const update = {genarateGpt:1};
            const filter = { _id: article._id };
            const result = await Article.findOneAndUpdate(filter, update);
        
            // Se l'aggiornamento di 'Article' ha avuto successo, aggiorna 'PromptAi'
            //TODO: questa parte deve essere centralizzata perchè la deve chiamare anche il case sopra
            if (result) {
                // Setta la calls a complete in 'PromptAi'
                const updateCalls:PromptAiCallsInterface = this.setAllCallUncompliete(promptAi) as PromptAiCallsInterface; 
                const filterPromptAi = { _id: promptAi._id };
                const updatePromptAi = { calls: updateCalls, data : [{}] };
        
                await PromptAi.findOneAndUpdate(filterPromptAi, updatePromptAi);
            } else {
                console.error('Nessun articolo trovato o aggiornato.');
                return false;
            }
        } catch (error) {
            console.error(`Si è verificato un errore durante la ricerca e l'aggiornamento dell'articolo: ${error}`);
            return false;
        }
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
                        console.log("====>"+userMsg.message);
                        title                       = title.replace(/\\"/g, '\\"');                        
                        const msg:string            = userMsg.message.replace(placeholder, title);
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
     * Legge la struttura 1 definita per generare un articolo
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
     * Setta toGenerate a true per il capitolo appena generato 
     */
    private setStructureFieldChapterGenerate(data: StructureChaptersData, toGenerate: string): StructureChaptersData {
        console.log("data");
        console.log(data[0].getStructure.chapters);
        
        for (const item of data) {
            const chapters = item.getStructure.chapters;
            for (const chapter of chapters) {
                if (chapter.toGenerate === 'true') {
                    chapter.toGenerate = toGenerate;
                    break;
                }
            }            
        }
        return data;
    }

    /**
     * Determina se è l'ultimo capitolo da generate 
     */
    private checkIfLastChapter(data: StructureChaptersData, toGenerate: string): boolean {        
        let checkLast = true;        
        for (const item of data) {
            const chapters = item.getStructure.chapters;
            for (const chapter of chapters) {
                if (chapter.toGenerate === 'true') {
                    checkLast = false;
                    break;
                }
            }            
        }
        return checkLast;
    }
    

    /**
     * Salva il dato in update nella tabella Article
     */
    private async updateSchemaArticle(response: string, call: PromptAICallInterface, article:ArticleWithIdType): Promise<boolean> {      
        const parserOptions: xml2js.Options = {
            explicitArray: false, // Imposta su false per trattare gli elementi con un solo elemento come oggetti invece di array
        };
        
        // Parser XML
        const parser: xml2js.Parser = new xml2js.Parser(parserOptions);
        
        // Parsa il documento XML
        parser.parseString(response, (err: any, result: any) => {
            if (err) {
                console.error('Errore nel parsing del file XML:', err);
                return;
            }
            
            // Recupera i nodi metaTitle, metaDescription e article separatamente
            const metaTitle: string         = result.root.meta.metaTitle;
            const metaDescription: string   = result.root.meta.metaDescription;
            let articleXmlString: string    = new xml2js.Builder().buildObject(result.root.article);
            articleXmlString                = articleXmlString.replace(/<\?xml.*?\?>/, '');
            articleXmlString                = articleXmlString.replace(/<root>/g, '<article>');
            articleXmlString                = articleXmlString.replace(/<\/root>/g, '</article>');

            
            // Output del risultato
            console.log('Meta Title:', metaTitle);
            console.log('Meta Description:', metaDescription);
            console.log('Article:', articleXmlString);
        });
        //TODO devi gestire bene il campo in cui salvare se prenderlo da calls o harcoded in base al tipo passato di funzione
  
        if( response !== null ) {
            return false;
        }

        const lastArticle:ArticleWithIdType | null  = await Article.findOne({ _id: article._id });        
        const filter                                = { _id: article._id };
        const baseArticle:string                    = lastArticle?.bodyGpt !== undefined ? lastArticle?.bodyGpt : '';
        const update                                = {[call.saveTo] : baseArticle+' '+response};

        return await Article.findOneAndUpdate(filter, update).then(result => {
            return true;
        }).catch(error => {            
            console.error(`Si è verificato un errore durante la ricerca dell'articolo: ${error}`);
            return false;
        });
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
        
        const filter            = { _id: promptAi._id };
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
     * Setta il complete della call ad 1     
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
     * Effettua il reset di tutti i complete delle calls per poter lavorare con il nuovo articolo     
     */
    public setAllCallUncompliete(promptAi: PromptAiWithIdType): PromptAiCallsInterface | null {
        const calls: PromptAiCallsInterface = promptAi.calls as PromptAiCallsInterface;        

        for (let i = 0; i < calls.length; i++) {
            const call = calls[i];            
            call.complete = 0;            
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
    
    //Effettua la chiamata ad OpenAi
    public async runChatCompletitions(chatCompletionParam:ChatCompletionCreateParamsNonStreaming): Promise<string | null> {
        try {      
            if (chatCompletionParam) {                                                
                console.log(chatCompletionParam);
                const completion = await this.openai.chat.completions.create(chatCompletionParam);       
                console.log(completion.choices[0].message.content);    
                if( completion.choices[0].message.content !== null ) {       
                    return completion.choices[0].message.content;
                } else {
                    return null;
                }
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


