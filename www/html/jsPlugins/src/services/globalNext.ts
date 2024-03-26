import mongoose                 		from 'mongoose';

const connectMongoDB = async () => {	
    try {        
        
        await mongoose.connect(`mongodb://${process.env.NEXT_PUBLIC_MONGO_DB_HOST}:27017/newsgpt`, {
            
        });
        console.log(`Mongoose connected to MongoDB: mongodb://${process.env.NEXT_PUBLIC_MONGO_DB_HOST}:27017/newsgpt` );
    } catch (err) {
        console.error('Error connecting to MongoDB');        
        process.exit(1);
    }
};

export {connectMongoDB};