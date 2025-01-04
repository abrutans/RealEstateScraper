import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017"; // Replace with your actual MongoDB URI

export const getDatabase = async (dbName) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client.db(dbName);
};

export const saveToMongoDB = async (db, collectionName, data) => {
    const collection = db.collection(collectionName);
    await collection.insertMany(data);
    console.log('✅ Data saved to MongoDB');
};