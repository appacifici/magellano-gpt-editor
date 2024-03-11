const TYPE_IN_JSON:string       = 'inJson';
const TYPE_READ_TO_FIELD:string = 'readToField';

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
    key:        string;
    saveTo:     string;
    saveKey:    string;
    msgUser:    {
        type:   string,
        user?:   [{
            message: string 
        }],
        field: string
        key:   string
    };
    complete:   number;
}

type PromptAiCallsInterface = PromptAICallInterface[];

export type {PromptAiCallsInterface};
export {PromptAICallInterface,ChatMessage,ChatMessageArray, TYPE_IN_JSON, TYPE_READ_TO_FIELD};