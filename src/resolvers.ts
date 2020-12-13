const { getClientIp } = require("@supercharge/request-ip");

import { getRate } from "./getRate";
import { getUser } from "./getUser";
import { fakeUserAPI } from "./config";
import { createExpireTime } from "./util";

import { PubSub, withFilter } from "apollo-server";
const pubsub = new PubSub();
const TEST = "TEST";
let flagFirstTimeCount = false;
let flagCountLimit = false;

const resolver = {
  Query: {
    getTRXUSDTrate: async (_: any, { checkTime = 10 }, ctx: any) => {
      const ipAddress = getClientIp(ctx.req);
      console.log(ipAddress, " request get rate!");
      let rate = await getRate(checkTime);
      let userStatus = await getUser(fakeUserAPI);
      if (userStatus.count < 100 && !flagFirstTimeCount) {
        flagFirstTimeCount = true;
        flagCountLimit = false;
        let now = new Date().getTime();
        let countNotification = { id: 1, text: "Refresh your 100 request" };
        setTimeout(() => {
          pubsub.publish(TEST, { countNotification });
        }, createExpireTime() * 1000 - now);
      } else {
        if (userStatus.count === 100 && !flagCountLimit) {
          flagFirstTimeCount = false;
          flagCountLimit = true;
          let countNotification = {
            id: 2,
            text: "Reach 100 request per minute",
          };
          pubsub.publish(TEST, { countNotification });
        }
      }
      let result = { ...rate, ...userStatus };
      return result;
    },
    user: (_: any, { userAPI = fakeUserAPI }, ctx: any) => {
      const ipAddress = getClientIp(ctx.req);
      return getUser(userAPI);
    },
  },
  Subscription: {
    countNotification: {
      subscribe: () => pubsub.asyncIterator([TEST]),
    },
  },
};
export default resolver;
