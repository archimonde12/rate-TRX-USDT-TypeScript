import { getAsync } from "./redis";
import { fakeUserAPI, appName } from "./config";

export const getUser = async (userAPI: string) => {
  const countKey: string = `${appName}.${userAPI}.count`;
  const statusKey: string = `${appName}.${userAPI}.status`;
  const countRes = await getAsync(countKey);
  let getStatusRes = await getAsync(statusKey);
  return {
    count: Number(countRes),
    status: getStatusRes,
  };
};
