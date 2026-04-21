export async function measureAsync<T>(label: string, task: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await task();
  const duration = performance.now() - start;
  console.info(`${label} completed in ${duration.toFixed(2)}ms`);
  return result;
}

