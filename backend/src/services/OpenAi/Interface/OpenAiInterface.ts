const TYPE_IN_JSON:string                       = 'inJson';
const TYPE_READ_STRUCTURE_FIELD:string          = 'readStructureField';
const ACTION_CREATE_DATA_SAVE:string            = 'createDataSave';
const ACTION_UPDATE_SCHEMA_ARTICLE:string       = 'updateSchemaArticle';

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

interface PromptAICallInterface {
    key:            string;
    saveFunction:   string;
    saveTo:         string;
    saveKey:        string;
    msgUser:    {
        type:   string,
        user?:   [{
            message: string 
        }],
        field:      string
        key:        string,
        message:    string 
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

export type {PromptAiCallsInterface};
export {
    PromptAICallInterface, 
    ChatMessage,
    ChatMessageArray, 
    StructureChapter, 
    StructureChaptersData, 
    TYPE_IN_JSON, 
    TYPE_READ_STRUCTURE_FIELD,
    ACTION_CREATE_DATA_SAVE,
    ACTION_UPDATE_SCHEMA_ARTICLE
};