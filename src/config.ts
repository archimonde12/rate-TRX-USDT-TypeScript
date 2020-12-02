import { config } from "dotenv";

config();

export const trxusdtRateURL =
  process.env.TRXUSDTRATEURL ||
  "https://api.coingecko.com/api/v3/coins/tron/tickers?exchange_ids=binance&page=1";

export const redisUri = process.env.REDIS;
export const redisPort = 15381;
export const redisAuth = `0xCDbcCuRusFwrpSVOKzQTV2bVgOax1J`;
export const target_currency = "USDT";
export const key = "appname.trx.usdt.rate";
export const saveDataPeriod = 10; //seconds
