import mongoose, { Document, Schema, Model, ObjectId } from 'mongoose';

type SiteType = {        
    site:               string;
    sitePublication:    string;
    url:                string;
    lastUrl?:           string;
    format:             string;
    lastmod?:           Date;   
    active:             number;   
    categoryPublishSite:Number;   
    userPublishSite:    Number;  
}

interface ISite extends Document, Omit<SiteType, '_id'> {}
type SiteWithIdType      = SiteType & { _id: Document['_id'] };
type SiteArrayWithIdType = SiteWithIdType[];
type SiteArrayType       = SiteType[];

const SiteSchema   = new Schema({
    site: { 
        type:       String, 
        required:   true 
    },    
    sitePublication: { 
        type: String, 
        required: true
    },
    url: { 
        type:       String, 
        required:   true, 
        maxlength:  500
    },    
    lastUrl: { 
        type:       String, 
        required:   false,
    },    
    lastMod: { 
        type:       Date, 
        required:   false,
    },    
    active: { 
        type:       Number, 
        required:   true, 
        min:        0, 
        max:        1 
    },
    format: { 
        type:       String, 
        required:   true,        
    },    
    categoryPublishSite: { 
        type:       Number, 
        required:   false        
    },    
    userPublishSite: { 
        type:       Number, 
        required:   false        
    } 
});

SiteSchema.index({ site: 1, url:1 }, { unique: true });
SiteSchema.index({ active: -1 });

const Site:Model<ISite> = mongoose.models.Site || mongoose.model('Site', SiteSchema);
export type {ISite,SiteType, SiteWithIdType, SiteArrayWithIdType, SiteArrayType};
export {SiteSchema};
export default Site;