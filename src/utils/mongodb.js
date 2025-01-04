import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017"; // Replace with your actual MongoDB URI, e.g., "mongodb+srv://username:password@cluster0.mongodb.net/test?retryWrites=true&w=majority"

export const getDatabase = async (dbName) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        return { db: client.db(dbName), client };
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB', error);
        throw error;
    }
};

export const saveToMongoDB = async (client, db, collectionName, data) => {
    try {
        const collection = db.collection(collectionName);
        await collection.insertMany(data);
        console.log('✅ Data saved to MongoDB');
        } finally {
            await client.close();
        }
    };
