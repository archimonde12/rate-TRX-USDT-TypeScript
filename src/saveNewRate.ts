import { trxusdtRateURL, target_currency, key } from "./config";
import axios from "axios";
import { setAsync } from "./redis";

export const saveNewRate = async () => {
  try {
    let now = new Date().toISOString();
    const url = trxusdtRateURL;
    const { data } = await axios.get(url);
    data.tickers.forEach(async (value: any) => {
      if (value.target === target_currency) {
        let saveData = {
          rate: value.last,
          update_at: value.last_traded_at,
          create_at: now,
        };
        let saveRes = await setAsync(key, JSON.stringify(saveData));
        if (saveRes === "OK") {
          console.log("Update new TRX/USDT rate SUCCESSFUL");
        } else {
          console.log("FAIL to update new rate ");
        }
      }
    });
  } catch (e) {
    throw e;
  }
};
