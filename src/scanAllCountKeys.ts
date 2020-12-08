import { appName } from "./config";
import { getKeys } from "./redis";
export let allKeysCache: { allStatusKeys: string[]; allCountKeys: string[] };

export const scanAllCountKeys = async () => {
  const queryStatusKey = `${appName}.*.status`;
  const queryCountKey = `${appName}.*.count`;
  const allStatusKeys = await getKeys(queryStatusKey);
  const allCountKeys = await getKeys(queryCountKey);
  allKeysCache = { allStatusKeys, allCountKeys };
};

export const scanAllCountKeysEvery = (ms: number) => {
  setTimeout(async () => {
    await scanAllCountKeys();
    scanAllCountKeysEvery(ms);
  }, ms);
};
