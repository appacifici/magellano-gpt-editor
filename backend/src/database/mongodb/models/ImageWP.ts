import mongoose, { Document, Schema, Model, ObjectId } from 'mongoose';

type ImageType = {        
    sitePublication:    Schema.Types.ObjectId;
    imageID:            Number;
    imageLink:          string;
    imageTitle:         string;
    imageURL:           string;
    imageAltText:       string;
     
}

interface IImage extends Document, Omit<ImageType, '_id'> {}
type ImageWithIdType      = ImageType & { _id: Document['_id'] };
type ImageArrayWithIdType = ImageWithIdType[];
type ImageArrayType       = ImageType[];

const ImageWPSchema = new Schema({
    sitePublication: { 
        type: Schema.Types.ObjectId, 
        ref: 'SitePublication',
        required: true
    },
    imageID: {
      type: Number,
      required: true
    },
    imageLink: {
      type: String,
      required: true
    },
    imageTitle: {
      type: String,
      required: true
    },
    imageURL: {
      type: String,
      required: true
    },
    imageAltText: {
      type: String,
      default: ''
    }    
});

ImageWPSchema.index({ imageLink: 1, imageID:1 }, { unique: true });


const ImageWP:Model<IImage> = mongoose.models.Image || mongoose.model('ImageWP', ImageWPSchema);
export type {IImage,ImageType, ImageWithIdType, ImageArrayWithIdType, ImageArrayType};
export {ImageWPSchema};
export default ImageWP;