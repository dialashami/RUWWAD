// Generic helper utilities for the backend

exports.pick = (obj, keys) => {
  if (!obj) return {};
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

exports.buildPagination = (page = 1, limit = 20) => {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.max(parseInt(limit, 10) || 20, 1);
  return { skip: (p - 1) * l, limit: l };
};
