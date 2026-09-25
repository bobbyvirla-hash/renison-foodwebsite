const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedDb = client.db('renison_cafeteria'); // Database name
    return cachedDb;
}

exports.handler = async (event, context) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('menus');

        if (event.httpMethod === 'GET') {
            const doc = await collection.findOne({ _id: 'current_menu' });
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doc ? doc.menuData : {})
            };
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            await collection.updateOne(
                { _id: 'current_menu' },
                { $set: { menuData: body.menuData } },
                { upsert: true }
            );
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: true })
            };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };
    } catch (error) {
        console.error('Database error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
