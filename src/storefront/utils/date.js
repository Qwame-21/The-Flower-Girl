export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function validFutureDate(year, month, day, now = new Date()) {
  const date = new Date(year, month - 1, day);
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
    && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    && date >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formIsoDate(data, prefix) {
  const day = Number(data.get(`${prefix}-day`));
  const month = MONTHS.indexOf(data.get(`${prefix}-month`)) + 1;
  const year = Number(data.get(`${prefix}-year`));
  if (!validFutureDate(year, month, day)) throw new Error('Choose a valid date today or later.');
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formDate(data, prefix) {
  formIsoDate(data, prefix);
  return `${data.get(`${prefix}-day`)} ${data.get(`${prefix}-month`)} ${data.get(`${prefix}-year`)}`;
}
