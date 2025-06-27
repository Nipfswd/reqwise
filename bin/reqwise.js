#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { reqwise } = require('../src/index');

const [, , ...args] = process.argv;
const knownMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

let method = 'GET';
let url = null;
const flags = {};

// Parse CLI arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (knownMethods.includes(arg.toUpperCase())) {
    method = arg.toUpperCase();
    url = args[i + 1];
    i++;
  } else if (!arg.startsWith('--') && !url) {
    url = arg;
  } else if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    flags[key] = val;
    if (val !== true) i++;
  }
}

// 🎓 Help & usage info
if (flags.help || !url) {
  console.log(`
🧠  reqwise — A smart HTTP request CLI

Usage:
  reqwise [METHOD] <url> [--flags]

Examples:
  reqwise https://api.example.com --json
  reqwise POST https://api.example.com --body '{ "name": "Noah" }' --json
  reqwise POST https://api.com --body @file.json --json
  reqwise https://api.com/file.zip --save download.zip

Flags:
  --body        JSON string or @file.json
  --header      Custom header (format: "Key:Value")
  --json        Output response as pretty JSON
  --text        Output raw response text
  --timeout     Timeout in ms (default: 5000)
  --save        Download response to file
  --help        Show this help message

Supports auto-retries, backoff, JSON response shaping, and file downloads.
`);
  process.exit(0);
}

async function main() {
  try {
    let body;

    // Load body from file if @file.json
    if (flags.body?.startsWith('@')) {
      const filepath = flags.body.slice(1).trim();
      try {
        body = fs.readFileSync(path.resolve(filepath), 'utf-8');
      } catch (err) {
        console.error(`❌ Could not read body file: ${filepath}`);
        process.exit(1);
      }
    } else if (flags.body) {
      body = flags.body;
    }

    // Default headers
    const headers = { 'Content-Type': 'application/json' };
    if (flags.header && flags.header.includes(':')) {
      const [k, v] = flags.header.split(':');
      headers[k.trim()] = v.trim();
    }

    const timeout = flags.timeout ? Number(flags.timeout) : 5000;

    // File download mode
    if (flags.save) {
      const writer = fs.createWriteStream(flags.save);
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, res => {
        if (res.statusCode >= 400) {
          console.error(`❌ Failed to download. Status: ${res.statusCode}`);
          process.exit(1);
        }

        res.pipe(writer);
        writer.on('finish', () => {
          console.log(`💾 Saved to ${flags.save}`);
        });
        writer.on('error', err => {
          console.error('❌ Write error:', err.message);
          process.exit(1);
        });
      });

      return;
    }

    // Perform standard HTTP request
    const response = await reqwise(url, { method, headers, body }, { timeout });

    if (flags.json) {
      const data = await response.asJSON();
      console.log(JSON.stringify(data, null, 2));
    } else if (flags.text) {
      const text = await response.asText();
      console.log(text);
    } else {
      console.log(`✅ Response status: ${response.status}`);
    }

  } catch (err) {
    console.error('❌ Request failed:', err.message);
    process.exit(1);
  }
}

main();
