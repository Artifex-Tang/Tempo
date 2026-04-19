/**
 * 格式化日期
 * @param {Date|string} date
 * @param {string} fmt  支持 YYYY MM DD HH mm ss
 */
function formatDate(date, fmt) {
  const d = date instanceof Date ? date : new Date(date);
  const map = {
    'YYYY': d.getFullYear(),
    'MM':   String(d.getMonth() + 1).padStart(2, '0'),
    'DD':   String(d.getDate()).padStart(2, '0'),
    'HH':   String(d.getHours()).padStart(2, '0'),
    'mm':   String(d.getMinutes()).padStart(2, '0'),
    'ss':   String(d.getSeconds()).padStart(2, '0')
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, k => map[k]);
}

/** 返回今天的 'YYYY-MM-DD' */
function today() {
  return formatDate(new Date(), 'YYYY-MM-DD');
}

/**
 * 格式化分钟数为可读字符串
 * 0 → '0分钟'，<60 → 'X分钟'，≥60 → 'X小时Y分'
 */
function formatMinutes(min) {
  if (!min || min <= 0) return '0分钟';
  if (min < 60) return min + '分钟';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? h + '小时' + m + '分' : h + '小时';
}

const priorityMap = {
  1: { label: '高', color: '#FF4D4F' },
  2: { label: '中', color: '#FAAD14' },
  3: { label: '低', color: '#52C41A' }
};

const statusMap = {
  0: '待办',
  1: '进行中',
  2: '已完成',
  3: '已放弃'
};

const goalTypeMap = {
  1: '日目标',
  2: '周目标',
  3: '月目标'
};

function throttle(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) return;
    timer = setTimeout(() => { timer = null; }, delay);
    fn.apply(this, args);
  };
}

function showLoading(title) {
  wx.showLoading({ title: title || '加载中...', mask: true });
}

function hideLoading() {
  wx.hideLoading();
}

module.exports = {
  formatDate,
  today,
  formatMinutes,
  priorityMap,
  statusMap,
  goalTypeMap,
  throttle,
  showLoading,
  hideLoading
};
