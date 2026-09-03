// One-time setup script -- NOT part of the running server. Creates the
// xAI Collection the chat endpoint searches via the file_search tool
// (see /v1/chat/messages in server.js), and uploads its two starting
// documents: the full Berean Standard Bible (public domain, same
// translation src/services/bibleApi.ts already uses elsewhere in the
// app) and the Jesus persona prompt itself, so the model can retrieve
// either when useful.
//
// Run once (re-run any time you want to rebuild the collection from
// scratch -- it always creates a NEW collection rather than mutating an
// existing one):
//   cd backend
//   XAI_API_KEY=... XAI_MANAGEMENT_API_KEY=... node scripts/setup-collection.js
//
// Prints the resulting collection id at the end -- paste that into
// XAI_COLLECTION_ID in your .env (and Vercel's env vars) to activate
// retrieval on the chat endpoint.

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MANAGEMENT_API_KEY = process.env.XAI_MANAGEMENT_API_KEY;
const BIBLE_TRANSLATION = 'BSB';
const BIBLE_SOURCE_URL = `https://bible.helloao.org/api/${BIBLE_TRANSLATION}/complete.simple.json`;

if (!XAI_API_KEY || !XAI_MANAGEMENT_API_KEY) {
  console.error('Set XAI_API_KEY and XAI_MANAGEMENT_API_KEY before running this script.');
  process.exit(1);
}

// Converts the helloao.org "simple complete translation" JSON (the same
// source bibleApi.ts fetches per-chapter from) into one plain-text file:
// book name headings, chapter numbers, verse numbers inline with their
// text -- readable, greppable, and simple for the model's retrieval to
// chunk sensibly.
function bibleJsonToText(data) {
  const lines = [`${data.translation.name} (${data.translation.shortName})`, ''];
  for (const book of data.books) {
    lines.push(`## ${book.name}`, '');
    for (const { chapter } of book.chapters) {
      lines.push(`Chapter ${chapter.number}`);
      for (const item of chapter.content) {
        if (item.type === 'verse') lines.push(`${item.number} ${item.text}`);
        else if (item.type === 'heading') lines.push(`  (${item.text})`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

// Same regex-extraction the persona-sync check elsewhere in this repo
// uses -- pulls just the prompt content out of persona.ts, not the
// surrounding TS module/comments.
function extractPersonaText() {
  const tsPath = path.join(__dirname, '..', '..', 'src', 'constants', 'persona.ts');
  const content = fs.readFileSync(tsPath, 'utf8');
  const match = content.match(/JESUS_PERSONA_SYSTEM_PROMPT\s*=\s*`(.*?)`(\.trim\(\))?;/s);
  if (!match) throw new Error('Could not extract JESUS_PERSONA_SYSTEM_PROMPT from persona.ts');
  return match[1].trim();
}

async function createCollection(name) {
  const res = await fetch('https://management-api.x.ai/v1/collections', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${XAI_MANAGEMENT_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ collection_name: name }),
  });
  if (!res.ok) throw new Error(`createCollection failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function uploadFile(filename, text) {
  const form = new FormData();
  form.append('file', new Blob([text], { type: 'text/plain' }), filename);
  form.append('purpose', 'assistants');
  const res = await fetch('https://api.x.ai/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${XAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`uploadFile(${filename}) failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function addFileToCollection(collectionId, fileId, name) {
  const res = await fetch(
    `https://management-api.x.ai/v1/collections/${collectionId}/documents/${fileId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${XAI_MANAGEMENT_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name }),
    }
  );
  if (!res.ok) {
    throw new Error(`addFileToCollection(${fileId}) failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log(`Fetching ${BIBLE_TRANSLATION} from ${BIBLE_SOURCE_URL} ...`);
  const bibleRes = await fetch(BIBLE_SOURCE_URL);
  if (!bibleRes.ok) throw new Error(`Bible source fetch failed: ${bibleRes.status}`);
  const bibleJson = await bibleRes.json();
  const bibleText = bibleJsonToText(bibleJson);
  console.log(`Converted to plain text: ${(bibleText.length / 1024 / 1024).toFixed(1)} MB`);

  const personaText = extractPersonaText();
  console.log(`Persona prompt: ${(personaText.length / 1024).toFixed(0)} KB`);

  console.log('Creating collection...');
  const collection = await createCollection('Jesus Interactive Scripture & Persona');
  const collectionId = collection.collection_id;
  console.log(`Collection created: ${collectionId}`);

  console.log('Uploading Bible file...');
  const bibleFile = await uploadFile(`${BIBLE_TRANSLATION.toLowerCase()}_complete.txt`, bibleText);
  await addFileToCollection(collectionId, bibleFile.id, `${BIBLE_TRANSLATION} Complete Bible`);
  console.log(`Bible added: ${bibleFile.id}`);

  console.log('Uploading persona file...');
  const personaFile = await uploadFile('jesus_persona.txt', personaText);
  await addFileToCollection(collectionId, personaFile.id, 'Jesus Persona Prompt');
  console.log(`Persona added: ${personaFile.id}`);

  console.log('\nDone. Set this in your .env (and Vercel env vars):');
  console.log(`XAI_COLLECTION_ID=${collectionId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
