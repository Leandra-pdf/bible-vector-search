
/**
 * Tests the Bible text extraction function.
 * Checks that the Bible content is included and the Gutenberg
 * introduction and credits are excluded.
 */

import assert from 'node:assert/strict';
import {
  extractBibleText,
  getCanonicalBookName,
  parseBible,
} from '../bible/parse.js';

/**
 * Tests that extractBibleText returns only the Bible content.
 */
function testExtractBibleText(): void {
  const bibleText = extractBibleText('data/bible/kjv.txt');

  // The extracted text should contain the Old Testament and Genesis.
  assert.ok(
    bibleText.includes('The Old Testament'),
    'Expected the Old Testament heading to be included.',
  );

  assert.ok(
    bibleText.includes('The First Book of Moses: Called Genesis'),
    'Expected the Genesis heading to be included.',
  );

  // The Gutenberg markers should not be part of the returned text.
  assert.ok(
    !bibleText.includes('*** START OF THE PROJECT GUTENBERG EBOOK'),
    'The start marker should be excluded.',
  );

  assert.ok(
    !bibleText.includes('*** END OF THE PROJECT GUTENBERG EBOOK'),
    'The end marker should be excluded.',
  );

    assert.ok(
    bibleText.startsWith('The Old Testament of the King James Version of the Bible'),
    'Expected the extracted text to start with the actual Old Testament heading.',
  );

  assert.ok(
    bibleText.includes('1:1 In the beginning God created the heaven and the earth.'),
    'Expected Genesis 1:1 to be included.',
  );

  assert.ok(
    !bibleText.includes('The Project Gutenberg eBook of The King James Version of the Bible'),
    'Expected the Gutenberg introduction to be excluded.',
  );

  console.log('All extraction tests passed!');
}

/**
 * Tests that source book headings map to canonical Bible book names.
 */
function testCanonicalBookNames(): void {
  assert.equal(
    getCanonicalBookName('The First Book of Moses: Called Genesis'),
    'Genesis'
  );

  assert.equal(
    getCanonicalBookName('The First Book of Samuel'),
    '1 Samuel'
  );

  assert.equal(
    getCanonicalBookName('The Gospel According to Saint Matthew'),
    'Matthew'
  );

  assert.equal(
    getCanonicalBookName('The Revelation of Saint John the Divine'),
    'Revelation'
  );

  assert.equal(
    getCanonicalBookName('This Is Not a Bible Book'),
    null
  );

  console.log('All canonical book name tests passed!');
}


/**
 * Tests parsing the Bible into individual verse records.
 */

/**
 * Tests parsing the Bible into individual verse records.
 */
function testParseBible(): void {
  const verses = parseBible('data/bible/kjv.txt');
  // const bibleText = extractBibleText('data/bible/kjv.txt');
  // const markerMatches = bibleText.match(/\b\d+:\d+\s+/g);

  // console.log('Markers in extracted Bible text:', markerMatches?.length ?? 0);
  // console.log('Parsed verses:', verses.length);

  const verseCounts: Record<string, number> = {};

  for (const verse of verses) {
    const currentCount = verseCounts[verse.book] ?? 0;
    verseCounts[verse.book] = currentCount + 1;
  }

  console.log('Total parsed verses:', verses.length);
  console.log('Books found:', Object.keys(verseCounts).length);
  console.log('Verse counts by book:');

  for (const book of Object.keys(verseCounts)) {
    console.log(`${book}: ${verseCounts[book]}`);
  }

  assert.equal(verses.length, 31102);

  const genesisOneOne = verses.find(
    (verse) =>
      verse.book === 'Genesis' &&
      verse.chapter === 1 &&
      verse.verse === 1
  );

  assert.ok(genesisOneOne);
  assert.equal(
    genesisOneOne.text,
    'In the beginning God created the heaven and the earth.'
  );

  const markOneFourteen = verses.find(
    (verse) =>
      verse.book === 'Mark' &&
      verse.chapter === 1 &&
      verse.verse === 14
  );

  assert.ok(markOneFourteen);
  assert.ok(
    markOneFourteen.text.includes(
      'preaching the gospel of the kingdom of God,'
    )
  );

  const markOneFifteen = verses.find(
    (verse) =>
      verse.book === 'Mark' &&
      verse.chapter === 1 &&
      verse.verse === 15
  );

  assert.ok(markOneFifteen);
  assert.ok(
    markOneFifteen.text.startsWith('And saying, The time')
  );

  console.log('Bible parsing content tests passed!');
}

testExtractBibleText();
testCanonicalBookNames();
testParseBible();