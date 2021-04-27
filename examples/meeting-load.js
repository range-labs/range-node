// Shows the meeting load of users relative to other people in their org.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node meeting-load.js

import Range from '../lib/range.js';

const client = new Range();

async function main() {
  try {
    let analytics = [];
    let totals = { calenderedMins: 0, meetingMins: 0, meetingCount: 0 };
    for await (let eventAnalysis of fetchEventAnalysis()) {
      analytics.push(eventAnalysis);
      let s = eventAnalysis.summary;
      totals.calenderedMins += s.calenderedMins;
      totals.meetingMins += s.meetingMins;
      totals.meetingCount += s.meetingCount;
    }

    let avgCalenderedMins = Math.round(totals.calenderedMins / analytics.length);
    let avgMeetingCount = Math.round(totals.meetingCount / analytics.length);
    let avgMeetingTimeMins = Math.round(totals.meetingMins / analytics.length);

    console.log('Average meeting load:');
    console.log('  ', pretty(avgMeetingCount, 'meetings'));
    console.log('  ', prettyMins(avgMeetingTimeMins, 'meeting time'));
    console.log('  ', prettyMins(avgCalenderedMins, 'calendered time'));
    console.log('');

    analytics.forEach((a) => {
      let s = a.summary;
      console.log(`${a.user.profile.full_name}:`);
      console.log('  ', pretty(s.meetingCount, 'meetings', avgMeetingCount));
      console.log('  ', prettyMins(s.meetingMins, 'meeting time', avgMeetingTimeMins));
      console.log('  ', prettyMins(s.calenderedMins, 'calendered time', avgCalenderedMins));
    });
  } catch (err) {
    console.error(err.message);
  }
}

function pretty(m, label, compare) {
  if (!compare) return `${m} ${label}`;

  let diff = Math.round(100 * (m / compare)) - 100;
  return `${m} ${label} (${diff}%)`;
}

function prettyMins(m, label, compare) {
  let h = Math.floor(m / 60);
  let mr = m - h * 60;
  if (!compare) return `${h}h${mr}m ${label}`;
  let diff = Math.round((100 * m) / compare) - 100;
  return `${h}h${mr}m ${label} (${diff}%)`;
}

main();

async function* fetchEventAnalysis() {
  const listUsersResponse = await client.listUsers({});
  for (let i = 0; i < listUsersResponse.users.length; i++) {
    let user = listUsersResponse.users[i];
    let result = await client.eventAnalysis(user.user_id);
    let summary = summarize(result.days);
    // Who has know meetings, for real? Skip accounts with no meetings as they
    // are likely test accounts or don't have calendar integrated.
    if (summary.meetingCount === 0) continue;
    yield { user, summary };
  }
}

function summarize(days) {
  let summary = { calenderedMins: 0, meetingMins: 0, meetingCount: 0 };
  days.forEach((es) => {
    summary.calenderedMins +=
      es.self.duration_mins +
      es.one_on_one.duration_mins +
      es.small_group.duration_mins +
      es.large_group.duration_mins +
      es.external.duration_mins;
    summary.meetingMins +=
      es.one_on_one.duration_mins +
      es.small_group.duration_mins +
      es.large_group.duration_mins +
      es.external.duration_mins;
    summary.meetingCount +=
      es.one_on_one.count + es.small_group.count + es.large_group.count + es.external.count;
  });
  return summary;
}
