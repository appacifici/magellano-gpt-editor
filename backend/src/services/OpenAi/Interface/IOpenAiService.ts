import { ChatCompletionCreateParamsNonStreaming }           from 'openai/resources';
import { NextArticleGenerate, PromptAICallInterface, PromptAiCallsInterface }    from './OpenAiInterface';
import { ArticleWithIdType }                                from '../../../database/mongodb/models/Article';
import { PromptAiWithIdType }                               from '../../../database/mongodb/models/PromptAi';
import { SitePublicationWithIdType }                        from '../../../database/mongodb/models/SitePublication';

interface IOpenAiService {
    getNextArticleGenerate(siteName: string, generateValue: number): Promise<NextArticleGenerate|null>;
    getInfoPromptAi(alertProcess:string, processName:string, siteName: string, promptAiId: string, generateValue: number): Promise<boolean>;    
}

export { IOpenAiService };