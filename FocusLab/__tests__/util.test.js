'use strict';
// Mock wx global (not used by pure functions, but needed for module load)
global.wx = {
  showLoading: jest.fn(),
  hideLoading: jest.fn()
};

const {
  formatDate,
  today,
  formatMinutes,
  priorityMap,
  statusMap,
  goalTypeMap,
  throttle
} = require('../utils/util');

describe('formatDate', () => {
  const fixed = new Date('2026-06-01T14:05:09');

  test('YYYY-MM-DD pattern', () => {
    expect(formatDate(fixed, 'YYYY-MM-DD')).toBe('2026-06-01');
  });

  test('YYYY/MM/DD pattern', () => {
    expect(formatDate(fixed, 'YYYY/MM/DD')).toBe('2026/06/01');
  });

  test('HH:mm:ss pattern', () => {
    expect(formatDate(fixed, 'HH:mm:ss')).toBe('14:05:09');
  });

  test('full datetime', () => {
    expect(formatDate(fixed, 'YYYY-MM-DD HH:mm:ss')).toBe('2026-06-01 14:05:09');
  });

  test('accepts string date', () => {
    expect(formatDate('2026-01-15', 'YYYY-MM-DD')).toBe('2026-01-15');
  });

  test('zero-pads single digit month and day', () => {
    const d = new Date('2026-03-05');
    expect(formatDate(d, 'MM-DD')).toBe('03-05');
  });
});

describe('today', () => {
  test('returns YYYY-MM-DD format matching current date', () => {
    const result = today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    expect(result).toBe(expected);
  });
});

describe('formatMinutes', () => {
  test('0 → 0分钟', () => {
    expect(formatMinutes(0)).toBe('0分钟');
  });

  test('null/undefined → 0分钟', () => {
    expect(formatMinutes(null)).toBe('0分钟');
    expect(formatMinutes(undefined)).toBe('0分钟');
  });

  test('negative → 0分钟', () => {
    expect(formatMinutes(-5)).toBe('0分钟');
  });

  test('< 60 → X分钟', () => {
    expect(formatMinutes(1)).toBe('1分钟');
    expect(formatMinutes(25)).toBe('25分钟');
    expect(formatMinutes(59)).toBe('59分钟');
  });

  test('60 → 1小时', () => {
    expect(formatMinutes(60)).toBe('1小时');
  });

  test('90 → 1小时30分', () => {
    expect(formatMinutes(90)).toBe('1小时30分');
  });

  test('120 → 2小时', () => {
    expect(formatMinutes(120)).toBe('2小时');
  });

  test('125 → 2小时5分', () => {
    expect(formatMinutes(125)).toBe('2小时5分');
  });

  test('boundary 61 → 1小时1分', () => {
    expect(formatMinutes(61)).toBe('1小时1分');
  });
});

describe('priorityMap', () => {
  test('has 3 levels', () => {
    expect(Object.keys(priorityMap)).toHaveLength(3);
  });

  test('level 1 is high priority with red color', () => {
    expect(priorityMap[1].label).toBe('高');
    expect(priorityMap[1].color).toBe('#FF4D4F');
  });

  test('level 2 is medium priority with orange color', () => {
    expect(priorityMap[2].label).toBe('中');
    expect(priorityMap[2].color).toBe('#FAAD14');
  });

  test('level 3 is low priority with green color', () => {
    expect(priorityMap[3].label).toBe('低');
    expect(priorityMap[3].color).toBe('#52C41A');
  });
});

describe('statusMap', () => {
  test('covers 4 statuses', () => {
    expect(statusMap[0]).toBe('待办');
    expect(statusMap[1]).toBe('进行中');
    expect(statusMap[2]).toBe('已完成');
    expect(statusMap[3]).toBe('已放弃');
  });
});

describe('goalTypeMap', () => {
  test('covers 3 goal types', () => {
    expect(goalTypeMap[1]).toBe('日目标');
    expect(goalTypeMap[2]).toBe('周目标');
    expect(goalTypeMap[3]).toBe('月目标');
  });
});

describe('throttle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('fires immediately on first call', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('ignores calls within delay window', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('fires again after delay expires', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);
    throttled();
    jest.advanceTimersByTime(300);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('passes arguments through', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);
    throttled('a', 'b');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });
});
