import axios                                    from "axios";
import { Command }                              from 'commander';
import {  ObjectId }                            from 'mongoose';
import cheerio                                  from 'cheerio';

import Site, {SiteArrayWithIdType, SiteWithIdType}              from "../../database/mongodb/models/Site";
import BaseApi                                  from "./BaseApi";
import { ReadSitemapSingleNodeResponse,
         ReadSitemapResponse }                  from "../interface/SitemapInterface";
import { ScrapedData }                          from "../interface/ScrapedInterface";
import chatGptApi    from "../../services/ChatGptApi";
import { SitePublicationArrayWithIdType, SitePublicationWithIdType } from "../../database/mongodb/models/SitePublication";
import { writeErrorLog } from "../../services/Log";


class DinamycScraper extends BaseApi {
    action:     string;
    siteName:   string;

    constructor(action:string, siteName:string) {
        super();        
        this.action     = action;
        this.siteName   = siteName;
        this.init();
    }

    async init() {
        switch (this.action) {
            case 'readSitemap':                
                await this.readSimpleSitemap(this.siteName, this.scrapeWebsite);                           
            break;     
            case 'readGzSitemap':                                            
                await this.readFromListSitemap(this.siteName, this.scrapeWebsite, this.readGzSitemap);                                    
            break;
            default:
                // Logica per altre azioni
                break;
        }
    }

    private async scrapeWebsite(url: string, selectorBody:string, selectorImg:string): Promise<ScrapedData | null> {
        try {
            // Effettua la richiesta HTTP per ottenere il contenuto della pagina
            const response          = await axios.get(url);
            const cheerioLoad       = cheerio.load(response.data);                
            const h1Content         = cheerioLoad('h1').text() || '';    
            const metaTitle         = cheerioLoad('title').text();
            const metaDescription   = cheerioLoad('meta[name="description"]').attr('content');
            const bodyContainerHTML = eval(selectorBody);
            const img               = eval(selectorImg);
    
            if( bodyContainerHTML == '' ) {
                console.log('Body vuoto controllare selettore');                
            }
            if( img == '' ) {
                console.log('img vuoto controllare selettore');
            }

            return {
                bodyContainerHTML: removeHtmlTags(bodyContainerHTML),
                h1Content: h1Content,
                metaTitle: metaTitle,
                metaDescription: metaDescription,
                img: img,
            };
        } catch (error:any) {
            await writeErrorLog(`scrapeWebsite: galleriaborghese: Errore durante lo scraping della pagina`);
            await writeErrorLog(error);
            console.error('scrapeWebsite: galleriaborghese: Errore durante lo scraping della pagina:', error);
            return null;
        }
    }

    public sleep(ms:any) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

function removeHtmlTags(htmlString:string) {
    // Carica la stringa HTML utilizzando cheerio
    const $ = cheerio.load(htmlString);
    
    // Trova tutti i tag HTML e rimuovili
    $('*').each((index: any, element: any) => {
      $(element).replaceWith($(element).text().trim());
    });
    
    // Ritorna la stringa senza tag HTML
    return $.text().trim();
  }

export default DinamycScraper;