export const checkTimeFunc = (timeCheck: number, checkTime: number) => {
  const now = new Date().getTime();
  return now - timeCheck < checkTime * 1000 * 60;
};
