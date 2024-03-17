
import dotenv                                               from 'dotenv';
import OpenAI                                               from "openai";
import MarkdownIt                                           from 'markdown-it';
import cheerio                                              from 'cheerio';
import { DOMParser }                                        from 'xmldom';

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
    TYPE_READ_FROM_DATA_PROMPT_AND_ARTICLE,
    PromptAICallInterface, 
    PromptAiCallsInterface, 
    StructureChapter, 
    StructureChaptersData, 
    ACTION_WRITE_BODY_ARTICLE,
    ACTION_WRITE_TOTAL_ARTICLE,
    ACTION_CALLS_COMPLETE
}                                                           from './Interface/OpenAiInterface';
import { Console } from 'console';
import { observableDiff } from 'deep-diff';
import ChatGptApi from '../ChatGptApi';

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

            //Recupera la logina di generazione in base al sito su cui pubblicare
            const promptAi: PromptAiWithIdType| null                        = await PromptAi.findOne({sitePublication: siteName, _id: promptAiId});   
            if(promptAi == null ) {  
                console.log('getInfoPromptAi: promptAi == null');
                return false;                
            }
            //Recupero la chiamata da fare definita nel db promptAi
            const call:PromptAICallInterface|null                           = this.getCurrentCall(promptAi);            
            if(call == null ) {  
                console.log('getInfoPromptAi: call == null');
                return false;                
            }
            

            const sitePublication: SitePublicationWithIdType | null         = await SitePublication.findOne({sitePublication: siteName});
            const article:ArticleWithIdType | null                          = await Article.findOne({ sitePublication: sitePublication?._id, genarateGpt: generateValue });
            if( article === null ) {
                return false;
            }            

            console.log(call.readTo);
            //Questw funzioni sul testo vengono attivate o disattivare dai settings della call 
            let text:string|undefined  = this.unifyString(article[`${call.readTo}`]);                        
            if( call.removeHtmlTags === true ) {
                //Deve però rimuovere sempre i tag img
                text = this.removeHtmlTags(article[`${call.readTo}`]);                                
            }

            if(promptAi !== null && text !== undefined && article !== null ) {                                                
                
                if( call != null ) {                                                                
                    //Recupero i dati params per lo step corrente                    
                    const step:ChatCompletionCreateParamsNonStreaming|null  = this.getCurrentStep(promptAi,call.key);                    
                    console.log("==>"+step);

                    if( step != null ) {            
                        //Crea il json della call corrente con il campo complete ad 1 per il successivo salvataggio     
                        const updateCalls:PromptAiCallsInterface                          = this.setCompleteCall(promptAi,call.key) as PromptAiCallsInterface;               
                        const jsonChatCompletation:ChatCompletionCreateParamsNonStreaming = this.appendUserMessage(step,call,promptAi,text);
                        console.log(article?.title);
                        const response: string | null = call.saveFunction !== ACTION_CALLS_COMPLETE ? await this.runChatCompletitions(jsonChatCompletation) : '';
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
                                        await this.createDataSave(null, promptAi, call, updateCalls, siteName );                             
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
                                        await this.createDataSave(null, promptAi, call, updateCalls, siteName );                                  
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
                                                                            
                                        console.log('Articolo generato correttamente e completato con successo.');
                                    } catch (error) {
                                        console.error('Si è verificato un errore durante l\'aggiornamento:', error);
                                    }
                                }
                            //Chiusura chiamate calls e salvataggio articolo a complete 1
                            } else if( call.saveFunction == ACTION_CALLS_COMPLETE ) {
                                this.setAllCallUncomplete(promptAi);
                                await this.setArticleComplete(article, promptAi);
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
            case TYPE_READ_FROM_DATA_PROMPT_AND_ARTICLE:
                if( call.msgUser.field !== undefined ) {
                    call.msgUser.key
                    console.log("step");
                    console.log(step);
                    console.log("call");
                    console.log(call);
                    console.log("promptAi");
                    const chiave                        = call.msgUser.field.toString();
                    const dataJson:any                  = (promptAi as any)[chiave];                    
                    
                    if( dataJson !== null ) {
                        let message                     = call.msgUser.message;
                        const placeholder:string        = '[plachehorderContent]';
                        message                         = message.replace(/\\"/g, '\\"');
                        message                         = message.replace(placeholder, JSON.stringify(dataJson));

                        let chatMessage:ChatCompletionUserMessageParam = {
                            role:    'user', 
                            content: '<article>'+this.unifyString(title)+'</article>. '+message
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
        const lastArticle:ArticleWithIdType | null  = await Article.findOne({ _id: article._id });   
        let update = {};
                

        //Se in una chiamata riceve tutti i campi necessari a generare l'articolo  
        if( call.saveFunction == ACTION_WRITE_TOTAL_ARTICLE ) {
            const parser = new DOMParser();

            // Parsa il documento XML
            const xmlDoc = parser.parseFromString(response, 'text/xml');

            // Recupera i nodi metaTitle, metaDescription e h1
            const metaTitleNode = xmlDoc.getElementsByTagName('metaTitle')[0];
            const metaDescriptionNode = xmlDoc.getElementsByTagName('metaDescription')[0];
            const h1Node = xmlDoc.getElementsByTagName('h1')[0];

            // Ottieni i testi dei nodi
            const metaTitle = metaTitleNode.textContent;
            const metaDescription = metaDescriptionNode.textContent;
            const h1 = h1Node.textContent;

            // Recupera il nodo <article>
            const articleNode = xmlDoc.getElementsByTagName('article')[0];

            // Ottieni il contenuto del nodo <article> come stringa
            let articleContent = articleNode.toString();

            const $ = cheerio.load(articleContent);
            $('h2 strong').each(function() {            
                $(this).replaceWith($(this).text());
            });

            const articleCheerio:string|null = $('article').html();
            if(  articleCheerio != null ) {
                articleContent = '<article>'+articleCheerio+'</article>';
            }

            update                          = {
                titleGpt:       metaTitle,
                descriptionGpt: metaDescription,
                bodyGpt :       articleContent,
                h1Gpt:          h1
            };
                
        } else {
            const $ = cheerio.load(response);
            $('h2 strong').each(function() {            
                $(this).replaceWith($(this).text());
            });

            const articleCheerio:string|null = $('article').html();
            if(  articleCheerio != null ) {
                response = '<article>'+articleCheerio+'</article>';
            }
            
            const baseArticle:string                = call.lastBodyAppend === true && lastArticle?.bodyGpt !== undefined ? lastArticle?.bodyGpt : '';
            update                                  = {[call.saveTo] : baseArticle+' '+response};
        }
        
        const filter                                = { _id: article._id };
        return await Article.findOneAndUpdate(filter, update).then(result => {
            return true;
        }).catch(error => {            
            console.error(`Si è verificato un errore durante l'update dell'articolo: ${error}`);
            return false;
        });
    }

    /**
     * Salva il dato nella tabella promptAI
     */
    private async createDataSave(response: string|null, promptAi: PromptAiWithIdType, call: PromptAICallInterface, updateCalls:PromptAiCallsInterface, siteName:string): Promise<boolean> {
        const field: string = call.saveTo;
        let dataField: any = {}; // Inizializza dataField come un oggetto vuoto
    
        switch (field) {
            case 'data':                                
                dataField = promptAi.data || '';
                break;
        }
    
        if( response !== null ) {
            if( dataField == '' ) {
                dataField = [{[call.saveKey]: JSON.parse(response)}];
            } else {
                dataField = dataField.map((item:any) => ({ ...item, [call.saveKey]: JSON.parse(response) }));    
            }
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
    public async setAllCallUncomplete(promptAi: PromptAiWithIdType): Promise<boolean> {
        const calls: PromptAiCallsInterface = promptAi.calls as PromptAiCallsInterface;        

        for (let i = 0; i < calls.length; i++) {
            const call = calls[i];            
            call.complete = 0;            
        }

        const filterPromptAi = { _id: promptAi._id };
        const updatePromptAi = { calls: calls, data : [{}] };

        return await PromptAi.findOneAndUpdate(filterPromptAi, updatePromptAi).then(result => {
            return true;
        }).catch(error => {            
            console.error(`Si è verificato un errore durante l'update dell'articolo: ${error}`);
            return false;
        });        
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
                
                if( completion.choices[0].message.content !== null ) {     
                    let response = completion.choices[0].message.content.replace(/minLength="\d+ words"/g, '');
                    response = response.replace(/maxLength="\d+ words"/g, '');  
                    console.log("==>"+response);    
                    return response;
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


