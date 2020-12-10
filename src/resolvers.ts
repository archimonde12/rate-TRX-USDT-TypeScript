const { getClientIp } = require("@supercharge/request-ip");

import { getRate } from "./getRate";
import { getUser } from "./getUser";
import { fakeUserAPI } from "./config";
const resolver = {
  Query: {
    getTRXUSDTrate: async (_: any, { checkTime = 10 }, ctx: any) => {
      const ipAddress = getClientIp(ctx.req);
      console.log(ipAddress, " request get rate!");
      let rate = await getRate(checkTime);
      let userStatus = await getUser(fakeUserAPI);
      let result = { ...rate, ...userStatus };
      return result;
    },
    user: (_: any, { userAPI = fakeUserAPI }, ctx: any) => {
      const ipAddress = getClientIp(ctx.req);
      return getUser(userAPI);
    },
  },
};
export default resolver;
