import connectMongoDB               from "../../database/mongodb/connect";
import Site, {SiteArrayWithIdType, SiteWithIdType}  from "../../database/mongodb/models/Site";
import axios, {AxiosError, AxiosResponse}          from "axios";
import cheerio                      from 'cheerio';
import { ReadSitemapSingleNodeResponse, ReadSitemapResponse, UrlNode }      from "../interface/SitemapInterface";
import { ScrapedData } from "../interface/VanityfairInterface";
import Article, { ArticleType } from "../../database/mongodb/models/Article";
import SitePublication, { SitePublicationArrayWithIdType, SitePublicationWithIdType } from "../../database/mongodb/models/SitePublication";

type ScrapeWebsiteFunction = (url: string) => Promise<ScrapedData | null>;

class BaseApi {

    constructor() {
        connectMongoDB();
    }

    public async getSitemapBySite(siteName:string):Promise<SiteArrayWithIdType> {        
        const results:SiteArrayWithIdType = await Site.find({ site: siteName });   
        return results;     
    }

    public async getSitePublication(sitePublicationName:string):Promise<SitePublicationWithIdType|null> {        
        const result:SitePublicationWithIdType|null = await SitePublication.findOne({ sitePublication: sitePublicationName });   
        return result;     
    }

    public async readFirstNodeSitemapFromUrl(url:string): Promise<ReadSitemapSingleNodeResponse> {
        try {
            const response = await axios.get(url);
            const xmlData = response.data;
        
            // Carica il documento XML utilizzando cheerio
            const node = cheerio.load(xmlData, { xmlMode: true });
        
            // Estrai il primo nodo 'sitemap'
            const firstSitemapNode = node('sitemap').first();
        
            // Puoi fare qualcosa con il nodo estratto
            const locValue = firstSitemapNode.find('loc').text();
            const lastmodValue = firstSitemapNode.find('lastmod').text();

            // Costruisci il risultato
            const result: ReadSitemapSingleNodeResponse = {
                success: true,
                data: {
                    loc: locValue,
                    lastmod: lastmodValue,
                    // Aggiungi altre proprietà se necessario
                }
            };
            return result;

        } catch (error) {            
            const errorMessage:string = (error as AxiosError).message || 'Errore sconosciuto';
            const result:ReadSitemapSingleNodeResponse = {
                success: false,
                error: `Errore nella richiesta per ${url}: ${errorMessage || error}`
            };
            return result;
        }        
    }

    public async readSitemapFromUrl(url:string): Promise<ReadSitemapResponse> {
        try {
            const response = await axios.get(url);
            const xmlData = response.data;
        
            // Carica il documento XML utilizzando cheerio
            const node = cheerio.load(xmlData, { xmlMode: true });
        
            // Estrai il primo nodo 'sitemap'
            const urlNodes = node('url');

            // Creo un array vuoto per contenere tutti i dati degli URL
            const urlData: UrlNode[] = [];
            
            // Itero su tutti gli elementi <url>
            urlNodes.each((index, element) => {
                const locValue = node(element).find('loc').text();
                const lastmodValue = node(element).find('lastmod').text();
                
                if(index <= 9 ) {
                    let urlNode:UrlNode = { loc: locValue, lastmod: lastmodValue }; 
                    urlData.push(urlNode);
                }
            });
            
            // Costruisco il risultato con l'array contenente tutti i dati degli URL
            const result: ReadSitemapResponse = {
                success: true,
                data: urlData
            };
            
            return result;

        } catch (error) {            
            const errorMessage:string = (error as AxiosError).message || 'Errore sconosciuto';
            const result:ReadSitemapResponse = {
                success: false,
                error: `Errore nella richiesta per ${url}: ${errorMessage || error}`
            };
            return result;
        }        
    }


    
    public async insertOriginalArticle(site:SiteWithIdType, sitePublication:SitePublicationWithIdType, sitemapDetail:ReadSitemapResponse, scrapeWebsite: ScrapeWebsiteFunction) {
        if (sitemapDetail.data) {     
            for (const urlNode of sitemapDetail.data) {
                const loc       = urlNode.loc;
                const lastmod   = urlNode.lastmod;
                const scrapedData:ScrapedData|null = await scrapeWebsite(loc); 
                                
                if( scrapedData 
                    && scrapedData.bodyContainerHTML !== undefined 
                    && scrapedData.metaTitle !== undefined 
                    && scrapedData.metaDescription !== undefined
                    && scrapedData.h1Content !== undefined
                ) {
                    const articleData:ArticleType = {
                        site:                   site._id,
                        sitePublication:        sitePublication._id,
                        url:                    urlNode.loc,
                        body:                   scrapedData?.bodyContainerHTML,
                        title:                  scrapedData?.metaTitle,
                        description:            scrapedData?.metaDescription,                        
                        h1:                     scrapedData?.h1Content,                 
                        genarateGpt:            0,
                        send:                   0,
                        categoryPublishSite:    site.categoryPublishSite,
                        userPublishSite:        site.userPublishSite,
                    };
                    
                    this.insertArticle(articleData);
                }
            }
        }
    }

    private async insertArticle(articleData: ArticleType) {
        try {
          // Crea una nuova istanza dell'articolo utilizzando i dati forniti
          const newArticle = new Article(articleData);
          
          // Salva l'articolo nel database
          const savedArticle = await newArticle.save();
          console.log('Articolo inserito con successo:', savedArticle);
        } catch (error) {
          console.error('Errore durante l\'inserimento dell\'articolo:', error);
        }
      }

    
    public isValidDataType<T>(data: T | null | undefined): data is T {
        return data !== null && data !== undefined && data !== false;
    }

}

export default BaseApi;