import { trxusdtRateURL, target_currency, key, saveDataPeriod } from "./config";
import axios from "axios";
import { setAsync } from "./redis";

const saveNewRate = async () => {
  try {
    let now = new Date().toISOString();
    const url = trxusdtRateURL;
    const { data } = await axios.get(url);
    data.tickers.forEach(async (value: any) => {
      if (value.target === target_currency) {
        const saveData = {
          rate: value.last,
          update_at: value.last_traded_at,
          create_at: now,
        };
        const saveRes = await setAsync(key, JSON.stringify(saveData));
        if (saveRes === "OK") {
          console.log("Update new TRX/USDT rate SUCCESSFUL");
          return true;
        } else {
          console.log("FAIL to update new rate ");
          return false;
        }
      }
    });
  } catch (e) {
    throw e;
  }
};

export const routineUpdateNewRate = () => {
  setTimeout(async () => {
    await saveNewRate();
    routineUpdateNewRate();
  }, saveDataPeriod * 1000);
};
