// Demonstrates how to use typed errors.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node errors.js

const Range = require('../lib/range');

async function main() {
  try {
    let resp = await new Range().deleteTeamRelation('123', 'abc');
    console.log('API response received:', resp);
  } catch (err) {
    if (err instanceof Range.APIError && err.code === Range.ErrorCodes.NOT_FOUND) {
      console.log('No relation to delete for that user and team');
    } else {
      console.error(err.message);
    }
  }
}

main();
