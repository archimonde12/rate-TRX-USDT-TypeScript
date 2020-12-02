import { key, fakeUserAPI, checkTimeLimit, countLimit } from "./config";
import { getAsync, setAsync } from "./redis";
import { usersStatusCollection } from "./mongo";
import { checkTimeFunc } from "./util";
// falsy, truthy
const checkStatus = async () => {
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
    await usersStatusCollection.findOneAndReplace(query, currentUserStatus);
    return true;
  }
  if (isOutOfCount && !isOutOfTime) {
    console.log(`${fakeUserAPI} reach limit requests`);
    currentUserStatus.status = "inactive";
    console.log(currentUserStatus);
    await usersStatusCollection.findOneAndReplace(query, currentUserStatus);
    return false;
  }
  if (!isOutOfCount && !isOutOfTime) {
    currentUserStatus.count++;
    currentUserStatus.status = "active";
    console.log(currentUserStatus);
    await usersStatusCollection.findOneAndReplace(query, currentUserStatus);
    return true;
  }
};

export const getRate = async (checkTime: number) => {
  try {
    let status = await checkStatus();
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
