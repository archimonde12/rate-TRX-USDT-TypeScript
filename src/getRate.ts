import {
  key,
  fakeUserAPI,
  checkTimeLimit,
  countLimit,
  appName,
} from "./config";
import {
  getAsync,
  incrAsync,
  expireAsync,
  ttlAsync,
  decrAsync,
  setAsync,
  delAsync,
  setExpireAsync,
  redis,
} from "./redis";
import { existAsyncLocal, setExpireAsyncLocal } from "./localRedis";
import { checkTimeFunc } from "./util";
import { checkFlag, checkLocalFlag } from "./checkFlag";
import { allKeysCache } from "./scanAllCountKeys";

const limitApiCall = async () => {
  try {
    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    const statusKey: string = `${appName}.${fakeUserAPI}.status`;
    const getCountRes = await incrAsync(countKey);
    const currentCount = Number(getCountRes);
    if (currentCount === 1) {
      redis
        .multi()
        .setex(statusKey, checkTimeLimit, "1")
        .expire(countKey, checkTimeLimit)
        .exec();
      // await setExpireAsync(statusKey, checkTimeLimit, "1");
      // await expireAsync(countKey, checkTimeLimit);
      return true;
    }
    if (currentCount > countLimit) {
      redis.multi().del([statusKey]).decr(countKey).exec();
      // await delAsync([statusKey]);
      // await decrAsync(countKey);
      return false;
    }
    return true;
  } catch (e) {
    throw e;
  }
};

export const getRate = async (checkTime: number) => {
  try {
    const countKey: string = `${appName}.${fakeUserAPI}.count`;

    // let status = await checkStatusByMongo();
    let flag: boolean = await checkFlag(fakeUserAPI);
    console.log(flag);

    if (!flag) {
      return {
        success: false,
        message: `Error 429:Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds`,
      };
    }
    let status: boolean = await limitApiCall();
    if (status) {
      let data = await getAsync(countKey);
      if (data) {
        let redisRes = JSON.parse(data);
        let updateAtTime = new Date(redisRes.update_at).getTime();
        let isCheckTimePass = checkTimeFunc(updateAtTime, checkTime);
        if (isCheckTimePass) {
          return {
            success: isCheckTimePass,
            message: "server response!",
            rate: redisRes.rate,
            update_at: redisRes.update_at,
            create_at: redisRes.create_at,
          };
        }
        return {
          success: isCheckTimePass,
          message: "Data were expired! Waitting for new data",
        };
      }
    } else {
      const lifeTimeOfKey: number = await ttlAsync(countKey);
      setExpireAsyncLocal(countKey, lifeTimeOfKey, "1");
      return {
        success: false,
        message: `Error 429:Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds`,
      };
    }
  } catch (e) {
    return {
      success: false,
      message: e,
    };
  }
};
