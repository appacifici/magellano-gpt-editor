import mongoose, { Model }                          from 'mongoose';
import connectMongoDB                               from '../database/mongodb/connect';
import {ISite, SiteSchema, SiteArrayType}           from '../database/mongodb/models/Site';
import {IArticle, ArticleSchema, ArticleArrayType}  from '../database/mongodb/models/Article';
import { SitePublicationSchema, ISitePublication, SitePublicationArrayType } from '../database/mongodb/models/SitePublication';

connectMongoDB();

const SitePublication:      Model<ISitePublication>        = mongoose.model<ISitePublication>('SitePublication', SitePublicationSchema);
const Site:      Model<ISite>        = mongoose.model<ISite>('Site', SiteSchema);
const Article:   Model<IArticle>     = mongoose.model<IArticle>('Article', ArticleSchema);

const sitePublicationToInsert:SitePublicationArrayType = [
    {   sitePublication:    'cronacalive.it', 
        tokenUrl:           'https://www.cronacalive.it/wp-json/jwt-auth/v1/token',
        url:                'https://www.cronacalive.it/wp-json/wp/v2/posts',
        username:           'Admin',  
        password:           'dUJ44cXYK5%DtCKBW8B%6xy(',  
        active:             1
    }
];

SitePublication.insertMany(sitePublicationToInsert)
.then((docs) => {
    console.log('SitePublication inserted successfully:', docs);
})
.catch((err) => {
    console.error('Error inserting SitePublication:', err);
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
    }
];

Site.insertMany(sitesToInsert)
.then((docs) => {
    console.log('Sites inserted successfully:', docs);
})
.catch((err) => {
    console.error('Error inserting Sites:', err);
});