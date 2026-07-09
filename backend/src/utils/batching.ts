/** Splits an array into fixed-size chunks. Pure and easy to unit test. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be greater than 0");
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}
