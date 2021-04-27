// Generates a weekly report. Updates since the last Monday will be included.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node weekly-snippets.js --target=[user/team-d] --week=[weeks ago]
//
// Default = auth user and current week.
//
import Range from '../lib/range.js';
import flags from './flags.js';

let target_id = flags('target');
let weekNum = Number(flags('week')) || 0;

let after = getMonday(new Date()) - weekNum * 1000 * 60 * 60 * 24 * 7;
let before = after + 1000 * 60 * 60 * 24 * 7;

let query = {
  after: new Date(after).toISOString(),
  before: new Date(before).toISOString(),
  include_refs: true,
  use_client_offset: true,
  ascending: true,
};

if (target_id) query.target_id = target_id;

new Range()
  .listUpdates(query)
  .then(({ updates, snippets, attachments }) => {
    // Snippets and attachments referenced by updates are returned in lists.
    let snippetMap = Range.listToMap(snippets, 'id');
    let attachmentsMap = Range.listToMap(attachments, 'id');

    // Moods are emojione short-codes. To be compatible with Slack or GitHub
    // we'd need a mapping.
    let moods = updates.map((update) => update.mood).filter((mood) => !!mood);

    // For this report we extract all the past snippets and enrich with the
    // attachment and the client's timezone when the update was published.
    let history = updates.reduce(
      (list, update) =>
        list.concat(
          update.snippets
            .map((id) => snippetMap[id])
            .filter((snippet) => snippet.snippet_type == Range.SnippetTypes.PAST)
            .map((snippet) => {
              if (snippet.attachment_id) {
                snippet.attachment = attachmentsMap[snippet.attachment_id];
              }
              snippet.client_timezone_offset = update.client_timezone_offset;
              return snippet;
            })
        ),
      []
    );

    // Now we generate the markdown.

    console.log('Overview:');
    console.log('---------');

    console.log(`**${updates.length} check-ins!**`);
    if (moods.length > 0) {
      console.log(`### ${moods.join(' ')}`);
      console.log('');
    }

    history.filter(isMainFocus).forEach((item) => {
      let day = DAYS[new Date(item.published_at).getDay()];
      console.log(` - **${day}** => ${item.transformed_content}`);
    });

    let bare = history.filter(not(isMainFocus)).filter(not(hasAttachment));
    if (bare.length > 0) {
      console.log('');
      console.log('Updates:');
      console.log('--------');
      bare.forEach((item) => console.log(` - ${item.transformed_content}`));
      console.log('');
    }

    console.log('');
    console.log('Meetings:');
    console.log('---------');
    history.filter(isEvent).forEach(printBullet);

    console.log('');
    console.log('Code changes:');
    console.log('-------------');
    history.filter(isCodeChange).forEach((evt) => {
      // Just use PR message, no snippet content.
      console.log(` - [${evt.attachment.name}](${evt.attachment.html_url})`);
    });

    console.log('');
    console.log('Documents:');
    console.log('----------');
    let docs = history.filter(isDocument);
    let includedDocs = {};
    docs
      .filter((doc) => doc.reason === 'EDITED')
      .forEach((doc) => {
        if (!includedDocs[doc.attachment.id]) {
          includedDocs[doc.attachment.id] = true;
          printBullet(doc);
        }
      });
    console.log(' - And commented on:');
    docs
      .filter((doc) => doc.reason === 'COMMENTED')
      .forEach((doc) => {
        if (includedDocs[doc.attachment.id]) return;
        console.log(`    - ${link(doc)}`);
      });

    let otherAttachments = history
      .filter(not(isEvent))
      .filter(not(isDocument))
      .filter(not(isCodeChange))
      .filter(hasAttachment)
      .reduce((map, item) => {
        let key = item.attachment.provider_name;
        if (!map[key]) map[key] = [];
        map[key].push(item);
        return map;
      }, {});
    for (let provider in otherAttachments) {
      console.log('');
      console.log(`From ${provider}:`);
      console.log(new Array(provider.length + 7).join('-'));
      otherAttachments[provider].forEach(printBullet);
    }
  })
  .catch((err) => console.error(err.stack));

function pad(str, len) {
  if (str.length >= len) return str.substr(0, len - 3) + '...';
  else return str.padEnd(len, ' ');
}

function pluralize(count, term) {
  if (count === 1) return `${count} ${term}`;
  else return `${count} ${term}s`;
}

function getMonday(d) {
  d = new Date(d);
  let day = d.getDay() || 7;
  d.setHours(-24 * (day - 1));
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  return d;
}

function printBullet(item) {
  console.log(` - ${link(item)}`);
}

function link(item) {
  if (item.transformed_content)
    return `[${item.attachment.name}](${item.attachment.html_url}) (${item.transformed_content})`;
  else return `[${item.attachment.name}](${item.attachment.html_url})`;
}

function not(fn) {
  return (arg) => !fn(arg);
}

function hasAttachment(item) {
  return !!item.attachment;
}

function isMainFocus(item) {
  return item.is_main_focus;
}

function isEvent(snippet) {
  return (
    snippet.attachment &&
    (snippet.attachment.type === 'EVENT' || snippet.attachment.type === 'MEETING')
  );
}

function isCodeChange(snippet) {
  return snippet.attachment && snippet.attachment.type === 'CODE_CHANGE';
}

function isDocument(snippet) {
  return (
    snippet.attachment &&
    (snippet.attachment.type === 'DOCUMENT' || snippet.attachment.type === 'FILE')
  );
}

const DAYS = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tues',
  3: 'Wed',
  4: 'Thurs',
  5: 'Fri',
  6: 'Say',
};
