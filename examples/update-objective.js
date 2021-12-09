// Updates an objective status.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node update-objective.js Security AT_RISK
//
// Valid status values:
//    ON_TRACK
//    AT_RISK
//    BEHIND
//    COMPLETE
//    DISCARDED

const tag = process.argv[2];
const status = process.argv[3];

import Range from '../lib/range.js';
const client = new Range();

client
  .listObjectives({ tags: [tag], exclude_abandoned: true, exclude_completed: true })
  .then(data => {
    return data.objectives.map(objective => {
      return client.createObjectiveStatus(objective.objective_id, { status_type: status });
    });
  })
  .catch(err => console.error(err.message));
