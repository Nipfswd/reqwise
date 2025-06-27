const { reqwise } = require('../src/index');

test('retries on failure and eventually fails', async () => {
  const start = Date.now();
  const maxRetries = 2;

  await expect(
    reqwise('https://httpstat.us/500', {}, { maxRetries, backoffBase: 100 })
  ).rejects.toThrow();

  const duration = Date.now() - start;
  expect(duration).toBeGreaterThanOrEqual(100 + 200); // simple backoff check
}, 15000);
