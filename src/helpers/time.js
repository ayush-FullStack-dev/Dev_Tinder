import epochify from "epochify";

export const isValidDate = value => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

export const getTime = req => {
    const time = epochify.getFullDateTime();
    let clientTime = null;
    if (req?.body) {
        clientTime = new Date(req?.body?.clientTime || Date.now()).getTime();
    } else {
        clientTime = new Date(req);
    }

    return {
        serverTime: time.timestamp,
        clientTime,
        fullTime: time
    };
};
