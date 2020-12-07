const { getClientIp } = require("@supercharge/request-ip");

import { getRate } from "./getRate";
import { getAnyRate } from "./getAnyRate";
import { getUser } from "./getUser";
import { fakeUserAPI } from "./config";
const resolver = {
  Query: {
    getTRXUSDTrate: (_: any, { checkTime = 10 }, ctx: any) => {
      const ipAddress = getClientIp(ctx.req);
      console.log(ipAddress, " request get rate!");
      return getRate(checkTime);
    },
    user: (_: any, { userAPI = fakeUserAPI }, ctx: any) => {
      const ipAddress = getClientIp(ctx.req);
      return getUser(userAPI);
    },
    getRate: (_: any, { coin, currency }) => {
      return getAnyRate(coin, currency);
    },
  },
};
export default resolver;
