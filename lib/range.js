'use strict';

const https = require('https');
const querystring = require('querystring');

const DEFAULT_HOST = process.env.RANGE_API_HOST || 'api.range.co';
const DEFAULT_PORT = process.env.RANGE_API_PORT || '443';
const DEFAULT_BASE_PATH = '/v1/';

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

  // Teams API.

  listTeams(opt_userId, params = {}) {
    if (opt_userId) return this._get(`users/${opt_userId}/teams`, null, params);
    else return this._get('teams', null, params);
  }
  readTeam(teamId, params = {}) {
    return this._get(`teams/${teamId}`, null, params);
  }
  createTeam(args, params = {}) {
    return this._post('teams', args, params);
  }
  updateTeam(teamId, args, params = {}) {
    return this._put(`teams/${teamId}`, args, params);
  }
  deleteTeam(teamId, params = {}) {
    return this._delete(`teams/${teamId}`, params);
  }
  updateTeamRelation(teamId, userId, args = {}, params = {}) {
    return this._put(`teams/${teamId}/relations/${userId}`, args, params);
  }
  deleteTeamRelation(teamId, userId, params = {}) {
    return this._delete(`teams/${teamId}/relations/${userId}`, params);
  }

  findUser(args, params = {}) {
    return this._get('users/find', args, params);
  }
  authUser(params = {}) {
    return this._get('users/auth-user', null, params);
  }

  // Check-ins API.

  listUpdates(query = {}, params = {}) {
    return this._get('updates', query, params);
  }

  // Activity API.

  recordInteraction(args, params = {}) {
    return this._post('activity', args, params);
  }

  listActivity(query = {}, params = {}) {
    return this._get('activity', query, params);
  }

  readAttachment(attachmentId, params = {}) {
    return this._get(`attachments/${attachmentId}`, null, params);
  }

  dismissAttachment(attachmentId, params = {}) {
    return this._delete(`activity/${attachmentId}`, params);
  }

  // Deprecated: use recordInteraction
  addSuggestion(args, params = {}) {
    console.warn('addSuggestion is deprecated, please switch to recordInteraction');
    return this._post('suggestions', args, params);
  }

  // Helpers.

  // Takes a list and returns a map, keyed off the value of each item's
  // 'idKey'.
  static listToMap(list, idKey) {
    let map = {};
    list.forEach((item) => {
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
      },
    };
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', (data) => (body += data));
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
      req.on('error', (e) => {
        reject(new RangeError(`connection error: ${e.message}`));
      });
      if (params.body) {
        req.write(params.body);
      }
      req.end();
    });
  }
}

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

module.exports = Range;
