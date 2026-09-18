// RSS sources for the "Jesus Interactive News Brief" (see newsBrief.js).
// One config array so adding/removing/swapping a publisher is an edit
// here, never a code change in the fetch/parse logic. A feed that 404s
// or times out is skipped by newsBrief.js, not fatal to the others.
const NEWS_BRIEF_SOURCES = [
  { name: 'Christian Post', url: 'https://www.christianpost.com/rss/feed.xml' },
  { name: 'Christian Post - Church & Ministries', url: 'https://www.christianpost.com/category/church-ministries/rss' },
  { name: 'Worthy News', url: 'https://worthynews.com/feed' },
  { name: 'Charisma News', url: 'https://mycharisma.com/feed' },
  { name: 'Christianity Today', url: 'https://feeds.christianitytoday.com/christianitytoday/ctmag' },
  { name: 'One News Now', url: 'https://www.onenewsnow.com/rss/rss_allsections' },
];

module.exports = { NEWS_BRIEF_SOURCES };
