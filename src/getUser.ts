import { getAsync, ttlAsync } from "./redis";
import { fakeUserAPI, appName, countLimit, checkTimeLimit } from "./config";

export const getUser = async (userAPI: string) => {
  const now: number = new Date().getTime();
  const countKey: string = `${appName}.${userAPI}.count`;
  const endSessionKey: string = `${appName}.${fakeUserAPI}.endSession`;
  const countRes = await getAsync(countKey);
  const reactiveAt: number = await ttlAsync(countKey);
  const endSessionRes = await getAsync(endSessionKey);
  const isOutOfCount: boolean = Number(countRes) >= countLimit;
  return {
    code: isOutOfCount ? "429" : "200",
    count: Number(countRes),
    status: isOutOfCount ? "inactive" : "active",
    remain: countLimit - Number(countRes),
    reactiveAt: reactiveAt === -2 ? null : reactiveAt,
  };
};
