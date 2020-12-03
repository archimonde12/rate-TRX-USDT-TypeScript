import {
  key,
  fakeUserAPI,
  checkTimeLimit,
  countLimit,
  appName,
} from "./config";
import { getAsync, setAsync, incrAsync } from "./redis";
import { usersStatusCollection } from "./mongo";
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

const checkUserStatusByRedis = async () => {
  try {
    const now: number = new Date().getTime();
    const safeTime: number =
      Math.round((checkTimeLimit / countLimit) * 1000) * 2;
    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    const endSessionKey: string = `${appName}.${fakeUserAPI}.endSession`;
    const statusKey: string = `${appName}.${fakeUserAPI}.status`;
    let getStatusRes = await getAsync(statusKey);
    let getEndSessionRes = await getAsync(endSessionKey);

    const isOutOfTime: boolean = now > Number(getEndSessionRes);
    if (getStatusRes === "inactive" && !isOutOfTime) {
      return {
        count: countLimit,
        active: false,
      };
    }

    let getCountRes = await getAsync(countKey);
    if (!getCountRes || !getEndSessionRes || isOutOfTime) {
      await setAsync(countKey, "1");
      await setAsync(endSessionKey, `${now + checkTimeLimit * 1000}`);
      await setAsync(statusKey, "active");
      return {
        count: 1,
        active: true,
      };
    } else {
      const currentCount: number = Number(getCountRes) + 1;
      const isOutOfCount: boolean = currentCount >= countLimit;
      const timeRemain: number = Number(getEndSessionRes) - now;
      const timeSafeRemain: number =
        checkTimeLimit * 1000 - safeTime * currentCount;
      const isRequestOnSafeSpeed: boolean = timeRemain < timeSafeRemain;

      if (isOutOfCount && !isOutOfTime) {
        await setAsync(statusKey, "inactive");
        return {
          count: countLimit,
          active: false,
        };
      } else {
        await incrAsync(countKey);
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
    let statusRedis = await checkUserStatusByRedis();
    console.log(statusRedis);
    if (status) {
      let data = await getAsync(key);
      if (data) {
        let redisRes = JSON.parse(data);
        let updateAtTime = new Date(redisRes.update_at).getTime();
        let isCheckTimePass = checkTimeFunc(updateAtTime, checkTime);
        if (isCheckTimePass) {
          return {
            success: isCheckTimePass,
            message: "Found lastest Data!",
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
        message: `Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds. Please wait ${checkTimeLimit} seconds more for new request`,
      };
    }
  } catch (e) {
    return {
      success: false,
      message: e,
    };
  }
};
