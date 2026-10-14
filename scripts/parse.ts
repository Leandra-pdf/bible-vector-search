/**
 * Parses the King James Bible text into structured verses.
 * This file will contain helpers for extracting the Bible text,
 * recognizing book names, and parsing individual verses.
 * The parsed verses will later be used for chunking and semantic search.
 */


import * as fs from 'node:fs';

const START_MARKER =
  '*** START OF THE PROJECT GUTENBERG EBOOK THE KING JAMES VERSION OF THE BIBLE ***';

const END_MARKER =
  '*** END OF THE PROJECT GUTENBERG EBOOK THE KING JAMES VERSION OF THE BIBLE ***';

const OLD_TESTAMENT_HEADING =
  'The Old Testament of the King James Version of the Bible';

const NEW_TESTAMENT_HEADING =
  'The New Testament of the King James Bible';


const BOOK_NAME_MAP: Record<string, string> = {
  // Old Testament
  'The First Book of Moses: Called Genesis': 'Genesis',
  'The Second Book of Moses: Called Exodus': 'Exodus',
  'The Third Book of Moses: Called Leviticus': 'Leviticus',
  'The Fourth Book of Moses: Called Numbers': 'Numbers',
  'The Fifth Book of Moses: Called Deuteronomy': 'Deuteronomy',
  'The Book of Joshua': 'Joshua',
  'The Book of Judges': 'Judges',
  'The Book of Ruth': 'Ruth',
  'The First Book of Samuel': '1 Samuel',
  'The Second Book of Samuel': '2 Samuel',
  'The First Book of the Chronicles': '1 Chronicles',
  'The Second Book of the Chronicles': '2 Chronicles',
  'Ezra': 'Ezra',
  'The Book of Nehemiah': 'Nehemiah',
  'The Book of Esther': 'Esther',
  'The Book of Job': 'Job',
  'The Book of Psalms': 'Psalms',
  'The Proverbs': 'Proverbs',
  'Ecclesiastes': 'Ecclesiastes',
  'The Song of Solomon': 'Song of Solomon',
  'The Book of the Prophet Isaiah': 'Isaiah',
  'The Book of the Prophet Jeremiah': 'Jeremiah',
  'The Lamentations of Jeremiah': 'Lamentations',
  'The Book of the Prophet Ezekiel': 'Ezekiel',
  'The Book of Daniel': 'Daniel',
  'Hosea': 'Hosea',
  'Joel': 'Joel',
  'Amos': 'Amos',
  'Obadiah': 'Obadiah',
  'Jonah': 'Jonah',
  'Micah': 'Micah',
  'Nahum': 'Nahum',
  'Habakkuk': 'Habakkuk',
  'Zephaniah': 'Zephaniah',
  'Haggai': 'Haggai',
  'Zechariah': 'Zechariah',
  'Malachi': 'Malachi',

  // New Testament
  'The Gospel According to Saint Matthew': 'Matthew',
  'The Gospel According to Saint Mark': 'Mark',
  'The Gospel According to Saint Luke': 'Luke',
  'The Gospel According to Saint John': 'John',
  'The Acts of the Apostles': 'Acts',
  'The Epistle of Paul the Apostle to the Romans': 'Romans',
  'The First Epistle of Paul the Apostle to the Corinthians':
    '1 Corinthians',
  'The Second Epistle of Paul the Apostle to the Corinthians':
    '2 Corinthians',
  'The Epistle of Paul the Apostle to the Galatians': 'Galatians',
  'The Epistle of Paul the Apostle to the Ephesians': 'Ephesians',
  'The Epistle of Paul the Apostle to the Philippians': 'Philippians',
  'The Epistle of Paul the Apostle to the Colossians': 'Colossians',
  'The First Epistle of Paul the Apostle to the Thessalonians':
    '1 Thessalonians',
  'The Second Epistle of Paul the Apostle to the Thessalonians':
    '2 Thessalonians',
  'The First Epistle of Paul the Apostle to Timothy': '1 Timothy',
  'The Second Epistle of Paul the Apostle to Timothy': '2 Timothy',
  'The Epistle of Paul the Apostle to Titus': 'Titus',
  'The Epistle of Paul the Apostle to Philemon': 'Philemon',
  'The Epistle of Paul the Apostle to the Hebrews': 'Hebrews',
  'The General Epistle of James': 'James',
  'The First Epistle General of Peter': '1 Peter',
  'The Second General Epistle of Peter': '2 Peter',
  'The First Epistle General of John': '1 John',
  'The Second Epistle General of John': '2 John',
  'The Third Epistle General of John': '3 John',
  'The General Epistle of Jude': 'Jude',
  'The Revelation of Saint John the Divine': 'Revelation',

  // Alternate headings in the source
  'The Fourth Book of the Kings': '2 Kings',
  'The Third Book of the Kings': '1 Kings',
  'The Preacher': 'Ecclesiastes',
  'The First Book of the Kings': '1 Samuel',
  'The Second Book of the Kings': '2 Samuel',
};


/**
 * Represents one Bible verse with its canonical book name and reference.
 */
export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Converts a source book heading into its standard Bible book name.
 *
 * @param heading - A book heading from the Gutenberg Bible text.
 * @returns The canonical book name, or null if the heading is unrecognized.
 */
export function getCanonicalBookName(heading: string): string | null {
  const cleanedHeading = heading.trim();
  const bookName = BOOK_NAME_MAP[cleanedHeading];

  if (bookName === undefined) {
    return null;
  }

  return bookName;
}

/**
 * Extracts the actual Bible content, skipping the Gutenberg introduction
 * and table of contents and excluding the credits after the Bible.
 *
 * @param filePath - Path to the local Bible text file.
 * @returns The Bible text without the introduction, table of contents, or credits.
 * @throws Error if a required marker or the actual Bible section is missing.
 */
export function extractBibleText(filePath: string): string {
  const fileText = fs.readFileSync(filePath, 'utf-8');

  const startIndex = fileText.indexOf(START_MARKER);

  if (startIndex === -1) {
    throw new Error('Could not find the start of the Gutenberg text.');
  }

  const bibleStart = fileText.indexOf(
    OLD_TESTAMENT_HEADING,
    startIndex + START_MARKER.length,
  );

  if (bibleStart === -1) {
    throw new Error('Could not find the actual Bible section.');
  }

  // Find the second occurrence, which marks the actual Old Testament.
  const actualBibleStart = fileText.indexOf(
    OLD_TESTAMENT_HEADING,
    bibleStart + OLD_TESTAMENT_HEADING.length,
  );

  if (actualBibleStart === -1) {
    throw new Error('Could not find the start of the actual Bible text.');
  }

  const endIndex = fileText.indexOf(END_MARKER, actualBibleStart);

  if (endIndex === -1) {
    throw new Error('Could not find the end of the Bible text.');
  }

  return fileText.slice(actualBibleStart, endIndex).trim();
}


/**
 * Parses the extracted Bible text into individual, structured verses.
 *
 * Book headings identify the current book. Verse markers identify where
 * each verse starts, while additional physical lines are joined to the
 * verse they belong to.
 *
 * @param filePath - Path to the Gutenberg Bible text file.
 * @returns An array of parsed Bible verses.
 */
export function parseBible(filePath: string): BibleVerse[] {
  const bibleText = extractBibleText(filePath);
  const lines = bibleText.split(/\r?\n/);

  const verses: BibleVerse[] = [];

  let currentBook: string | null = null;
  let currentVerse: BibleVerse | null = null;

  for (const line of lines) {
    const cleanedLine = line.trim();

    if (cleanedLine.length === 0) {
      continue;
    }

    const bookName = getCanonicalBookName(cleanedLine);

    if (bookName !== null) {
      if (currentVerse !== null) {
        verses.push(currentVerse);
        currentVerse = null;
      }

      currentBook = bookName;
      continue;
    }

    if (currentBook === null) {
      continue;
    }

    const verseMarkerRegex = /\b(\d+):(\d+)(?:\s+|$)/g;
    let match: RegExpExecArray | null;
    let lastPosition = 0;

    while ((match = verseMarkerRegex.exec(cleanedLine)) !== null) {
      const textBeforeMarker = cleanedLine
        .slice(lastPosition, match.index)
        .trim();

      if (currentVerse !== null && textBeforeMarker.length > 0) {
        currentVerse.text += ` ${textBeforeMarker}`;
      }

      if (currentVerse !== null) {
        verses.push(currentVerse);
      }

      currentVerse = {
        book: currentBook,
        chapter: Number(match[1]),
        verse: Number(match[2]),
        text: cleanedLine.slice(
          verseMarkerRegex.lastIndex
        ).trim(),
      };

      lastPosition = verseMarkerRegex.lastIndex;
    }

    if (currentVerse !== null && lastPosition === 0) {
      currentVerse.text += ` ${cleanedLine}`;
    }
  }

  if (currentVerse !== null) {
    verses.push(currentVerse);
  }

  return verses;
}
