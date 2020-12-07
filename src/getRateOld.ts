import {
  key,
  fakeUserAPI,
  checkTimeLimit,
  countLimit,
  appName,
} from "./config";
import {
  getAsync,
  setAsync,
  incrAsync,
  decrAsync,
  rpushAsync,
  ltrimAsync,
  expireAsync,
  lrangeAsync,
} from "./redis";
import { usersStatusCollection, mongoFindOne } from "./mongo";
import { checkTimeFunc } from "./util";
// falsy, truthy
const checkStatusByMongo = async () => {
  try {
    const now = new Date().getTime();
    const safeTime = Math.round((checkTimeLimit / countLimit) * 1000) * 2;
    const query = { id: fakeUserAPI };
    let currentUserStatus = await usersStatusCollection.findOne(query);
    if (!currentUserStatus) {
      const ResetUserStatusData = {
        id: fakeUserAPI,
        count: 0,
        status: "active",
        endSession: now + checkTimeLimit * 1000,
      };
      await usersStatusCollection.inserOne(ResetUserStatusData);
      currentUserStatus = ResetUserStatusData;
    }
    let { count, endSession } = currentUserStatus;
    const isOutOfTime = now > endSession;
    const isOutOfCount = count >= countLimit;
    const timeRemain = endSession - now;
    const timeSafeRemain = checkTimeLimit * 1000 - safeTime * count;
    const isRequestOnSafeSpeed = timeRemain < timeSafeRemain;
    if (isOutOfTime || isRequestOnSafeSpeed) {
      currentUserStatus.count = 1;
      currentUserStatus.endSession = now + checkTimeLimit * 1000;
      currentUserStatus.status = "active";
      console.log(currentUserStatus);
      const updateDocument = {
        $set: {
          count: 1,
          status: "active",
          endSession: now + checkTimeLimit * 1000,
        },
      };
      await usersStatusCollection.findOneAndUpdate(query, updateDocument);
      return true;
    }
    if (isOutOfCount && !isOutOfTime) {
      console.log(`${fakeUserAPI} reach limit requests`);
      currentUserStatus.status = "inactive";
      console.log(currentUserStatus);
      const updateDocument = { $set: { status: "inactive" } };
      await usersStatusCollection.findOneAndUpdate(query, updateDocument);
      return false;
    }
    if (!isOutOfCount && !isOutOfTime) {
      currentUserStatus.count++;
      currentUserStatus.status = "active";
      console.log(currentUserStatus);
      const updateDocument = { $inc: { count: 1 } };
      await usersStatusCollection.findOneAndUpdate(query, updateDocument);
      return true;
    }
  } catch (e) {
    throw e;
  }
};

// const checkUserStatusByRedis = async () => {
//   try {
//     const now: number = new Date().getTime();
//     const safeTime: number =
//       Math.round((checkTimeLimit / countLimit) * 1000) * 2;
//     const countKey: string = `${appName}.${fakeUserAPI}.count`;
//     const endSessionKey: string = `${appName}.${fakeUserAPI}.endSession`;
//     const statusKey: string = `${appName}.${fakeUserAPI}.status`;
//     let getStatusRes = await getAsync(statusKey);
//     let getEndSessionRes = await getAsync(endSessionKey);

//     const isOutOfTime: boolean = now > Number(getEndSessionRes);
//     if (getStatusRes === "inactive" && !isOutOfTime) {
//       return {
//         count: countLimit,
//         active: false,
//       };
//     }

//     let getCountRes = await getAsync(countKey);
//     if (!getCountRes || !getEndSessionRes || isOutOfTime) {
//       await setAsync(countKey, "1");
//       await setAsync(endSessionKey, `${now + checkTimeLimit * 1000}`);
//       await setAsync(statusKey, "active");
//       return {
//         count: 1,
//         active: true,
//       };
//     } else {
//       const currentCount: number = Number(getCountRes) + 1;
//       const isOutOfCount: boolean = currentCount >= countLimit;
//       const timeRemain: number = Number(getEndSessionRes) - now;
//       const timeSafeRemain: number =
//         checkTimeLimit * 1000 - safeTime * currentCount;
//       const isRequestOnSafeSpeed: boolean = timeRemain < timeSafeRemain;

//       if (isOutOfCount && !isOutOfTime) {
//         await setAsync(statusKey, "inactive");
//         return {
//           count: countLimit,
//           active: false,
//         };
//       } else {
//         await incrAsync(countKey);
//         return {
//           count: currentCount,
//           active: true,
//         };
//       }
//     }
//   } catch (e) {
//     throw e;
//   }
// };

// const checkUserStatusByRedis = async () => {
//   //Fixed Window try to use isResetKey
//   try {
//     const now: number = new Date().getTime();

//     const countKey: string = `${appName}.${fakeUserAPI}.count`;
//     const endSessionKey: string = `${appName}.${fakeUserAPI}.endSession`;
//     const isResetKey: string = `${appName}.${fakeUserAPI}.isReset`;
//     const getCountRes = await incrAsync(countKey);
//     console.log("getCounRes:", getCountRes);

//     const isResetCount = await getAsync(isResetKey);
//     const isFirstCount = isResetCount === "true";
//     console.log(Number(getCountRes) === 2 && isFirstCount);
//     console.log(Number(getCountRes) > 2 && !isFirstCount);

//     if (
//       (Number(getCountRes) === 2 && isFirstCount) ||
//       (Number(getCountRes) > 2 && !isFirstCount)
//     ) {
//       await setAsync(isResetKey, "false");
//       let getEndSessionRes = await getAsync(endSessionKey);
//       const isOutOfTime: boolean = now > Number(getEndSessionRes);
//       if (!getCountRes || !getEndSessionRes || isOutOfTime) {
//         const setCountRes = await setAsync(countKey, "1");
//         const setEndSession = await setAsync(
//           endSessionKey,
//           `${now + checkTimeLimit * 1000}`
//         );
//         if (setCountRes === "OK" && setEndSession === "OK") {
//           setAsync(isResetKey, "true");
//         }
//         return {
//           count: 1,
//           active: true,
//         };
//       } else {
//         const currentCount: number = Number(getCountRes);
//         const isOutOfCount: boolean = currentCount > countLimit;

//         if (isOutOfCount && !isOutOfTime) {
//           return {
//             count: countLimit,
//             active: false,
//           };
//         } else {
//           return {
//             count: currentCount,
//             active: true,
//           };
//         }
//       }
//     } else {
//       await decrAsync(countKey);
//       return { count: 1, active: false };
//     }
//   } catch (e) {
//     throw e;
//   }
// };

const checkUserStatusByRedis = async () => {
  //Fixed Window
  try {
    const now: number = new Date().getTime();

    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    const endSessionKey: string = `${appName}.${fakeUserAPI}.endSession`;

    const getCountRes = await incrAsync(countKey);
    const getEndSessionRes = await getAsync(endSessionKey);

    const isOutOfTime: boolean = now > Number(getEndSessionRes);

    if (!getCountRes || !getEndSessionRes || isOutOfTime) {
      await setAsync(countKey, "1");
      await setAsync(endSessionKey, `${now + checkTimeLimit * 1000}`);
      return {
        count: 1,
        active: false,
      };
    } else {
      const currentCount: number = Number(getCountRes);
      const isOutOfCount: boolean = currentCount > countLimit;
      if (isOutOfCount && !isOutOfTime) {
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

const checkUserStatusByRedisSlidingWindow = async () => {
  //Get now time
  const now: number = new Date().getTime();
  //Get current data
  const logKey: string = `${appName}.${fakeUserAPI}.log`;
  const lrangeRes = await lrangeAsync(logKey, 0, 0);
  if (lrangeRes) {
    const firstElm: number = Number(lrangeRes[0]);
    console.log(firstElm);
    const isOutOfTime: boolean = now > firstElm + checkTimeLimit * 1000;
    if (!isOutOfTime) {
      let getCount: number = await rpushAsync(logKey, now.toString());
      const isOutOfCount: boolean = getCount > countLimit;
      if (isOutOfCount) {
        await ltrimAsync(logKey, 0, 99);
        return {
          count: 100,
          active: false,
        };
      } else {
        return {
          count: getCount,
          active: true,
        };
      }
    } else {
      await ltrimAsync(logKey, -1, 0);
      let getCount = await rpushAsync(logKey, now.toString());
      return {
        count: getCount,
        active: true,
      };
    }
  } else {
    let getCount = await rpushAsync(logKey, now.toString());
    return {
      count: getCount,
      active: true,
    };
  }
};

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
