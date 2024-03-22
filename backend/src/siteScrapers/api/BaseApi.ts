import connectMongoDB from "../../database/mongodb/connect";
import Site, { SiteArrayWithIdType, SiteWithIdType } from "../../database/mongodb/models/Site";
import axios, { AxiosError, AxiosResponse } from "axios";
import cheerio from 'cheerio';
import * as fs                              from 'fs';
import { ReadSitemapSingleNodeResponse, ReadSitemapResponse, UrlNode } from "../interface/SitemapInterface";
import { ScrapedData } from "../interface/ScrapedInterface";
import Article, { ArticleType, ArticleWithIdType } from "../../database/mongodb/models/Article";
import SitePublication, { SitePublicationArrayWithIdType, SitePublicationWithIdType } from "../../database/mongodb/models/SitePublication";
import { writeErrorLog } from "../../services/Log";
import { download, extractGzip, readFileToServer } from "../../services/File";

type ScrapeWebsiteFunction  = (url: string,selectorBody:string, selectorImg:string) => Promise<ScrapedData | null>;
type ReadSitemapFunction    = (url: string) => Promise<ReadSitemapResponse|null>;


class BaseApi {

    constructor() {
        connectMongoDB();
    }

    public async getSitemapBySite(siteName: string): Promise<SiteArrayWithIdType> {
        const results: SiteArrayWithIdType = await Site.find({ site: siteName });
        return results;
    }

    public async getSitePublication(sitePublicationName: string): Promise<SitePublicationWithIdType | null> {
        const result: SitePublicationWithIdType | null = await SitePublication.findOne({ sitePublication: sitePublicationName });
        return result;
    }

    public async getArticleByUrl(url: string): Promise<ArticleWithIdType | null> {
        const result: ArticleWithIdType | null = await Article.findOne({ url: url });
        return result;
    }

    protected async readFromListSitemap(siteName: string, scrapeWebsite: ScrapeWebsiteFunction, readSitemapFunction:ReadSitemapFunction) {        
        const results: SiteArrayWithIdType = await this.getSitemapBySite(siteName);
        
        // Inizializza un array per raccogliere le promesse
        const promises = [];
    
        for (const result of results) {
            // Aggiungi una promessa all'array senza utilizzare 'await' qui
            promises.push((async () => {
                const sitePublication: SitePublicationWithIdType | null = await this.getSitePublication(result.sitePublication);
    
                const url = result.url;
                const sitemap: ReadSitemapSingleNodeResponse = await this.readFirstNodeSitemapFromUrl(url);
    
                if (sitemap.success === true && sitePublication !== null) {
                    let loc: string = '';
                    let date: Date | null = null;
                    date = new Date();
    
                    console.log(sitemap.data);
                    if (sitemap.data != undefined) {
                        date = sitemap.data.lastmod != '' ? new Date(sitemap.data.lastmod) : date;
                        loc = sitemap.data.loc;
                    }
    
                    const updateData = {
                        lastMod: date,
                        lastUrl: loc,
                        active: 1,
                    };
                    
    
                    await Site.updateOne({ url: url }, { $set: updateData });
    
                    const sitemapDetail: ReadSitemapResponse|null = await readSitemapFunction(loc);
                    if (sitemapDetail != null && sitemapDetail.data) {
                        // Logica per inserire l'articolo originale
                        await this.insertOriginalArticle(result, sitePublication, sitemapDetail, scrapeWebsite);
                    }
                }
            })());
        }
    
        // Attendi il completamento di tutte le promesse
        await Promise.all(promises);
    
        console.log("Tutte le operazioni asincrone sono state completate.");
        process.exit(5);
    }

    /**
     * Legge una classica sitemap di url
     */
    protected async readSimpleSitemap(siteName: string, scrapeWebsite: ScrapeWebsiteFunction) {
        const results: SiteArrayWithIdType = await this.getSitemapBySite(siteName);

        const promises = results.map(async (result: SiteWithIdType) => {
            const sitePublication: SitePublicationWithIdType | null = await this.getSitePublication(result.sitePublication);
            const url = result.url;
            const sitemapDetail: ReadSitemapResponse|null = await this.readSitemapFromUrl(url);

            console.log(sitemapDetail);
            if (sitemapDetail != null && sitemapDetail.data && sitePublication !== null) {
                await this.insertOriginalArticle(result, sitePublication, sitemapDetail, scrapeWebsite);
            }
        });

        await Promise.all(promises); // Attendere il completamento di tutte le operazioni asincrone

        process.exit(5); // Uscire dopo il completamento di tutte le operazioni
    }


    //Prende solo il primo nodo di una sitemap
    private async readFirstNodeSitemapFromUrl(url: string): Promise<ReadSitemapSingleNodeResponse> {
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
            const errorMessage: string = (error as AxiosError).message || 'Errore sconosciuto';
            const result: ReadSitemapSingleNodeResponse = {
                success: false,
                error: `Errore nella richiesta per ${url}: ${errorMessage || error}`
            };
            await writeErrorLog(`Errore nella richiesta per ${url}`);
            await writeErrorLog(errorMessage || error);
            return result;
        }
    }

    //Prende n elementi di una sitemap
    protected async readSitemapFromUrl(url: string): Promise<ReadSitemapResponse|null> {
        try {
            const response = await axios.get(url);
            const xmlData = response.data;

            return BaseApi.readSitemapXML(xmlData);

        } catch (error) {
            const errorMessage: string = (error as AxiosError).message || 'Errore sconosciuto';
            const result: ReadSitemapResponse = {
                success: false,
                error: `readSitemapFromUrl: Errore nella richiesta per ${url}: ${errorMessage || error}`
            };
            await writeErrorLog(`readSitemapFromUrl: Errore nella richiesta per ${url}`);
            await writeErrorLog(errorMessage || error);
            return result;
        }
    }

    static async readSitemapXML(xmlData: string): Promise<ReadSitemapResponse|null> {
        try {
            
            // Carica il documento XML utilizzando cheerio
            const node = cheerio.load(xmlData, { xmlMode: true });

            // Estrai il primo nodo 'sitemap'
            const urlNodes = node('url');

            // Creo un array vuoto per contenere tutti i dati degli URL
            const urlData: UrlNode[] = [];

            // Itero su tutti gli elementi <url>
            urlNodes.each((index, element) => {
                const locValue = node(element).find('loc').text();
                let lastmodValue = node(element).find('lastmod').text();                
                if( lastmodValue == '' ) {
                    lastmodValue = node(element).find('news\\:publication_date').text()
                }

                if (index <= 9) {
                    let urlNode: UrlNode = { loc: locValue, lastmod: lastmodValue };
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
            await writeErrorLog(`readSitemapXML: Errore lettura xml`);
            await writeErrorLog( error);      
            return null;      
        }
    }

    /**
     * Legge una sitemap in formato .gz url
     */
    protected async readGzSitemap(url: string): Promise<ReadSitemapResponse|null> {
        console.log(url);

        const min:number       = 1;
        const max:number       = 100;
        const random:number    = Math.floor(Math.random() * (max - min + 1)) + min;
        const pathSave:string  = `${process.env.PATH_DOWNALOAD}${random}.gz`;
        const pathXml:string   = pathSave.replace('.gz','.xml');
        await download(url, pathSave);    
        await extractGzip(pathSave, pathXml);    
        const dataXML = await readFileToServer(pathXml);


        const dataXml:ReadSitemapResponse|null   = await BaseApi.readSitemapXML(dataXML);        
        return dataXml;        
    }

    public async insertOriginalArticle(site: SiteWithIdType, sitePublication: SitePublicationWithIdType, sitemapDetail: ReadSitemapResponse, scrapeWebsite: ScrapeWebsiteFunction) {        

        if (sitemapDetail.data) {            
            for (const urlNode of sitemapDetail.data) {                
                const existArticle = await this.getArticleByUrl(urlNode.loc);
                if (existArticle === null) {
                    const loc = urlNode.loc;
                    const lastmod = urlNode.lastmod;
                    const scrapedData: ScrapedData | null = await scrapeWebsite(loc, site.selectorBody, site.selectorImg);
                

                    if (scrapedData
                        && scrapedData.bodyContainerHTML !== undefined
                        && scrapedData.metaTitle !== undefined
                        && scrapedData.metaDescription !== undefined
                        && scrapedData.h1Content !== undefined
                        && scrapedData.img !== undefined
                    ) {
                        
                        const articleData: ArticleType = {
                            site:                   site._id,
                            sitePublication:        sitePublication._id,
                            url:                    urlNode.loc,
                            body:                   scrapedData?.bodyContainerHTML,
                            title:                  scrapedData?.metaTitle,
                            description:            scrapedData?.metaDescription,
                            h1:                     scrapedData?.h1Content,
                            img:                    scrapedData?.img,
                            genarateGpt:            0,
                            send:                   0,
                            lastMod:                new Date(urlNode.lastmod),
                            publishDate:            new Date(),
                            categoryPublishSite:    site.categoryPublishSite,
                            userPublishSite:        site.userPublishSite,
                        };

                        this.insertArticle(articleData);
                    }
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
            await writeErrorLog(`Errore durante l\'inserimento dell\'articolo`);
            await writeErrorLog(error);
            console.error('Errore durante l\'inserimento dell\'articolo:', error);
        }
    }


    public isValidDataType<T>(data: T | null | undefined): data is T {
        return data !== null && data !== undefined && data !== false;
    }

}

export default BaseApi;