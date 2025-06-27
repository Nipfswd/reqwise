// src/core.js
const axios = require('axios');

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function wrapResponse(res, isAxios) {
  if (isAxios) {
    return {
      ok: res.status < 400,
      status: res.status,
      asJSON: async () => res.data,
      asText: async () =>
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
    };
  }

  return {
    ok: res.ok,
    status: res.status,
    asJSON: () => res.json(),
    asText: () => res.text(),
  };
}

async function sendRequest(url, options = {}, config = {}, attempt = 1) {
  const {
    maxRetries = 3,
    backoffBase = 200,
    timeout = 5000,
  } = config;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const useFetch = typeof fetch !== 'undefined';
    const headers = options.headers || {};
    let payload = options.body;

    // Serialize JSON automatically
    if (
      payload &&
      typeof payload === 'string' &&
      headers['Content-Type']?.includes('application/json')
    ) {
      try {
        JSON.parse(payload); // validate string is valid JSON
      } catch {
        throw new Error('Provided body is not valid JSON.');
      }
    }

    if (
      payload &&
      typeof payload === 'object' &&
      headers['Content-Type']?.includes('application/json')
    ) {
      payload = JSON.stringify(payload);
    }

    if (useFetch) {
      const res = await fetch(url, {
        ...options,
        body: payload,
        headers,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!res.ok && attempt <= maxRetries) {
        await delay(backoffBase * Math.pow(2, attempt - 1));
        return sendRequest(url, options, config, attempt + 1);
      }

      return wrapResponse(res, false);
    } else {
      const res = await axios({
        url,
        timeout,
        headers,
        method: options.method,
        data: payload,
      });
      return wrapResponse(res, true);
    }
  } catch (err) {
    if (attempt <= maxRetries) {
      await delay(backoffBase * Math.pow(2, attempt - 1));
      return sendRequest(url, options, config, attempt + 1);
    }
    throw err;
  }
}

module.exports = { sendRequest };
