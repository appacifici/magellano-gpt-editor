import mongoose, { Document, Schema, Model, ObjectId } from 'mongoose';

type SitePublicationType = {        
    sitePublication:    string;
    tokenUrl:           string;
    url:                string;
    urlImages:          string;
    username:           string;
    password:           string; 
    active:             number;   
    page:               number;   
}

interface ISitePublication extends Document, Omit<SitePublicationType, '_id'> {}
type SitePublicationWithIdType      = SitePublicationType & { _id: Document['_id'] };
type SitePublicationArrayWithIdType = SitePublicationWithIdType[];
type SitePublicationArrayType       = SitePublicationType[];

const SitePublicationSchema   = new Schema({
    sitePublication: { 
        type:       String, 
        required:   true 
    },    
    page: {
        type:       Number,
        required:   true
    },
    tokenUrl: { 
        type:       String, 
        required:   true, 
        maxlength:  500
    },    
    url: { 
        type:       String, 
        required:   true, 
        maxlength:  500
    },    
    urlImages: { 
        type:       String, 
        required:   true, 
        maxlength:  500
    },    
    username: { 
        type:       String, 
        required:   false,
    },    
    password: { 
        type:       String, 
        required:   false,
    },          
    active: { 
        type:       Number, 
        required:   true, 
        min:        0, 
        max:        1 
    }    
});

SitePublicationSchema.index({ site: 1, url:1 }, { unique: true });
SitePublicationSchema.index({ active: -1 });

const SitePublication:Model<ISitePublication> = mongoose.models.SitePublication || mongoose.model('SitePublication', SitePublicationSchema);
export type {ISitePublication,SitePublicationType, SitePublicationWithIdType, SitePublicationArrayWithIdType, SitePublicationArrayType};
export {SitePublicationSchema};
export default SitePublication;