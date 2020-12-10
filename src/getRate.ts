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
import {
  checkFlagByLocalRedis,
  checkFlagByLocalVarAndCloudRedis,
} from "./checkFlag";
import { allKeysCache } from "./scanAllCountKeys";

export let tempApiStatus: any[] = [];

const limitApiCall = async () => {
  try {
    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    const statusKey: string = `${appName}.${fakeUserAPI}.status`;
    const getCountRes = await incrAsync(countKey);
    const currentCount = Number(getCountRes);
    if (currentCount === 1) {
      redis
        .multi()
        .set(statusKey, "1")
        .expireat(statusKey, createExpireTime())
        .expireat(countKey, createExpireTime())
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

const createExpireTime = () => {
  let now = new Date().getTime();
  var coeff = 1000 * checkTimeLimit;
  var rounded = (Math.ceil(now / coeff) * coeff) / 1000;
  return rounded;
};

const checkLocal = (api: string) => {
  //When restart it disappear
  let index = tempApiStatus.findIndex(({ apiKey }) => apiKey === api);
  let result: any;
  if (index > -1) {
    let now = new Date().getTime() / 1000;
    let isExpire = now > tempApiStatus[index].expireAt;
    if (isExpire) {
      tempApiStatus[index].expireAt = createExpireTime();
      tempApiStatus[index].count = 1;
      tempApiStatus[index].active = true;
      return tempApiStatus[index];
    }
    let isCountLimit = tempApiStatus[index].count >= countLimit;
    if (isCountLimit) {
      tempApiStatus[index].active = false;
      return tempApiStatus[index];
    }
    tempApiStatus[index].count++;
    return tempApiStatus[index];
  } else {
    result = {
      apiKey: api,
      count: 1,
      expireAt: createExpireTime(),
      active: true,
    };
    tempApiStatus.push(result);
    return result;
  }
};
// Phương án khác
export const getRate = async (checkTime: number) => {
  try {
    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    let flag: boolean = await checkFlagByLocalVarAndCloudRedis(fakeUserAPI);

    if (!flag) {
      return {
        success: false,
        message: `Error 429:Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds`,
      };
    }
    let status: boolean = await limitApiCall();
    if (status) {
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

//Dùng chỉ local var
// export const getRate = async (checkTime: number) => {
//   try {
//     const countKey: string = `${appName}.${fakeUserAPI}.count`;
//     let check = checkLocal(fakeUserAPI);
//     console.log(check);
//     if (!check.active) {
//       return {
//         success: false,
//         message: `Error 429:Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds`,
//       };
//     }
//     let status: boolean = await limitApiCall();
//     if (status) {
//       let data = await getAsync(countKey);
//       if (data) {
//         let redisRes = JSON.parse(data);
//         let updateAtTime = new Date(redisRes.update_at).getTime();
//         let isCheckTimePass = checkTimeFunc(updateAtTime, checkTime);
//         if (isCheckTimePass) {
//           return {
//             success: isCheckTimePass,
//             message: "server response!",
//             rate: redisRes.rate,
//             update_at: redisRes.update_at,
//             create_at: redisRes.create_at,
//           };
//         }
//         return {
//           success: isCheckTimePass,
//           message: "Data were expired! Waitting for new data",
//         };
//       }
//     } else {
//       const lifeTimeOfKey: number = await ttlAsync(countKey);
//       setExpireAsyncLocal(countKey, lifeTimeOfKey, "1");
//       return {
//         success: false,
//         message: `Error 429:Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds`,
//       };
//     }
//   } catch (e) {
//     return {
//       success: false,
//       message: e,
//     };
//   }
// };
