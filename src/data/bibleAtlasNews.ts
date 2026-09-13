// "Latest Discoveries" -- the Global Map's monthly curated news layer.
// Deliberately hand-curated, NOT scraped or automated: the user was
// explicit that a reviewed, credible feed is what makes this section
// trustworthy, and that an automated pull risks something inaccurate or
// sensational slipping through. Update this file by hand, roughly
// monthly, after reviewing real reporting (Israel Antiquities Authority
// releases, peer-reviewed journals, established outlets) -- never wire
// a scraper or live API to this file.
export interface AtlasNewsEntry {
  id: string;
  date: string; // 'YYYY-MM'
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
}

// The two entries below are illustrative placeholders based on general
// knowledge of real, well-known announcements (City of David excavations,
// the Megiddo mosaic) -- their exact dates/wording have NOT been verified
// against a live source in this pass. Verify against the actual IAA
// release or journal article before treating either as publish-ready,
// and replace with freshly-reviewed entries on the next monthly pass.
export const BIBLE_ATLAS_NEWS: AtlasNewsEntry[] = [
  {
    id: '2023-11-city-of-david-seal',
    date: '2023-11',
    title: 'First Temple-period clay seal found in City of David excavations',
    summary: 'Israeli archaeologists announced the discovery of a small clay seal impression from the First Temple period during ongoing excavations in Jerusalem\'s City of David, adding to the growing record of administrative activity in Iron Age Jerusalem.',
    sourceName: 'Israel Antiquities Authority',
    sourceUrl: 'https://www.antiquities.org.il/article_eng.aspx',
  },
  {
    id: '2022-12-megiddo-church-mosaic',
    date: '2022-12',
    title: 'Early Christian prayer hall mosaic from Megiddo goes on public display',
    summary: 'A mosaic floor from one of the world\'s oldest known Christian prayer halls, discovered near Tel Megiddo and dated to the 3rd century AD, was put on public exhibition after years of study and conservation.',
    sourceName: 'Israel Antiquities Authority',
    sourceUrl: 'https://www.antiquities.org.il/article_eng.aspx',
  },
];
