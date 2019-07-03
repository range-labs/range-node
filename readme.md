![Range Logo](./img/range-arch.png)

# Range Node.js SDK &middot; [![License](https://img.shields.io/github/license/range-labs/range-node.svg)](https://github.com/range-labs/range-node/blob/master/LICENSE) [![Twitter](https://img.shields.io/twitter/follow/rangelabs.svg?style=social)](https://twitter.com/rangelabs)

_Range helps teams know what’s happening, stay in sync, and actually feel like a team. It’s
thoughtfully designed software that helps teams share daily check-ins, track goals, and run better
meetings. So you can do your best work together._

_Everything is easier in Range because it works with the tools you already use. Your tasks,
documents, and code changes are already in Range, so you don’t have to enter data twice._

_Find out more at [www.range.co](https://www.range.co)._

## About

The Range Node SDK provides access to the Range API from applications written in server-side
javascript.

This package makes use of Range API Keys, be careful to keep these keys secure. Avoid checking them
into git repositories or leaving them in unsecured source code.

## Documentation

See this readme and the [API docs](http://www.range.co/docs/api).

## Installation

```bash
npm install range --save
```

## Usage

This package needs to be configured with an API key which you can generate by visiting your
[developer dashboard](https://range.co/_/settings/developer). The key can be passed in via the
`RANGE_ACCESS_KEY` environment variable, or as a constructor argument.

```js
const Range = require('../lib/range');
const rangeClient = new Range('deadbeef1234567890');
```

The SDK uses promises:

```js
new Range()
  .listTeams()
  .then(resp => console.log(resp))
  .catch(err => console.error(err.message));
```

or you can use `await`:

```js
const team = await new Range().readTeam(productTeamID);
```

Errors are typed; both `NetworkError` and `APIError` inherit from `RangeError`.

```js
new Range()
  .findUser({ email: 'no-one@mycorp.com' })
  .then(resp => console.log(resp))
  .catch(err => {
    if (err instanceof Range.APIError && err.code === Range.ErrorCodes.NOT_FOUND) {
      console.log('A Range user does not exist for that email');
    } else {
      console.error(err.message);
    }
  });
```
