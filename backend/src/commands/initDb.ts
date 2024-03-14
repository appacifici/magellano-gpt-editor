import mongoose, { Model }                              from 'mongoose';
import connectMongoDB                                   from '../database/mongodb/connect';
import {ISite, SiteSchema, SiteArrayType}               from '../database/mongodb/models/Site';
import {IArticle, ArticleSchema, ArticleArrayType}      from '../database/mongodb/models/Article';
import {IImage, ImageWPSchema, ImageArrayType}          from '../database/mongodb/models/ImageWP';
import {IPromptAi, PromptAiArrayType, PromptAiSchema}   from '../database/mongodb/models/PromptAi';
import { SitePublicationSchema, ISitePublication, 
    SitePublicationArrayType }                          from '../database/mongodb/models/SitePublication';

connectMongoDB();

const SitePublication:      Model<ISitePublication>         = mongoose.model<ISitePublication>('SitePublication', SitePublicationSchema);
const Site:                 Model<ISite>                    = mongoose.model<ISite>('Site', SiteSchema);
const Article:              Model<IArticle>                 = mongoose.model<IArticle>('Article', ArticleSchema);
const ImageWP:              Model<IImage>                   = mongoose.model<IImage>('ImageWP', ImageWPSchema);
const PromptAi:             Model<IPromptAi>                = mongoose.model<IPromptAi>('PromptAi', PromptAiSchema);

const sitePublicationToInsert:SitePublicationArrayType = [
    {   sitePublication:    'cronacalive.it', 
        tokenUrl:           'https://www.cronacalive.it/wp-json/jwt-auth/v1/token',
        url:                'https://www.cronacalive.it/wp-json/wp/v2/posts',
        urlImages:           'https://www.cronacalive.it/wp-json/wp/v2/media',
        username:           'Admin',  
        password:           'dUJ44cXYK5%DtCKBW8B%6xy(',  
        active:             1,
        page:               1,
    },
    {   sitePublication:    'roma.cronacalive.it', 
        tokenUrl:           'https://roma.cronacalive.it/wp-json/jwt-auth/v1/token',
        url:                'https://roma.cronacalive.it/wp-json/wp/v2/posts',
        urlImages:          'https://roma.cronacalive.it/wp-json/wp/v2/media',
        username:           'Administrator',  
        password:           'rl5Bmi&$9VXAVyEZJv',  
        active:             1,
        page:               1,
    },
];

SitePublication.insertMany(sitePublicationToInsert)
.then((docs) => {
    console.log('SitePublication inserted successfully:', docs);
})
.catch((err) => {
    console.error('Error inserting SitePublication:', err);
});


const promptAiToInsert:PromptAiArrayType = [
    {   sitePublication:    'roma.cronacalive.it', 
        calls:              [{"key":"getStructure","saveFunction":"createDataSave","saveTo":"data","saveKey":"getStructure","complete":0,"msgUser":{"type":"inJson","user":[{"message":"Rispondi in formato JSON, al titolo delimitato da virgolette triple: [plachehorderContent]"}]}},{"key":"getArticle","saveFunction":"updateSchemaArticle","saveTo":"bodyGpt","saveKey":"","complete":0,"msgUser":{"type":"readStructureField","field":"data","readKey":"getStructure","message":"Scrivi il capitolo: [plachehorderContent]"}}],
        steps:              [{"getStructure":{"messages":[{"role":"system","content":"Sei un utile assistente pensato per produrre JSON, esperto nella generazione articoli giornalistici professionali. Il tuo obiettivo è generare la struttura di una guida che risponda a tutte le informazioni necessarie. Ti verranno forniti degli articoli di esempio per i quali dovrai generare la struttura dei capitoli (h2) del testo da scrivere. Il testo generato deve essere molto esauriente e contenere tutte le informazioni utili. Massimo 3 capitoli. Rispondi con un JSON con questo formato:[{\"chapters\": {\"toGenerate\":\"true\",\"type\": \"h1/h2/h3\",\"value\": \"string\"}}]"}],"model":"gpt-3.5-turbo-1106","temperature":0.6,"top_p":0.9,"response_format":{"type":"json_object"}}},{"getArticle":{"messages":[{"role":"system","content":"Ruolo: Sei un utile giornalista professinista. Obiettivo: Scrivi un capitolo di un articolo. Stile di scrittura: professionale. Tono: professionale. Lingua: italiano. Lunghezza 200 parole. Ti verra fornito il testo da elaborare tra triplo apice"}],"model":"gpt-3.5-turbo-1106","temperature":0.6,"top_p":0.9}}],
        data:               [],
        numStep:            1,  
        complete:           0,
        typePrompt:         1
    },
    {   sitePublication:    'roma.cronacalive.it', 
        calls:              [{"key":"getArticle","saveFunction":"writeBodyArticle","saveTo":"bodyGpt","saveKey":"","complete":0,"msgUser":{"type":"inJson","user":[{"message":"<article>[plachehorderContent]</article>"}]}}],
        steps:              [{"getArticle":{"messages":[{"role":"system","content":"Ruolo: Sei un utile giornalista professinista. Obiettivo: Riscrivi un articolo. Stile di scrittura: professionale. Tono: professionale. Lingua: italiano. Lunghezza 500 parole. Struttura: {\"H1\":{\"content\":\"Introduzione di 100 parole\"},\"H2\":[{\"content\":\"Testo H2 1 (max 100 parole)\"},{\"content\":\"Testo H2 2 (max 100 parole)\"},{\"content\":\"Testo H2 3 (max 100 parole)\"}]}. Ti verrà fornito un articolo (delimitato con tag XML) sullo stesso argomento. Devi scrivere un articolo cambiando più che puoi l'originale"}],"model":"gpt-3.5-turbo-1106","temperature":0.6,"top_p":0.9}}],
        data:               [],
        numStep:            1,  
        complete:           0,
        typePrompt:         1
    },
    {   sitePublication:    'roma.cronacalive.it', 
        calls:              [{"key":"getArticle","saveFunction":"writeBodyArticle","saveTo":"bodyGpt","saveKey":"","complete":0,"msgUser":{"type":"inJson","user":[{"message":"<article>[plachehorderContent]</article>"}]}}],
        steps:              [{"getArticle":{"messages":[{"role":"system","content":"Ruolo: Sei un utile giornalista professinista. Obiettivo: Riscrivi un articolo cambiando più che puoi l'originale e apliando il contenuto. Stile di scrittura: professionale. Tono: professionale. Lingua: italiano. Lunghezza: Minimo 500 parole. Struttura:<articolo><h1>Titolo dell'articolo</h1><p minLength=\"50 words\" maxLength=\"100 words\">Sottotitolo dell'articolo</p><h2 minLength=\"50 words\" maxLength=\"150 words\">Primo paragrafo dell'articolo</h2><h2 minLength=\"50 words\" maxLength=\"150 words\">Secondo paragrafo dell'articolo.</h2><h2 minLength=\"50 words\" maxLength=\"150 words\">Terzo paragrafo dell'articolo.</h2></articolo>. Ti verrà fornito un articolo (delimitato con tag XML) sullo stesso argomento."}],"model":"gpt-3.5-turbo-1106","temperature":0.6,"top_p":0.9}}],
        data:               [],
        numStep:            1,  
        complete:           0,
        typePrompt:         1
    },
    {   sitePublication:    'roma.cronacalive.it', 
        calls:              [{"key":"getArticle","saveFunction":"writeTotalArticle","saveTo":"bodyGpt","saveKey":"","complete":0,"msgUser":{"type":"inJson","user":[{"message":"<article>[plachehorderContent]</article>"}]}}],
        steps:              [{"getArticle":{"messages":[{"role":"system","content":"Ruolo: Sei un utile giornalista professinista. Obiettivo: Riscrivi un articolo cambiando più che puoi l'originale e apliando il contenuto. Stile di scrittura: professionale. Tono: professionale. Lingua: italiano. Lunghezza: Minimo 500 parole. Struttura:<articolo><meta><metaTitle maxLength=\"80 characters\">Meta title dell'articolo</metaTitle><metaDescription maxLength=\"130 characters\">Meta title dell'articolo</metaDescription></meta><h1>Titolo dell'articolo</h1><p minLength=\"100 words\" maxLength=\"150 words\">Sottotitolo dell'articolo</p><h2 minLength=\"100 words\" maxLength=\"200 words\">Primo paragrafo dell'articolo</h2><h2 minLength=\"100 words\" maxLength=\"200 words\">Secondo paragrafo dell'articolo.</h2><h2 minLength=\"100 words\" maxLength=\"200 words\">Terzo paragrafo dell'articolo.</h2></articolo>. Ti verrà fornito un articolo (delimitato con tag XML) sullo stesso argomento."}],"model":"gpt-3.5-turbo-1106","temperature":0.6,"top_p":0.9}}],
        data:               [],
        numStep:            1,  
        complete:           0,
        typePrompt:         1
    }
];


PromptAi.insertMany(promptAiToInsert)
.then((docs) => {
    console.log('PromptAi inserted successfully:', docs);
})
.catch((err) => {
    console.error('Error inserting PromptAi:', err);
});

const sitesToInsert:SiteArrayType = [
    { 
        site:                   'vanityfair.it', 
        sitePublication:        'cronacalive.it', 
        url:                    'https://www.vanityfair.it/sitemap.xml',
        active:                 1, 
        format:                 'sitemap',
        categoryPublishSite:    1,
        userPublishSite:        19,
    },
    { 
        site:                   'ilcorrieredellacitta.com', 
        sitePublication:        'roma.cronacalive.it', 
        url:                    'https://www.ilcorrieredellacitta.com/sitemap-news.xml',
        active:                 1, 
        format:                 'sitemap',
        categoryPublishSite:    1,
        userPublishSite:        19,
    },
    { 
        site:                   'romatoday.it', 
        sitePublication:        'roma.cronacalive.it', 
        url:                    'https://www.romatoday.it/sitemaps/sitemap_news.xml',
        active:                 1, 
        format:                 'sitemap',
        categoryPublishSite:    1,
        userPublishSite:        19,
    }
];

Site.insertMany(sitesToInsert)
.then((docs) => {
    console.log('Sites inserted successfully:', docs);
    process.exit(1);
})
.catch((err) => {
    console.error('Error inserting Sites:', err);
    process.exit(0);
});