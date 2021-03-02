// Adds a suggestion to remind you to read a link.
//
// Usage:
//  export RANGE_ACCESS_KEY=....
//  node remind.js https://blog.remote.com/why-you-should-be-doing-async-work/

const https = require('https');
const Range = require('../lib/range');

const htmlURL = process.argv[2];

console.log('Fetching', htmlURL);
const req = https.get(htmlURL, (res) => {
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (data) => (body += data));
  res.on('end', () => {
    if (res.statusCode !== 200) {
      fail(`status ${res.statusCode}\n${JSON.stringify(res.headers)}`);
      return;
    }
    const payload = parse(body);
    new Range()
      .recordInteraction(payload)
      .then((data) => {
        console.log('Interaction recorded');
      })
      .catch(fail);
  });
});
req.on('error', fail);
req.end();

function parse(body) {
  let title;
  const matches = body.match(/<title[^>]*>(.*)<\/title>/);
  if (matches && matches[1]) {
    title = matches[1];
  } else {
    title = htmlURL;
  }

  return {
    type: 'ASSIGNED',
    attachment_id: '123',
    attachment: {
      source_id: htmlURL.replace(/[^a-zA-Z0-9]/g, ''),
      type: 'LINK',
      provider: 'readinglist',
      provider_name: 'Reading List',
      name: title,
      html_url: htmlURL,
    },
  };
}

function fail(err) {
  console.error('Error:', err);
  process.exit(1);
}
