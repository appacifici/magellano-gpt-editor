import mongoose from 'mongoose';
async function connectToDb() {
    try {
        await mongoose.connect('mongodb://localhost:27017/testdb', {});
        console.log('Connected to MongoDB');
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
connectToDb();
console.log('Connected to MongoDB');
