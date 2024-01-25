import mongoose, { Model }                          from 'mongoose';
import connectMongoDB                               from '../database/mongodb/connect';
import {ISite, SiteSchema, SiteArrayType}           from '../database/mongodb/models/Site';
import {IArticle, ArticleSchema, ArticleArrayType}  from '../database/mongodb/models/Article';

connectMongoDB();

const Site:      Model<ISite>        = mongoose.model<ISite>('Site', SiteSchema);
const Article:   Model<IArticle>     = mongoose.model<IArticle>('Article', ArticleSchema);

const sitesToInsert:SiteArrayType = [
    { site: 'vanityfair.it', url: 'https://www.vanityfair.it/sitemap.xml',active:1, format: 'sitemap'  }
];

Site.insertMany(sitesToInsert)
.then((docs) => {
    console.log('Sites inserted successfully:', docs);
})
.catch((err) => {
    console.error('Error inserting Sites:', err);
});