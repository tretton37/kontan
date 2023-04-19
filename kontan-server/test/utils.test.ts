import {
  weekdayKeyToDayStr,
  getUpcomingWeekdayKeys,
  getWeek,
  getDay,
} from '../src/utils';

describe('weekdayKeyToDayStr', () => {
  test("2023-02-17 should return 'Friday, 17 February'", () => {
    expect(weekdayKeyToDayStr('2023-02-17')).toBe('Friday, 17 February');
  });

  test("2023-02-17 should return 'Friday, 17/02'", () => {
    expect(weekdayKeyToDayStr('2023-02-17', false)).toBe('Friday, 17/02');
  });
});

describe('getUpcomingWeekdayKeys', () => {
  beforeEach(() => {
    jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() => Date.parse('2020-02-20'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('2023-02-20 should return 9 days', () => {
    expect(getUpcomingWeekdayKeys()).toEqual([
      '2020-02-21',
      '2020-02-24',
      '2020-02-25',
      '2020-02-26',
      '2020-02-27',
      '2020-02-28',
      '2020-03-02',
      '2020-03-03',
      '2020-03-04',
    ]);
  });
});

describe('getWeek', () => {
  test('2023-02-17 should return 7', () => {
    expect(getWeek('2023-02-17')).toBe(7);
  });

  test('1st of January is on a Monday should return 1', () => {
    expect(getWeek('2024-01-01')).toBe(1);
  });

  test('1st of January is on a Thursday should return 4', () => {
    expect(getWeek('2026-01-01')).toBe(1);
  });

  test('1st of January is on a Friday should return 53', () => {
    expect(getWeek('2027-01-01')).toBe(53);
  });

  test('1st of January is on a Saturday should return 52 if no leap year', () => {
    expect(getWeek('2028-01-01')).toBe(52);
  });

  test('1st of January is on a Saturday should return 53 if leap year', () => {
    expect(getWeek('2033-01-01')).toBe(53);
  });

  test('1st of January is on a Sunday should return 52', () => {
    expect(getWeek('2034-01-01')).toBe(52);
  });
});

describe('getDay', () => {
  test('Sunday should return 0', () => {
    expect(getDay('2023-02-19')).toBe(0);
  });

  test('Saturday should return 6', () => {
    expect(getDay('2023-02-18')).toBe(6);
  });
});
