const { getClientIp } = require("@supercharge/request-ip");

import { getRate } from "./getRate";
import { getUser } from "./getUser";
import { checkTimeLimit, countLimit, fakeUserAPI } from "./config";
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
      try {
        let rate = await getRate(checkTime);
        if (!rate) {
          return null;
        }
        let now = new Date().getTime();
        if (rate.count < 100 && !flagFirstTimeCount) {
          flagFirstTimeCount = true;
          flagCountLimit = false;
          let countNotification = {
            text: "Refresh your 100 request",
            reactiveAt: checkTimeLimit,
          };
          setTimeout(() => {
            pubsub.publish(TEST, { countNotification });
            flagFirstTimeCount = false;
          }, createExpireTime() * 1000 - now);
        } else {
          if (rate.count === 100 && !flagCountLimit) {
            flagFirstTimeCount = false;
            flagCountLimit = true;
            let countNotification = {
              text: `Reach ${countLimit} request per ${checkTimeLimit} seconds`,
              reactiveAt: createExpireTime() - Math.round(now / 1000),
            };
            pubsub.publish(TEST, { countNotification });
          }
        }
        let remain = countLimit - rate.count;
        let reactiveAt = createExpireTime() - Math.round(now / 1000);
        let code = rate.count >= 100 ? "inactive" : "active";
        let result = { ...rate, remain, reactiveAt, code };
        return result;
      } catch (err) {
        console.log(err);
      }
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
