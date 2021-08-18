// Sets a user's status to disabled.
// Admin's API Key is required.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node disable-user.js user@domain.com

import Range, { EntityStatus } from '../lib/range.js';

const email = process.argv[2];
const client = new Range();

client
  .findUser({ email })
  .then(data => client.updateUserState(data.user_id, { status: EntityStatus.DISABLED }))
  .then(data =>
    console.log(
      data.status === EntityStatus.DISABLED
        ? 'User successfully disabled'
        : `Update failed, status is ${data.status}`
    )
  )
  .catch(err => console.error(err.message));
