// mongo_utils/util.js
const User = require("../models/User");
const mongoose = require("mongoose");

async function getUserByEmail(email) {
  return await User.findOne({ email });
}

async function isEmailRegistered(email) {
  return await User.exists({ email });
}

async function createCollection(name) {
  const db = mongoose.connection.db;
  await db.createCollection(name);
  console.log(`✅ Created collection: ${name}`);
}

async function getCollection(name) {
    const db = mongoose.connection.db;
  
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
      await db.createCollection(name);
      console.log(`✅ Collection '${name}' created`);
    } else {
      console.log(`ℹ️  Collection '${name}' exists`);
    }
  
    return db.collection(name);
  }

  async function get_data(collection_name) {
    const db = mongoose.connection.db;
    const exists = await db.listCollections({ name: collection_name }).hasNext();
    if (!exists) {
      console.log(`collection "${collection_name}" not found`);
      return { data: [] };
    }
    const collection = db.collection(collection_name);
    const data = await collection.find({}).toArray();
    return { data };
  }
  
  async function update_collection(collection, id, updateFields) {
    try {
      const db = mongoose.connection.db;
      const coll = db.collection(collection);
  
      const result = await coll.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateFields }
      );
  
      return result;
    } catch (err) {
      console.error("Error updating collection:", err);
      throw err;
    }
  }
  
  
async function dropCollection(name) {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const exists = collections.some(c => c.name === name);

  if (!exists) {
    console.log(`⚠️ Collection '${name}' does not exist`);
    return;
  }

  await db.dropCollection(name);
  console.log(`🗑️ Dropped collection: ${name}`);
}

module.exports = {
  getUserByEmail,
  isEmailRegistered,
  createCollection,
  dropCollection,
  getCollection,
  get_data,
  update_collection
};
