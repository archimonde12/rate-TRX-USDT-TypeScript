import { getRate } from "./getRate";
const resolver = {
  Query: {
    getTRXUSDTrate: (_: any, { checkTime = 10 }, ___: any) => {
      return getRate(checkTime);
    },
  },
};
export default resolver;