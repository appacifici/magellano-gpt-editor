import axios                                    from "axios";
import { Command }                              from 'commander';
import {  ObjectId }                            from 'mongoose';
import cheerio                                  from 'cheerio';

import Site, {SiteArrayWithIdType, SiteWithIdType}              from "../../database/mongodb/models/Site";
import BaseApi                                  from "./BaseApi";
import { ReadSitemapSingleNodeResponse,
         ReadSitemapResponse }                  from "../interface/SitemapInterface";
import { ScrapedData }                          from "../interface/VanityfairInterface";
import chatGptApi    from "../../services/ChatGptApi";
import { SitePublicationArrayWithIdType, SitePublicationWithIdType } from "../../database/mongodb/models/SitePublication";
import { writeErrorLog } from "../../services/Log";


class Vanityfair extends BaseApi {
    constructor(action:string) {
        super();        
        switch( action ) {
            case 'readSitemap':
                this.readFromListSitemap('vanityfair.it', this.scrapeWebsite);
                process.exit(1);
            break;            
        }
    }

    private async scrapeWebsite(url: string): Promise<ScrapedData | null> {
        try {
            // Effettua la richiesta HTTP per ottenere il contenuto della pagina
            const response          = await axios.get(url);
            const cheerioLoad       = cheerio.load(response.data);    
            const bodyContainerHTML = cheerioLoad('.body__container').html() || '';    
            const h1Content         = cheerioLoad('h1').text() || '';    
            const metaTitle         = cheerioLoad('title').text();
            const metaDescription   = cheerioLoad('meta[name="description"]').attr('content');
    
            return {
                bodyContainerHTML: bodyContainerHTML,
                h1Content: h1Content,
                metaTitle: metaTitle,
                metaDescription: metaDescription
            };
        } catch (error) {
            await writeErrorLog(`Vanityfair.it: Errore durante lo scraping della pagina ${error}`);
            console.error('Vanityfair.it: Errore durante lo scraping della pagina:', error);
            return null;
        }
    }
}

export default Vanityfair;