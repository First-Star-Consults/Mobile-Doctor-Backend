import { MongoClient } from 'mongodb';

MongoClient.connect('mongodb+srv://firststarconsults01:mobiledoctor$1@cluster0.rl4rlvq.mongodb.net', async (err, client) => {
  if (err) {
    console.error(err);
    return;
  }
  const db = client.db();
  const collection = db.collection('users');

  await collection.createIndex({ location: '2dsphere' });
  console.log('Geospatial index created!');
});