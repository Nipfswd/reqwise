const axios = require('axios');
const { sendRequest } = require('./core');

// Main export
async function reqwise(url, options = {}, config = {}) {
  return sendRequest(url, options, config);
}

function autoTransport(url, options = {}) {
  const useFetch = typeof fetch !== 'undefined';

  if (useFetch) {
    return fetch(url, options).then(wrapResponse);
  } else {
    return axios({ url, ...options }).then(wrapAxiosResponse);
  }
}

function wrapResponse(res) {
  return {
    ok: res.ok,
    status: res.status,
    asJSON: () => res.json(),
    asText: () => res.text(),
    asBuffer: () => res.arrayBuffer(),
  };
}

function wrapAxiosResponse(res) {
  return {
    ok: res.status < 400,
    status: res.status,
    asJSON: async () => res.data,
    asText: async () =>
      typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
    asBuffer: async () => Buffer.from(res.data),
  };
}

module.exports = { reqwise };
