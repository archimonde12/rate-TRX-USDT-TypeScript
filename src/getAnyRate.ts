import { appName, checkTimeLimit, countLimit } from "./config";
import { rateLimit } from "./rateLimit";
import { expireAsync, getAsync, setAsync } from "./redis";
import axios from "axios";

export const getAnyRate = async (coinId: string, currency: string) => {
  try {
    // console.log(`(1) Try to get a rate of ${coinId}/${currency}`);
    const now = new Date().toISOString();
    const keyRate: string = `${appName}.${coinId}.${currency}.rate`;
    const status = await rateLimit();
    // console.log("(2) Check status of user:", status);
    if (status) {
      //Get API from redis
      //   console.log("(3) Try to get data from redis");
      let rateRes = await getAsync(keyRate);
      if (!rateRes) {
        // console.log("(4) Data not exist in redis. Try to get a new one by API");
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/tickers?exchange_ids=binance&page=1`;
        const { data } = await axios.get(url);
        if (data) {
          //   console.log("(5) Found newest data. try to save on Redis");
          //   console.log("(6) Search the rate on new data");
          const foundData = data.tickers.find(
            (value) => value.target === currency.toUpperCase()
          );
          if (foundData) {
            // console.log("(7) Found the rate!");
            const saveData = {
              rate: foundData.last,
              update_at: foundData.last_traded_at,
              create_at: now,
            };
            // console.log("(8) Save the rate to Redis");
            const saveRes = await setAsync(keyRate, JSON.stringify(saveData));

            if (saveRes == "OK") {
              const EXIST_TIME_OF_DATA = 1; //minute
              //   console.log(
              //     `(9) Saving successful the data will exist in ${EXIST_TIME_OF_DATA} min`
              //   );
              await expireAsync(keyRate, EXIST_TIME_OF_DATA * 60);
            }

            return {
              success: true,
              message: "server response!",
              ...saveData,
            };
          }
          //   console.log("(7) Cannot find the rate on Binance");
          return {
            success: false,
            message: `cannot found the rate of ${coinId}/${currency} on Binance`,
          };
        }
        // console.log("(5)Fail to fetch API");
        return {
          success: false,
          message: "fail to load new data",
        };
      }
      //   console.log("(4) Found data on Redis");
      let coinRate = JSON.parse(rateRes);
      return {
        success: true,
        message: "server response!",
        rate: coinRate.rate,
        update_at: coinRate.update_at,
        create_at: coinRate.create_at,
      };
    }
    return {
      success: false,
      message: `Error 429:Out of limit  ${countLimit} requests per ${checkTimeLimit} seconds`,
    };
  } catch (err) {
    throw err;
  }
};
