var SERVICE_CODES_KEY = 'savedServiceCodes';
var SERVICE_CODES_MAX = 50;
var SERVICE_CODE_IMPORT_MAX_LENGTH = 256;

function normalizeServiceCodeSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return null;
  }

  var length = parseInt(settings.length, 10);
  var wordCount = parseInt(settings.wordCount, 10);
  var separators = ['-', '.', ' ', '_'];

  if (isNaN(length)) length = 16;
  if (isNaN(wordCount)) wordCount = 5;

  return {
    mode: settings.mode === 'passphrase' ? 'passphrase' : 'password',
    length: Math.min(20, Math.max(10, length)),
    punctuation: settings.punctuation !== false,
    caseSensitive: settings.caseSensitive !== false,
    version: String(settings.version) === '1' ? '1' : '2',
    wordCount: Math.min(8, Math.max(4, wordCount)),
    separator: separators.indexOf(settings.separator) !== -1 ? settings.separator : '-'
  };
}

function normalizeServiceCodeEntry(item, imported) {
  var code;
  var settings = null;

  if (typeof item === 'string') {
    code = item;
  } else if (item && typeof item === 'object' && !Array.isArray(item)) {
    code = item.code;
    settings = normalizeServiceCodeSettings(item.settings);
  }

  if (typeof code !== 'string') return null;
  code = code.trim();
  if (!code) return null;
  if (imported && code.length > SERVICE_CODE_IMPORT_MAX_LENGTH) return null;

  return { code: code, settings: settings };
}

/**
 * Migrate old string-array format to object-array format.
 * ["github","gmail"] -> [{code:"github",settings:null},{code:"gmail",settings:null}]
 */
function migrateServiceCodes(data, imported) {
  var needsMigration = false;
  var result = [];

  for (var i = 0; i < data.length; i++) {
    var normalized = normalizeServiceCodeEntry(data[i], imported);
    if (!normalized) {
      needsMigration = true;
      continue;
    }
    if (typeof data[i] === 'string') needsMigration = true;
    result.push(normalized);
    if (imported && result.length >= SERVICE_CODES_MAX) break;
  }

  return { data: result, migrated: needsMigration };
}

function getSavedServiceCodes() {
  try {
    var raw = localStorage.getItem(SERVICE_CODES_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    var result = migrateServiceCodes(parsed);
    if (result.migrated) {
      localStorage.setItem(SERVICE_CODES_KEY, JSON.stringify(result.data));
    }
    return result.data;
  } catch (e) {
    return [];
  }
}

function getServiceCodeNames() {
  return getSavedServiceCodes().map(function (entry) {
    return entry.code;
  });
}

function saveServiceCode(code, settings) {
  if (!code || typeof code !== 'string') return;
  code = code.trim();
  if (!code) return;
  var codes = getSavedServiceCodes();
  codes = codes.filter(function (entry) { return entry.code !== code; });
  codes.unshift({
    code: code,
    settings: normalizeServiceCodeSettings(settings)
  });
  if (codes.length > SERVICE_CODES_MAX) {
    codes = codes.slice(0, SERVICE_CODES_MAX);
  }
  localStorage.setItem(SERVICE_CODES_KEY, JSON.stringify(codes));
}

function getServiceCodeSettings(code) {
  var codes = getSavedServiceCodes();
  for (var i = 0; i < codes.length; i++) {
    if (codes[i].code === code) {
      return codes[i].settings;
    }
  }
  return null;
}

function deleteServiceCode(code) {
  var codes = getSavedServiceCodes();
  codes = codes.filter(function (entry) { return entry.code !== code; });
  localStorage.setItem(SERVICE_CODES_KEY, JSON.stringify(codes));
}

function exportServiceCodes() {
  var codes = getSavedServiceCodes();
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    serviceCodes: codes
  }, null, 2);
}

function importServiceCodes(jsonString) {
  var data = JSON.parse(jsonString);
  if (!data || !Array.isArray(data.serviceCodes)) {
    throw new Error('Invalid import format');
  }
  var imported = migrateServiceCodes(data.serviceCodes, true).data;
  var existing = getSavedServiceCodes();
  var merged = [];
  var seen = Object.create(null);
  for (var i = 0; i < imported.length; i++) {
    if (seen[imported[i].code]) continue;
    merged.push(imported[i]);
    seen[imported[i].code] = true;
  }
  for (var i = 0; i < existing.length; i++) {
    if (!seen[existing[i].code]) {
      merged.push(existing[i]);
    }
  }
  if (merged.length > SERVICE_CODES_MAX) {
    merged = merged.slice(0, SERVICE_CODES_MAX);
  }
  localStorage.setItem(SERVICE_CODES_KEY, JSON.stringify(merged));
  return { imported: imported.length, total: merged.length };
}
