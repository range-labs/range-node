'use strict';

import * as https from 'https';
import * as querystring from 'querystring';

import * as activityAPI from './activity.js';
import * as checkinsAPI from './checkins.js';
import * as meetingsAPI from './meetings.js';
import * as objectivesAPI from './objectives.js';
import * as teamsAPI from './teams.js';
import * as usersAPI from './users.js';

const DEFAULT_HOST = process.env.RANGE_API_HOST || 'api.range.co';
const DEFAULT_PORT = process.env.RANGE_API_PORT || '443';
const DEFAULT_BASE_PATH = '/v1/';

// TODO: Figure out proper way to import json in ES modules.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PACKAGE_VERSION = require('../package.json').version;
const CLIENT_ID = `RangeNode/${PACKAGE_VERSION}`;

class Range {
  constructor(key) {
    if (!key) {
      key = process.env.RANGE_ACCESS_KEY;
    }
    if (!key) {
      console.error('You need to specify an API Key. Either pass one using new Range(key)');
      console.error('or make RANGE_ACCESS_KEY available in your environment.');
      console.error('');
      console.error('See https://www.range.co/api/docs/ for more information.');
      process.exit(1);
    }

    this._apiKey = key;
    this._host = DEFAULT_HOST;
    this._port = DEFAULT_PORT;
    this._basePath = DEFAULT_BASE_PATH;
    this.verbose = false;

    // Lazily loaded if needed.
    this._me = null;
  }
  setHost(host) {
    this._host = host;
    return this;
  }
  setPort(port) {
    this._port = port;
    return this;
  }
  setBasePath(basePath) {
    this._basePath = basePath;
    return this;
  }

  me() {
    if (this._me) {
      return Promise.resolve(this._me);
    }
    return this._get('users/me').then(user => {
      this._me = user;
      return user;
    });
  }

  // Deprecated: use .me()
  authUser(params = {}) {
    return this._get('users/auth-user', null, params);
  }

  // Helpers.

  // Takes a list and returns a map, keyed off the value of each item's
  // 'idKey'.
  static listToMap(list, idKey) {
    let map = {};
    list.forEach(item => {
      map[item[idKey]] = item;
    });
    return map;
  }

  // Private methods.

  _get(path, query = {}, params = {}) {
    return this._request(path, {
      ...params,
      query: query,
      method: 'GET',
    });
  }
  _post(path, data = {}, params = {}) {
    return this._request(path, {
      ...params,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  _put(path, data = {}, params = {}) {
    return this._request(path, {
      ...params,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  _delete(path, query = {}, params = {}) {
    return this._request(path, {
      ...params,
      query: query,
      method: 'DELETE',
    });
  }
  _request(path, params = {}) {
    const qs = params.query ? '?' + querystring.stringify(params.query) : '';
    const options = {
      ...params,
      host: this._host,
      port: this._port,
      path: `${this._basePath}${path}${qs}`,
      auth: `${this._apiKey}:`,
      headers: {
        ...params.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'X-Range-Client': CLIENT_ID,
        'User-Agent': CLIENT_ID,
      },
    };
    this._log(options.method, options.path, options.query);
    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', data => (body += data));
        res.on('end', () => {
          let payload;
          try {
            payload = JSON.parse(body);
          } catch (e) {
            // Non JSON response means an error before the response handler.
            reject(
              new NetworkError(
                `server error: failed to parse response body: "${body.trim()}"`,
                res.statusCode
              )
            );
            return;
          }
          if (res.statusCode !== 200) {
            reject(new APIError(payload, res.statusCode));
            return;
          } else {
            resolve(payload);
          }
        });
      });
      req.on('error', e => {
        reject(new RangeError(`connection error: ${e.message}`));
      });
      if (params.body) {
        req.write(params.body);
      }
      req.end();
    });
  }
  _log() {
    if (!this.verbose) return;
    let args = Array.prototype.slice.call(arguments);
    args.unshift('[rng]');
    console.log.apply(console, args);
  }
}
Object.assign(Range.prototype, activityAPI);
Object.assign(Range.prototype, checkinsAPI);
Object.assign(Range.prototype, meetingsAPI);
Object.assign(Range.prototype, objectivesAPI);
Object.assign(Range.prototype, teamsAPI);
Object.assign(Range.prototype, usersAPI);

class RangeError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NetworkError extends RangeError {
  constructor(message, statusCode) {
    super(`${message} (${statusCode})`);
    this.statusCode = statusCode;
  }
}

class APIError extends RangeError {
  constructor(payload, statusCode) {
    super(`response error: ${payload.error} (${statusCode} ${Range.ErrorNames[payload.code]})`);
    this.error = payload.error;
    this.code = payload.code;
    this.statusCode = statusCode;
  }
}

Range.RangeError = RangeError;
Range.APIError = APIError;
Range.NetworkError = NetworkError;

Range.EntityStatus = {
  PENDING: 2,
  ENABLED: 4,
  DISABLED: 8,
  DELETED: 16,
  TOMBSTONE: 32,
};

Range.AccessLevels = {
  GUEST: 0,
  STANDARD: 1,
  ADMIN: 5,
  OWNER: 10,
};

Range.ErrorCodes = {
  OK: 0,
  CANCELED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATALOSS: 15,
  UNAUTHENTICATE: 16,
};

Range.ErrorNames = {
  0: 'OK',
  1: 'CANCELED',
  2: 'UNKNOWN',
  3: 'INVALID_ARGUMENT',
  4: 'DEADLINE_EXCEEDED',
  5: 'NOT_FOUND',
  6: 'ALREADY_EXISTS',
  7: 'PERMISSION_DENIED',
  8: 'RESOURCE_EXHAUSTED',
  9: 'FAILED_PRECONDITION',
  10: 'ABORTED',
  11: 'OUT_OF_RANGE',
  12: 'UNIMPLEMENTED',
  13: 'INTERNAL',
  14: 'UNAVAILABLE',
  15: 'DATALOSS',
  16: 'UNAUTHENTICATED',
};

Range.SnippetTypes = {
  PAST: 1,
  FUTURE: 2,
  QUESTION: 3,
  BACKLOG: 4,
};

export default Range;
export const { EntityStatus, AccessLevels, ErrorCodes, ErrorNames, SnippetTypes } = Range;
