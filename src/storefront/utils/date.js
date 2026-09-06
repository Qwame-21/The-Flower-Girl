export function formDate(data, prefix) {
  const day = data.get(`${prefix}-day`);
  const month = data.get(`${prefix}-month`);
  const year = data.get(`${prefix}-year`);
  return day && month && year ? `${day} ${month} ${year}` : '';
}

export function formIsoDate(data, prefix) {
  const day = Number(data.get(`${prefix}-day`));
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(data.get(`${prefix}-month`)) + 1;
  const year = Number(data.get(`${prefix}-year`));
  return day && month && year ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
}
