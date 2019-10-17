const { ReplSet } = require('mongodb-topology-manager');
const mongoose = require('mongoose');

// If you're not familiar with async/await, check out this article:
// http://bit.ly/node-async-await
run().catch(error => console.error(error));

async function run() {
  // Make sure you're using mongoose >= 5.0.0
  console.log(new Date(), `mongoose version: ${mongoose.version}`);

  await setupReplicaSet();

  // Connect to the replica set
  const uri = 'mongodb://localhost:31000,localhost:31001,localhost:31002/' +
    'test?replicaSet=rs0';
  await mongoose.connect(uri);
  // For this example, need to explicitly create a collection, otherwise
  // you get "MongoError: cannot open $changeStream for non-existent database: test"
  await mongoose.connection.createCollection('Person');

  // Create a new mongoose model
  const personSchema = new mongoose.Schema({
    name: String
  });
  const Person = mongoose.model('Person', personSchema, 'Person');

  // Create a change stream. The 'change' event gets emitted when there's a
  // change in the database
  Person.watch().
    on('change', data => console.log("data", new Date(), data));

  // Insert a doc, will trigger the change stream handler above
  console.log(new Date(), 'Inserting doc');
  await Person.create({ name: 'Axl Rose' });
  console.log(new Date(), 'Inserted doc');
}

// Boilerplate to start a new replica set. You can skip this if you already
// have a replica set running locally or in MongoDB Atlas.
async function setupReplicaSet() {
  const bind_ip = 'localhost';
  // Starts a 3-node replica set on ports 31000, 31001, 31002, replica set
  // name is "rs0".
  const replSet = new ReplSet('mongod', [
    { options: { port: 31000, dbpath: `${__dirname}/data/db/31000`, bind_ip } },
    { options: { port: 31001, dbpath: `${__dirname}/data/db/31001`, bind_ip } },
    { options: { port: 31002, dbpath: `${__dirname}/data/db/31002`, bind_ip } }
  ], { replSet: 'rs0' });

  // Initialize the replica set
  await replSet.purge();
  await replSet.start();
  console.log(new Date(), 'Replica set started...');
}
