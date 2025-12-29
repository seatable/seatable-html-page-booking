export const debounce = (fn, delay, immediate) => {
  let timer = null;
  return (...params) => {
    if (timer) {
      clearTimeout(timer);
    }
    if (immediate && !timer) {
      fn.call(this, ...params);
    } else {
      timer = setTimeout(() => {
        timer = null;
        fn.call(this, ...params);
      }, delay);
    }
  };
};
