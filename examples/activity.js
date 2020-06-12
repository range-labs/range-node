// Shows your recent activity as detected via integrations.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node activity.js

const Range = require('../lib/range');

new Range()
  .listActivity({ include_refs: true, collation: 'ATTACHMENT' })
  .then((data) =>
    data.interactions.forEach((i) => {
      let a = data.attachments.find((a) => a.id === i.attachment_id);
      console.log(`${a.name} [${a.provider_name}]`);
    })
  )
  .catch((err) => console.error(err.message));
