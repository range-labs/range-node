// Prints out a user's teams (by email address)
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node my-teams.js user@domain.com

import Range from '../lib/range.js';

const email = process.argv[2];
const client = new Range();

client
  .findUser({ email })
  .then(data => client.listTeams(data.user_id))
  .then(data =>
    data.teams.forEach(team => {
      console.log(pad(team.slug, 20), pad(team.name, 20));
    })
  )
  .catch(err => console.error(err.message));

function pad(str, len) {
  if (str.length >= len) return str.substr(0, len - 3) + '...';
  else return str.padEnd(len, ' ');
}
