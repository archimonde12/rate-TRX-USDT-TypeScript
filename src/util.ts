export const checkTimeFunc = (timeCheck: number, checkTime: number) => {
  //Check dữ liệu có đảm bảo cập nhật mới nhất hay không
  const now = new Date().getTime();
  return now - timeCheck < checkTime * 1000 * 60;
};
