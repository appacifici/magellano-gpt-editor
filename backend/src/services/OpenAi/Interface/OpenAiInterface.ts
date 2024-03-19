//Da dove deve leggere i dati per creare il message user nel json call
const TYPE_IN_JSON:string                               = 'inJson';
const TYPE_READ_STRUCTURE_FIELD:string                  = 'readStructureField';
const TYPE_READ_FROM_DATA_PROMPT_AND_ARTICLE:string     = 'readStructureFieldAndArticle'; //Prende il testo dallo schema article e lo genera completando lo user message dal campo data del promptAi
const TYPE_READ_WRITE_DYNAMIC_SCHEMA:string             = 'readWriteDimanycSchema'; //Prende il testo dallo schema article e lo genera completando lo user message dal campo data del promptAi

//Tipi di azioni(funzioni) che si possono invocare nella call
const ACTION_CREATE_DATA_SAVE:string            = 'createDataSave'; //salvataggio in campo data promptAi
const ACTION_UPDATE_SCHEMA_ARTICLE:string       = 'updateSchemaArticle'; //Salvataggio capitolo scritto nell'articolo
const ACTION_WRITE_BODY_ARTICLE:string          = 'writeBodyArticle'; //Salvataggio articolo in 1 step
const ACTION_WRITE_TOTAL_ARTICLE:string         = 'writeTotalArticle'; //Salvataggio articolo completo in 1 step
const ACTION_CALLS_COMPLETE:string              = 'callsCompete'; //Tutte le calls eseguite
const ACTION_READ_WRITE_DYNAMIC_SCHEMA:string   = 'readWriteDimanycSchema'; //Tutte le calls eseguite

interface ChatMessageArray {
    messages:       ChatMessage[];
    model:          string;
    temperature:    number;
    top_p:          number;
    response_format?: {
        type: string;
    };
}

interface ChatMessage {
    role:       string;
    content:    string;
}

type TypeMsgUserRaplace = {
    schema: string; 
    field:  string;
}
interface TypeSavaToObject extends TypeMsgUserRaplace {
    responseField: string;
}

//TODO da definire bene creando delle sotto interfacce per i tipi di msgUser che abbiamo
interface PromptAICallInterface {
    key:            string;
    saveFunction:   string; //Funzione che si occupa del salvataggio dei dati da chiamare
    readTo:         string|[TypeMsgUserRaplace]; //Il campo da cui leggere
    saveTo:         string|[TypeSavaToObject]; //Il campo in cui salvare
    saveKey:        string; //Il nome della chiave in cui sia il caso di salvataggio di un oggetto
    removeHtmlTags: boolean; //Se deve chiamare la funzione di rimozione dei tags
    lastBodyAppend: boolean;
    msgUser:    {
        type:   string,
        user?:   [{
            message: string 
        }],
        field:       string
        key?:        string,
        message:     string 
        readKey?:    string 
        replace?:    [TypeMsgUserRaplace] 
    };
    complete:       number;
}

interface StructureChapter {
    toGenerate: string;
    type:       string;
    value:      string;
}
  
interface StructureChaptersData extends Array<{
    getStructure: {
        chapters: StructureChapter[];
    }
}> {}
  

type PromptAiCallsInterface = PromptAICallInterface[];

export type {PromptAiCallsInterface,TypeMsgUserRaplace};
export {
    PromptAICallInterface, 
    ChatMessage,
    ChatMessageArray, 
    StructureChapter, 
    StructureChaptersData, 
    TypeSavaToObject,
    TYPE_IN_JSON, 
    TYPE_READ_STRUCTURE_FIELD,
    TYPE_READ_FROM_DATA_PROMPT_AND_ARTICLE,
    TYPE_READ_WRITE_DYNAMIC_SCHEMA,
    ACTION_CREATE_DATA_SAVE,
    ACTION_UPDATE_SCHEMA_ARTICLE,
    ACTION_WRITE_BODY_ARTICLE,
    ACTION_WRITE_TOTAL_ARTICLE,
    ACTION_CALLS_COMPLETE,
    ACTION_READ_WRITE_DYNAMIC_SCHEMA        
};