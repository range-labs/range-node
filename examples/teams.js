// Prints out a non hierarchical summary of all the teams in the organization.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node teams.js

import Range from '../lib/range.js';

new Range()
  .listTeams()
  .then((data) =>
    data.teams.forEach((team) => {
      console.log(
        pad(team.slug, 20),
        pad(team.name, 20),
        pad(pluralize(countMembers(team), 'member'), 11),
        pad(pluralize(countFollowers(team), 'follower'), 13)
      );
    })
  )
  .catch((err) => console.error(err.message));

function countMembers(team) {
  return team.relations.reduce((count, rel) => count + (rel.is_member ? 1 : 0), 0);
}

function countFollowers(team) {
  return team.relations.reduce((count, rel) => count + (rel.is_member ? 0 : 1), 0);
}

function pad(str, len) {
  if (str.length >= len) return str.substr(0, len - 3) + '...';
  else return str.padEnd(len, ' ');
}

function pluralize(count, term) {
  if (count === 1) return `${count} ${term}`;
  else return `${count} ${term}s`;
}
