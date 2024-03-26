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
import { writeErrorLog } from "../../services/Log/Log";


class RomaToday extends BaseApi {
    action:string;

    constructor(action:string) {
        super();        
        this.action = action;
        this.init();
    }

    async init() {
        switch (this.action) {
            case 'readGzSitemap':                                
            console.log('eccomi');
                await this.readFromListSitemap('romatoday.it', this.scrapeWebsite, this.readGzSitemap);                                    
                break;
            default:
                // Logica per altre azioni
                break;
        }
    }

    private async scrapeWebsite(url: string): Promise<ScrapedData | null> {
        try {
            
            // Effettua la richiesta HTTP per ottenere il contenuto della pagina
            console.log('========>'+url);
            const response          = await axios.get(url);
            const cheerioLoad       = cheerio.load(response.data);    
            const bodyContainerHTML = cheerioLoad('.l-entry__body').html() || '.';    
            const h1Content         = cheerioLoad('h1').text() || '';    
            const metaTitle         = cheerioLoad('title').text();
            const metaDescription   = cheerioLoad('meta[name="description"]').attr('content');
            const img               = cheerioLoad('img.u-size-responsive-view').first().attr('src');
    
            return {
                bodyContainerHTML: removeHtmlTags(bodyContainerHTML),
                h1Content: h1Content,
                metaTitle: metaTitle,
                metaDescription: metaDescription,
                img: img
            };
        } catch (error:any) {
            await writeErrorLog(`scrapeWebsite: RomaToday.it: Errore durante lo scraping della pagina`);
            await writeErrorLog(error);
            console.error('scrapeWebsite: RomaToday.it: Errore durante lo scraping della pagina:', error);
            return null;
        }
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
  
export default RomaToday;