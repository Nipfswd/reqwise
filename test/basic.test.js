const { reqwise } = require('../src/index');

test('makes a GET request and parses JSON', async () => {
  const res = await reqwise('https://jsonplaceholder.typicode.com/todos/1');
  const json = await res.asJSON();

  expect(res.ok).toBe(true);
  expect(json).toHaveProperty('title');
}, 10000); // give it up to 10s just in case
