import { MongoClient } from "mongodb";
import { mongoUri } from "./config";

export const mongo: any = new MongoClient(mongoUri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

export let mongoFindOne: (
  db: string,
  collection: string,
  query: any
) => Promise<any>;
export let mongoUpdateOne: (
  db: string,
  collection: string,
  query: any,
  updateDocument: any
) => Promise<any>;

export let usersStatusCollection: any;

export const connectMongo = async () => {
  try {
    let connect = await mongo.connect();
    if (connect) {
      console.log("mongo connected");
      usersStatusCollection = mongo.db("users").collection("status");

      mongoFindOne = (db, collection, query) =>
        mongo.db(db).collection(collection).findOne(query);
      mongoUpdateOne = (db, collection, query, updateDocument) =>
        mongo.db(db).collection(collection).updateOne(query, updateDocument);
    }
  } catch (e) {
    throw e;
  }
};
