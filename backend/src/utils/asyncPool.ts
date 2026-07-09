/**
 * Runs `tasks` with at most `concurrency` running at once. Unlike
 * Promise.all, a rejected task does not stop the others — each task is
 * expected to handle its own errors internally (extraction.service.ts does,
 * so one failed AI batch never aborts the whole import).
 */
export async function asyncPool(concurrency: number, tasks: Array<() => Promise<void>>): Promise<void> {
  const queue = [...tasks];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await task();
    }
  });
  await Promise.all(workers);
}
