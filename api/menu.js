const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedDb = client.db('renison_cafeteria'); // Database name
    return cachedDb;
}

export default async function handler(req, res) {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('menus');

        if (req.method === 'GET') {
            const doc = await collection.findOne({ _id: 'current_menu' });
            return res.status(200).json(doc ? doc.menuData : {});
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            await collection.updateOne(
                { _id: 'current_menu' },
                { $set: { menuData: body.menuData } },
                { upsert: true }
            );
            return res.status(200).json({ success: true });
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end('Method Not Allowed');
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message });
    }
}
