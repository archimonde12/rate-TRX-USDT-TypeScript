import { ApolloServer } from "apollo-server";
import typeDefs from "./schema";
import resolvers from "./resolvers";
import { connectRedis } from "./redis";
import { connectMongo } from "./mongo";
import { routineUpdateNewRate } from "./saveNewRate";

const start = async () => {
  await connectRedis();
  await connectMongo();
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
  });
};

start();
