import {
  key,
  fakeUserAPI,
  checkTimeLimit,
  countLimit,
  appName,
} from "./config";
import { getAsync, incrAsync, expireAsync } from "./redis";
import { checkTimeFunc } from "./util";

const limitApiCall = async () => {
  try {
    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    const getCountRes = await incrAsync(countKey);
    const currentCount = Number(getCountRes);
    if (currentCount === 1) {
      await expireAsync(countKey, checkTimeLimit);
      return {
        count: 1,
        active: true,
      };
    } else {
      if (currentCount > countLimit) {
        return {
          count: countLimit,
          active: false,
        };
      } else {
        return {
          count: currentCount,
          active: true,
        };
      }
    }
  } catch (e) {
    throw e;
  }
};

export const getRate = async (checkTime: number) => {
  try {
    // let status = await checkStatusByMongo();
    let status = await limitApiCall();
    if (status.active) {
      let data = await getAsync(key);
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
      return {
        success: false,
        message:
          status.count === 1
            ? "Refresing ..."
            : `Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds. Please wait ${checkTimeLimit} seconds more for new request`,
      };
    }
  } catch (e) {
    return {
      success: false,
      message: e,
    };
  }
};
