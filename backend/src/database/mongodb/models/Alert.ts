import mongoose, { Document, Schema, Model, ObjectId } from 'mongoose';

type AlertType = {
    processName?:        string | null;
    process?:            string | null;
    childProcess?:       string | null;
    alert?:              string | null;
    debug?:              string | null;
    error?:              string | null;
    general?:            string | null;
    callData?:           string | null;
    callResponse?:       string | null;
    createdAt?:          Date | null;
    updatedAt?:          Date | null;
}

interface IAlert extends Document, Omit<AlertType, '_id'> {}
type AlertWithIdType      = AlertType & { _id: Document['_id'] };
type AlertArrayWithIdType = AlertWithIdType[];
type AlertArrayType       = AlertType[];

const AlertSchema = new mongoose.Schema({
    processName: { 
        type:       String, 
        required:   false, 
        default:    null,
        maxlength:  255 
    },
    process: { 
        type:       String, 
        required:   false, 
        default:    null,
        maxlength:  255 
    },
    childProcess: { 
        type:       String, 
        maxlength:  255, 
        default:    null,
        required:   false, 
    },
    alert: { 
        type:       String, 
        default:    null,
        required:   false, 
    },
    debug: { 
        type:       String, 
        default:    null,
        required:   false, 
    },
    error: { 
        type:       String, 
        default:    null,
        required:   false, 
    },
    general: { 
        type:       String, 
        default:    null,
        required:   false, 
    },
    callData: { 
        type:       String, 
        default:    null,
        required:   false, 
    },
    callResponse: { 
        type:       String, 
        default:    null,
        required:   false, 
    },
    createdAt: { 
        type:       Date, 
        default:    Date.now,
        required:   false, 
    },
    updatedAt: { 
        type:       Date, 
        default:    Date.now,
        required:   false, 
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
