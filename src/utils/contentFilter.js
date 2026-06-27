/**
 * Content filter to detect phone numbers, URLs, emails, and social media handles.
 * Reusable for any text input (chat, bio, name, etc.)
 */

const NUMBER_WORDS = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
};

const MULTIPLIERS = { double: 2, triple: 3, quadruple: 4, quad: 4 };

const LOOKALIKE_MAP = {
  o: '0', O: '0',
  i: '1', I: '1', l: '1', '|': '1',
  s: '5', S: '5', $: '5',
  b: '8', B: '8',
  g: '6', G: '6',
  t: '7', T: '7',
  q: '9', Q: '9',
};

const SOCIAL_KEYWORDS = [
  'whatsapp', 'wa', 'telegram', 'tg', 'instagram', 'insta',
  'snapchat', 'snap', 'facebook', 'fb', 'discord', 'signal',
  'wechat', 'line', 'viber',
];

// Normalize unicode fullwidth digits (０-９) to ASCII
function normalizeUnicode(text) {
  return text.replace(/[\uff10-\uff19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfef0));
}

// Replace emoji digits (0️⃣ - 9️⃣)
function replaceEmojiDigits(text) {
  return text.replace(/(\d)\ufe0f?\u20e3/g, '$1');
}

// Replace number words with digits
function replaceNumberWords(text) {
  let result = text;
  // Handle multiplier + word: "double five" -> "55", "triple one" -> "111"
  for (const [mult, count] of Object.entries(MULTIPLIERS)) {
    for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
      const regex = new RegExp(`${mult}\\s*${word}`, 'gi');
      result = result.replace(regex, digit.repeat(count));
    }
    // Handle multiplier + digit: "triple 1" -> "111"
    const digitRegex = new RegExp(`${mult}\\s*(\\d)`, 'gi');
    result = result.replace(digitRegex, (_, d) => d.repeat(count));
  }
  // Replace standalone number words
  for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  return result;
}

// Replace look-alike characters with digits (only in suspicious contexts)
function replaceLookalikes(text) {
  let result = '';
  for (const ch of text) {
    result += LOOKALIKE_MAP[ch] || ch;
  }
  return result;
}

// Remove common separators
function removeSeparators(text) {
  return text.replace(/[\s\-_.,/\\()[\]{}|+*#]+/g, '');
}

/**
 * Detects if text contains a phone number (7+ consecutive digits after normalization)
 */
function containsPhoneNumber(text) {
  // Step 1: Direct regex on original text
  const directPattern = /(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,4}\)?[\s\-]?)?\d{3,4}[\s\-]?\d{3,4}/;
  if (directPattern.test(text)) return true;

  // Step 2: Normalization pipeline
  let normalized = text.toLowerCase();
  normalized = normalizeUnicode(normalized);
  normalized = replaceEmojiDigits(normalized);
  normalized = replaceNumberWords(normalized);
  normalized = replaceLookalikes(normalized);
  normalized = removeSeparators(normalized);

  // Check for 7+ consecutive digits
  return /\d{7,}/.test(normalized);
}

/**
 * Detects URLs
 */
function containsURL(text) {
  const urlPattern = /\b(?:https?:\/\/|www\.)\S+/i;
  const domainPattern = /\b(?:wa\.me|t\.me|telegram\.me|discord\.gg|bit\.ly)\b/i;
  return urlPattern.test(text) || domainPattern.test(text);
}

/**
 * Detects email addresses
 */
function containsEmail(text) {
  return /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/.test(text);
}

/**
 * Detects social media usernames/handles
 */
function containsSocialMedia(text) {
  const lower = text.toLowerCase();
  for (const keyword of SOCIAL_KEYWORDS) {
    // Match patterns like "insta: john", "telegram - user123", "my wa 9876"
    const pattern = new RegExp(`\\b${keyword}\\b\\s*[:\\-]?\\s*\\S+`, 'i');
    if (pattern.test(lower)) return true;
  }
  return false;
}

/**
 * Main filter function. Returns { safe: boolean, reason?: string }
 * Use this for any user input that should not contain contact info.
 */
function filterContent(text) {
  if (!text || typeof text !== 'string') return { safe: true };

  if (containsPhoneNumber(text)) {
    return { safe: false, reason: 'Sharing phone numbers is not allowed.' };
  }
  if (containsURL(text)) {
    return { safe: false, reason: 'Sharing URLs or links is not allowed.' };
  }
  if (containsEmail(text)) {
    return { safe: false, reason: 'Sharing email addresses is not allowed.' };
  }
  if (containsSocialMedia(text)) {
    return { safe: false, reason: 'Sharing social media handles is not allowed.' };
  }

  return { safe: true };
}

module.exports = { filterContent, containsPhoneNumber, containsURL, containsEmail, containsSocialMedia };
