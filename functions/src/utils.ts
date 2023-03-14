export const weekdayKeyBuilder = (date: number) =>
  new Date(date).toLocaleDateString("sv-SE");

export const weekdayKeyToDayStr = (key: string, long = true) => {
  const shortOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "numeric",
    day: "numeric",
  };
  const longOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-GB", long ? longOptions : shortOptions)
      .format(new Date(key));
};

/**
 * @desc Returns an array keys to the upcoming weekdays from today
 * @return {string[]}
 */
export const getUpcomingWeekdayKeys = () => {
  const today = Date.now();
  return new Array(13).fill(null).map((_, i) => {
    return new Date(today + (i * 24 * 60 * 60 * 1000));
  }).reduce((acc, date) => {
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      return [...acc, weekdayKeyBuilder(date.getTime())];
    } else {
      return acc;
    }
  }, [] as string[]);
};

// Returns the ISO week of the date.
export const getWeek = (key: string) => {
  const date = new Date(key);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 -
                        3 + (week1.getDay() + 6) % 7) / 7);
};

export const getDay = (key: string) => {
  const date = new Date(key);
  return date.getDay();
};
