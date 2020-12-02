import { MongoClient } from "mongodb";
import { mongoUri } from "./config";

export const mongo: any = new MongoClient(mongoUri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

export let usersStatusCollection: any;

export const connectMongo = async () => {
  try {
    let connect = await mongo.connect();
    if (connect) {
      console.log("mongo connected");
      usersStatusCollection = mongo.db("users").collection("status");
    }
  } catch (e) {
    throw e;
  }
};
