import { VariableNode } from "graphql";
import { createClient, RedisClient } from "redis";
import { promisify } from "util";
import { redisLocalPort, redisLocalUri } from "./config";

export let localRedis: RedisClient;
export let getKeysLocal: (pattern: string) => Promise<string[]>;
export let getAsyncLocal: (key: string) => Promise<string | null>;
export let setAsyncLocal: (key: string, val: string) => Promise<any>;
export let setExpireAsyncLocal: (
  key: string,
  seconds: number,
  val: string
) => Promise<any>;

export let existAsyncLocal: (key: string) => Promise<any>;
const retry_delay = 1000;

export const connectLocalRedis = async () =>
  new Promise<void>((resolve, reject) => {
    localRedis = createClient({
      host: redisLocalUri,
      port: redisLocalPort,
      no_ready_check: true,
    });

    localRedis.on("connect", () => {
      console.log("localRedis connected");

      getKeysLocal = promisify(localRedis.keys).bind(localRedis);
      getAsyncLocal = promisify(localRedis.get).bind(localRedis);
      setAsyncLocal = promisify(localRedis.set).bind(localRedis);
      setExpireAsyncLocal = promisify(localRedis.setex).bind(localRedis);
      existAsyncLocal = promisify(localRedis.exists).bind(localRedis);
      resolve();
    });

    localRedis.on("error", function (error) {
      console.error(error);

      console.log("localRedis not connected");

      localRedis.end(true);

      console.log(`retry connecting localRedis in 1s ...`);

      setTimeout(() => {
        localRedis = createClient({
          url: redisLocalUri,
          no_ready_check: true,
        });
      }, retry_delay);
    });
  });
