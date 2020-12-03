const { getClientIp } = require("@supercharge/request-ip");

import { getRate } from "./getRate";
const resolver = {
  Query: {
    getTRXUSDTrate: (_: any, { checkTime = 10 }, ctx: any) => {
      const ipAddress = getClientIp(ctx.req);
      return getRate(checkTime);
    },
  },
};
export default resolver;
