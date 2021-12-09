// Sets a user's status to enabled.
// Admin's API Key is required.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node enable-user.js user@domain.com

import Range, { EntityStatus } from '../lib/range.js';

const email = process.argv[2];
const client = new Range();

client
  .findUser({ email, allow_inactive: true, allow_pending: true })
  .then(data => client.updateUserState(data.user_id, { status: EntityStatus.ENABLED }))
  .then(data =>
    console.log(
      data.status === EntityStatus.ENABLED
        ? 'User successfully enabled'
        : `Update failed, status is ${data.status}`
    )
  )
  .catch(err => console.error(err.message));
