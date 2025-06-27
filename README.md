# reqwise

A smart HTTP request toolkit for Node.js and the CLI. Supports retries, backoff, timeouts, JSON shaping, and file downloads—with zero fuss.

## Install

```bash
npm install -g reqwise
```

# Usage

```bash
reqwise [METHOD] <url> [--flags]
```

# Examples:

```bash
reqwise https://api.example.com --json
reqwise POST https://api.example.com --body '{ "name": "Noah" }' --json
reqwise POST https://api.com --body @data.json --json
reqwise https://api.com/file.zip --save file.zip
```

#  Flags
```--body```: JSON string or @file.json

```--header```: Custom header ("Key:Value")

```--json```: Output parsed JSON

```--text```: Output raw text

```--timeout```: Timeout in ms (default: 5000)

```--save```: Write response to file

```--help```: Show CLI usage
## Built with ♥ by Noah
