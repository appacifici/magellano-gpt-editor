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


class GalleriaBorghese extends BaseApi {
    action:string;

    constructor(action:string) {
        super();        
        this.action = action;
        this.init();
    }

    async init() {
        switch (this.action) {
            case 'readSitemap':                
                await this.readSimpleSitemap('galleriaborghese.it', this.scrapeWebsite);           
                
                break;                
            default:
                // Logica per altre azioni
                break;
        }
    }

    private async scrapeWebsite(url: string): Promise<ScrapedData | null> {
        try {
            // Effettua la richiesta HTTP per ottenere il contenuto della pagina
            const response          = await axios.get(url);
            const cheerioLoad       = cheerio.load(response.data);    
            const bodyContainerHTML = cheerioLoad('div.inside-article').html() || '';    
            const h1Content         = cheerioLoad('h1').text() || '';    
            const metaTitle         = cheerioLoad('title').text();
            const metaDescription   = cheerioLoad('meta[name="description"]').attr('content');
            const img               = cheerioLoad('img[class*="wp-image"]').first().attr('src');
    
            return {
                bodyContainerHTML: bodyContainerHTML,
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
}

export default GalleriaBorghese;