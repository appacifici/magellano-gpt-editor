import mongoose, { Document, Schema, Model, ObjectId } from 'mongoose';



type PromptAiType = {
    sitePublication:        string;
    category?:              number; //Todo da aggiungere nella query di recupero
    calls:                  Object; // [{"getStructure":0},{"getArticle":0}]  
	  steps:					        Object;	// [{"getStructure": {"messages":[{"role":"system","content":"You are a useful assistant designed to produce JSON, expert in generating buying guides. Your goal is to generate the structure of a guide that answers all the questions a user needs to make a purchase. You will be provided with titles for which you will have to generate the structure of the chapters and subchapters of the text to be written. The text generated must be very comprehensive and contain all the useful information to make a choice to purchase a product. Maximum 10 chapters. Reply with a JSON with this format: [{\"introduction\": { \"h2\": \"string\", \"h3\": [\"string\",\"string\",\"string\"]},...]",},{"role":"user","content":"user"}],"model":"gpt-3.5-turbo-1106","temperature":0.6,"top_p":0.9,"response_format":{"type":"json_object"}}}]
    data?:                  Object|string; // [{"structure":{"introduction":{"h2":"Come scegliere un cardiofrequenzimetro","h3":["Cos'è un cardiofrequenzimetro","Benefici dell'utilizzo di un cardiofrequenzimetro","Considerazioni prima dell'acquisto"]},"tipi_di_cardiofrequenzimetri":{"h2":"Tipi di cardiofrequenzimetri","h3":["Cardiofrequenzimetri da polso","Cardiofrequenzimetri da torace","Cardiofrequenzimetri da dito"]},"funzionalità_da_valutare":{"h2":"Funzionalità da valutare","h3":["Precisione della misurazione","Connettività e compatibilità con dispositivi","Modalità di visualizzazione dei dati"]},"comfort_e_durata_della_batteria":{"h2":"Comfort e durata della batteria","h3":["Materiali e design","Autonomia della batteria","Impermeabilità e resistenza al sudore"]},"applicazioni_e_compatibilità":{"h2":"Applicazioni e compatibilità","h3":["Applicazioni per il monitoraggio","Compatibilità con smartphone e smartwatch","Integrazione con altri dispositivi fitness"]}}]
	  numStep:                number; //  Numero richieste step contemporane
    complete:				        number;	// Se è tutto completato
    typePrompt:             number; // Usare costantio 
}

interface IPromptAi extends Document, Omit<PromptAiType, '_id'> {}
type PromptAiWithIdType      = PromptAiType & { _id: Document['_id'] };
type PromptAiArrayWithIdType = PromptAiWithIdType[];
type PromptAiArrayType       = PromptAiType[];

const PromptAiSchema = new Schema({
    sitePublication: { 
        type: String,         
        required: true
    },
    category: { 
        type: String,         
        required: false
    },
    calls: {
      type: Object,
      required: true
    },
    steps: {
      type: Object,
      required: true
    },
    data: {
      type: Object,
      required: false
    },
    numStep: {
      type: Number,
      required: true
    },
    complete: {
      type: Number,         
    },
    typePrompt: {
      type: Number,
      required: true
    }   
});

// PromptAiSchema.index({ PromptAiLink: 1, PromptAiID:1 }, { unique: true });


const PromptAi:Model<IPromptAi> = mongoose.models.PromptAi || mongoose.model('PromptAi', PromptAiSchema);
export type {IPromptAi,PromptAiType, PromptAiWithIdType, PromptAiArrayWithIdType, PromptAiArrayType};
export {PromptAiSchema};
export default PromptAi;