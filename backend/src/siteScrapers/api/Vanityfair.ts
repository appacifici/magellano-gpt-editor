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


class Vanityfair extends BaseApi {
    constructor(action:string) {
        super();        
        switch( action ) {
            case 'readSitemap':
                this.read();
            break;            
        }
    }

    private async read() {
        const results:SiteArrayWithIdType = await this.getSitemapBySite('vanityfair.it');        
        results.forEach(async (result:SiteWithIdType) => {
            const url = result.url;          
            const sitemap:ReadSitemapSingleNodeResponse = await this.readFirstNodeSitemapFromUrl(url);              
            if( sitemap.success === true ) {    
                 
                let loc:string          = '';
                let date: Date | null   = null;
                date = new Date();

                if (sitemap.data != undefined) {
                    date = new Date(sitemap.data.lastmod);
                    loc  = sitemap.data.loc;
                }

                const updateData = {
                    lastMod: new Date(date),
                    lastUrl: loc,
                    active: 1,
                };

                Site.updateOne({ url: url }, { $set: updateData })
                .then((result) => {
                    console.log('Record aggiornato con successo:', result);
                })
                .catch((error) => {
                    console.error('Errore nell\'aggiornamento del record:', error)
                });                
                
                const sitemapDetail:ReadSitemapResponse = await this.readSitemapFromUrl(loc);                
                if (sitemapDetail.data) {           
                    this.insertOriginalArticle(result, sitemapDetail, this.scrapeWebsite);
                    
                    for (const urlNode of sitemapDetail.data) {
                        const loc       = urlNode.loc;
                        const lastmod   = urlNode.lastmod;
                                        
                     
                        // if( scrapedData !== null ) {                                              
                        //     const article = chatGptApi.processArticle(scrapedData);
                            

                        //     // const title = chatGptApi.processTitle(scrapedData);
                        //     // console.log(title);
                        // }
                    }
                }
                //Per ogni news invocare il servizio di chatgpt generare il testo 
                //Salvare il testo generato nel db
                //Inviare il testo all'api di wp
            }            
        });        
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
            // Gestisci eventuali errori di richiesta HTTP o analisi HTML
            console.error('Errore durante lo scraping della pagina:', error);
            return null;
        }
    }
}

export default Vanityfair;