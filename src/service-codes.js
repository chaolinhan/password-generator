var SERVICE_CODES_KEY = 'savedServiceCodes';
var SERVICE_CODES_MAX = 50;

/**
 * Migrate old string-array format to object-array format.
 * ["github","gmail"] -> [{code:"github",settings:null},{code:"gmail",settings:null}]
 */
function migrateServiceCodes(data) {
  var needsMigration = false;
  var result = data.map(function (item) {
    if (typeof item === 'string') {
      needsMigration = true;
      return { code: item, settings: null };
    }
    return item;
  });
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
  codes.unshift({ code: code, settings: settings || null });
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
  var imported = migrateServiceCodes(data.serviceCodes).data;
  var existing = getSavedServiceCodes();
  var merged = [];
  var seen = {};
  for (var i = 0; i < imported.length; i++) {
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
