import { getAsync } from "./redis";
import { fakeUserAPI, appName, countLimit } from "./config";

export const getUser = async (userAPI: string) => {
  const countKey: string = `${appName}.${userAPI}.count`;
  const statusKey: string = `${appName}.${userAPI}.status`;
  const countRes = await getAsync(countKey);
  return {
    count: Number(countRes) >= countLimit ? countLimit : Number(countRes),
    status: Number(countRes) >= countLimit ? "inactive" : "active",
  };
};
