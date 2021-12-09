// Shows objectives that are at risk.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node objectives-at-risk.js

import Range from '../lib/range.js';

new Range()
  .listObjectives({
    include_refs: true,
    include_related: true,
    exclude_abandoned: true,
    exclude_completed: true,
  })
  .then(data => {
    data.objectives.forEach(objective => {
      if (objective.status.status_type == 'AT_RISK' || objective.status.status_type == 'BEHIND') {
        console.log(`#${objective.tag} ${objective.title} (${objective.status.status})`);
      }
    });
  })
  .catch(err => console.error(err.message));
