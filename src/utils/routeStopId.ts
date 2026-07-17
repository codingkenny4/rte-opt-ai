let counter = 0;

export const createStopId = (): string => {
  counter += 1;
  return `stop-${counter}`;
};
