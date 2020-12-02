import { trxusdtRateURL, target_currency, key } from "./config";
import axios from "axios";
import { getAsync, setAsync } from "./redis";
import { checkTimeFunc } from "./util";

export const getRate = async (checkTime: number) => {
  try {
    let data = await getAsync(key);
    if (data != null) {
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
  } catch (e) {
    return {
      success: false,
      message: e,
    };
  }
};
