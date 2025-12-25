export const pipe = (value: any, ...cb: any[]) => cb.reduce((acc, fn) => fn(acc), value);
