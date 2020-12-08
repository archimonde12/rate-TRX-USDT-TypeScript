import { ApolloServer } from "apollo-server";
import typeDefs from "./schema";
import resolvers from "./resolvers";
import { connectRedis } from "./redis";
import { connectLocalRedis } from "./localRedis";
import { connectMongo } from "./mongo";
import { routineUpdateNewRate } from "./saveNewRate";
import { scanAllCountKeys, scanAllCountKeysEvery } from "./scanAllCountKeys";
export let test = 0;

const start = async () => {
  await connectRedis();
  await connectMongo();
  await connectLocalRedis();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: (req) => ({
      ...req,
    }),
  });

  server.listen().then(({ url }) => {
    console.log(`
            Server is running!
            Listening on ${url}
            Explore at https://studio.apollographql.com/dev
          `);
    routineUpdateNewRate();
    scanAllCountKeysEvery(200);
  });
};

start();
