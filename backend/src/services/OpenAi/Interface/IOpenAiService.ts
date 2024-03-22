import { ChatCompletionCreateParamsNonStreaming }           from 'openai/resources';
import { PromptAICallInterface, PromptAiCallsInterface }    from './OpenAiInterface';
import { ArticleWithIdType }                                from '../../../database/mongodb/models/Article';
import { PromptAiWithIdType }                               from '../../../database/mongodb/models/PromptAi';
import { SitePublicationWithIdType }                        from '../../../database/mongodb/models/SitePublication';

interface IOpenAiService {
    getInfoPromptAi(siteName: string, promptAiId: string, generateValue: number): Promise<boolean>;
    // getCurrentCall(promptAi: PromptAiWithIdType): PromptAICallInterface | null;
    // setCompleteCall(promptAi: PromptAiWithIdType, key: string): PromptAiCallsInterface | null;
    // setAllCallUncomplete(promptAi: PromptAiWithIdType): Promise<boolean>;
    // getCurrentStep(promptAi: PromptAiWithIdType, call: string): ChatCompletionCreateParamsNonStreaming | null;
    // runChatCompletitions(chatCompletionParam: ChatCompletionCreateParamsNonStreaming): Promise<string | null>;
    // setArticleComplete(article: ArticleWithIdType, promptAi: PromptAiWithIdType): Promise<boolean>;
    // updateDynamicResponse(response: string, call: PromptAICallInterface, article: ArticleWithIdType): Promise<boolean>;
    // updateSchemaArticle(response: string, call: PromptAICallInterface, article: ArticleWithIdType): Promise<boolean>;
    // createDataSave(response: string | null, promptAi: PromptAiWithIdType, call: PromptAICallInterface, updateCalls: PromptAiCallsInterface, siteName: string): Promise<boolean>;    
}

export { IOpenAiService };