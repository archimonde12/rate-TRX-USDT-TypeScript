import { appName, checkTimeLimit, countLimit, fakeUserAPI } from "./config";
import { expireAsync, incrAsync } from "./redis";

export const rateLimit = async () => {
  try {
    const countKey: string = `${appName}.${fakeUserAPI}.count`;
    const getCountRes = await incrAsync(countKey);
    const currentCount = Number(getCountRes);
    if (currentCount === 1) {
      await expireAsync(countKey, checkTimeLimit);
      return true;
    }
    if (currentCount > countLimit) {
      return false;
    }
    return true;
  } catch (e) {
    throw e;
  }
};
