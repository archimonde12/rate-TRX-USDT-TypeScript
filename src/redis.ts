import { createClient, RedisClient } from "redis";
import { promisify } from "util";
import { redisUri, redisPort, redisAuth } from "./config";

export let redis: RedisClient;
export let getKeys: (pattern: string) => Promise<string[]>;
export let getAsync: (key: string) => Promise<string | null>;
export let setAsync: (key: string, val: string) => Promise<any>;
export let delAsync: (keys: string[]) => Promise<any>;
export let incrAsync: (keys: string) => Promise<any>;

const retry_delay = 1000;

export const connectRedis = async () =>
  new Promise((resolve, reject) => {
    redis = createClient({
      host: redisUri,
      port: redisPort,
      no_ready_check: true,
    });

    // redis.auth(redisAuth, function (err, response) {
    //   if (err) {
    //     console.log("auth:", err);
    //   }
    // });

    redis.on("connect", () => {
      console.log("redis connected");

      getKeys = promisify(redis.keys).bind(redis);
      getAsync = promisify(redis.get).bind(redis);
      setAsync = promisify(redis.set).bind(redis);
      delAsync = promisify(redis.del).bind(redis);
      incrAsync = promisify(redis.incr).bind(redis);

      resolve();
    });

    redis.on("error", function (error) {
      console.error(error);

      console.log("redis not connected");

      redis.end(true);

      console.log(`retry connecting redis in 1s ...`);

      setTimeout(() => {
        redis = createClient({
          url: redisUri,
          no_ready_check: true,
        });
      }, retry_delay);
    });
  });
