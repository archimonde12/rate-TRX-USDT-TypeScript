import { appName } from "./config";
import { existAsyncLocal } from "./localRedis";
import { allKeysCache } from "./scanAllCountKeys";

export const checkFlag = async (userAPI: string) => {
  try {
    const key: string = `${appName}.${userAPI}.count`;
    let isExist = await existAsyncLocal(key);
    if (isExist === 1) {
      return false;
    }
    return true;
  } catch (e) {
    throw e;
  }
};

export const checkLocalFlag = (userAPI: string) => {
  const countKey: string = `${appName}.${userAPI}.count`;
  const statusKey: string = `${appName}.${userAPI}.status`;
  const { allCountKeys, allStatusKeys } = allKeysCache;
  let flagCount = allCountKeys.includes(countKey);
  let flagStatus = allStatusKeys.includes(statusKey);
  if (flagCount === flagStatus) {
    return true;
  }
  return false;
};
