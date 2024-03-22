import mongoose, { Document, Schema, Model, ObjectId } from 'mongoose';

type AlertType = {
    processName:        string;
    process:            string;
    childProcess?:      string | null;
    alert:              string;
    debug:              string;
    error:              string;
    general:            string;
    callData:           string;
    callResponse:       string;
    createdAt?:         Date;
    updatedAt?:         Date;
}

interface IAlert extends Document, Omit<AlertType, '_id'> {}
type AlertWithIdType      = AlertType & { _id: Document['_id'] };
type AlertArrayWithIdType = AlertWithIdType[];
type AlertArrayType       = AlertType[];

const AlertSchema = new mongoose.Schema({
    processName: { 
        type:       String, 
        required:   true, 
        maxlength:  255 
    },
    process: { 
        type:       String, 
        required:   true, 
        maxlength:  255 
    },
    childProcess: { 
        type:       String, 
        maxlength:  255, 
        default:    null 
    },
    alert: { 
        type:       String, 
        required:   true 
    },
    debug: { 
        type:       String, 
        required:   true 
    },
    error: { 
        type:       String, 
        required:   true 
    },
    general: { 
        type:       String, 
        required:   true 
    },
    callData: { 
        type:       String, 
        required:   true 
    },
    callResponse: { 
        type:       String, 
        required:   true 
    },
    createdAt: { 
        type:       Date, 
        default:    Date.now 
    },
    updatedAt: { 
        type:       Date, 
        default:    Date.now 
    }
});

// Middleware che aggiorna automaticamente il campo updatedAt prima di salvare
AlertSchema.pre('save', function(next:any) {
    // this.updatedAt = Date.now();
    // next();     
});

const Alert:Model<IAlert> = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
export type {IAlert,AlertType, AlertWithIdType, AlertArrayWithIdType, AlertArrayType};
export {AlertSchema};
export default Alert;
