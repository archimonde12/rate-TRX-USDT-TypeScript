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
import { checkTimeFunc, createExpireTime } from "./util";
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

const checkLocal = (api: string) => {
  //Problem: When restart it disappear
  //Check is api exist in local
  let index = tempApiStatus.findIndex(({ apiKey }) => apiKey === api);
  let result: any;
  //If exist
  if (index > -1) {
    let now = new Date().getTime() / 1000; //Convert to seconds
    //Check expire
    let isExpire = now > tempApiStatus[index].expireAt;
    //If expire => re-create
    if (isExpire) {
      tempApiStatus[index].expireAt = createExpireTime();
      tempApiStatus[index].count = 1;
      tempApiStatus[index].active = true;
      return tempApiStatus[index];
    }
    //Check count limit
    let isCountLimit = tempApiStatus[index].count >= countLimit;
    //If limit => set active = false
    if (isCountLimit) {
      tempApiStatus[index].active = false;
      return tempApiStatus[index];
    }
    //If not limit => count++
    tempApiStatus[index].count++;
    return tempApiStatus[index];
  } else {
    //If not exist create new one
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
// export const getRate = async (checkTime: number) => {
//   try {
//     const countKey: string = `${appName}.${fakeUserAPI}.count`;
//     let flag: boolean = await checkFlagByLocalRedis(fakeUserAPI);

//     if (!flag) {
//       return {
//         success: false,
//         message: `Error 429:Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds`,
//       };
//     }
//     let status: boolean = await limitApiCall();
//     if (status) {
//       let data = await getAsync(key);
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

//Dùng chỉ local var
export const getRate = async (checkTime: number) => {
  try {
    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    let check = checkLocal(fakeUserAPI);
    console.log(check);
    if (!check.active) {
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
