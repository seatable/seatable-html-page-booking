import context from '@/context';

const isDev = import.meta.env.DEV;

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

export const getMediaImageSrc = (imageName, server = null, appUuid = null) => {
  const relativePath = `/media/images/${imageName}`;
  if (isDev) {
    return relativePath;
  }
  return `${server}/external-apps/${appUuid}/html-pages/booking/asset/?path=${relativePath}`;
};
