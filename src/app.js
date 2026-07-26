// 密码强度阈值
var QUALITY_THRESHOLDS = { WEAK: 64, FAIR: 80, STRONG: 112, MAX: 120 };

// 字符集（用于着色分类）
var CHAR_SETS = {
  punct: ',.:;!?~!@#$%^&*()-_=+',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789'
};

var copyResetTimer = null;
var deferredInstallPrompt = null;
var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
  navigator.standalone === true;

// === 主题与语言 ===

function updateThemeIcon() {
  var theme = document.documentElement.getAttribute('data-bs-theme');
  var icon = document.querySelector('#btn-theme-toggle i');
  icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

function updateThemeColor(theme) {
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#101714' : '#f1f0e9';
}

document.getElementById('btn-theme-toggle').addEventListener('click', function () {
  var current = document.documentElement.getAttribute('data-bs-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-bs-theme', next);
  localStorage.setItem('theme', next);
  updateThemeColor(next);
  updateThemeIcon();
});

function updateDynamicLanguage() {
  var currentPassword = document.getElementById('code').value;
  updateConnectionStatus();
  updateInstallUi();
  if (!currentPassword) {
    renderPassword('');
  } else {
    updateStrengthMeter(PasswordQualityCalculator(currentPassword));
  }
}

document.getElementById('btn-lang-toggle').addEventListener('click', function () {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
  updateDynamicLanguage();
});

translatePage();
updateThemeIcon();

// === 复制 ===

function resetCopyButton() {
  var copyBtn = document.getElementById('btn_copy');
  copyBtn.innerHTML = '<i class="bi bi-copy" aria-hidden="true"></i>';
  copyBtn.classList.remove('copy-success', 'copy-fail');
}

function showCopyFeedback() {
  var copyBtn = document.getElementById('btn_copy');
  copyBtn.innerHTML = '<i class="bi bi-check-lg" aria-hidden="true"></i>';
  copyBtn.classList.remove('copy-fail');
  copyBtn.classList.add('copy-success');
  if (copyResetTimer) clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(resetCopyButton, 2000);
}

function showCopyFailFeedback() {
  var copyBtn = document.getElementById('btn_copy');
  copyBtn.innerHTML = '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>';
  copyBtn.classList.remove('copy-success');
  copyBtn.classList.add('copy-fail');
  if (copyResetTimer) clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(resetCopyButton, 2000);
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise(function (resolve, reject) {
    var textarea = document.createElement('textarea');
    var copied = false;
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(textarea);
    if (copied) resolve();
    else reject(new Error('Copy unavailable'));
  });
}

function copyCurrentPassword() {
  var password = document.getElementById('code').value;
  if (!password) return;
  copyText(password).then(showCopyFeedback).catch(showCopyFailFeedback);
}

document.getElementById('btn_copy').addEventListener('click', copyCurrentPassword);

document.getElementById('password-display').addEventListener('click', function (event) {
  if (event.target.closest('.btn-copy-inline')) return;
  copyCurrentPassword();
});

// === 输入与结果 ===

function triggerGenerationOnEnter(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('btn_gencode').click();
  }
}

document.getElementById('pwd').addEventListener('keydown', triggerGenerationOnEnter);
document.getElementById('key').addEventListener('keydown', triggerGenerationOnEnter);

document.querySelectorAll('#pwd, #key').forEach(function (input) {
  input.addEventListener('input', function () {
    this.classList.remove('is-invalid');
  });
});

function renderPassword(password) {
  var container = document.getElementById('password-chars');
  container.innerHTML = '';

  if (!password) {
    var placeholder = document.createElement('span');
    placeholder.className = 'password-placeholder';
    placeholder.setAttribute('data-i18n', 'password.placeholder');
    placeholder.textContent = t('password.placeholder');
    container.appendChild(placeholder);
    return;
  }

  for (var i = 0; i < password.length; i++) {
    var span = document.createElement('span');
    span.textContent = password[i];
    span.className = 'char';
    if (CHAR_SETS.digit.indexOf(password[i]) !== -1) span.classList.add('char-digit');
    else if (CHAR_SETS.upper.indexOf(password[i]) !== -1) span.classList.add('char-upper');
    else if (CHAR_SETS.punct.indexOf(password[i]) !== -1) span.classList.add('char-symbol');
    else span.classList.add('char-lower');
    span.style.animationDelay = (i * 0.028) + 's';
    container.appendChild(span);
  }
}

function updateStrengthMeter(quality) {
  var meter = document.getElementById('strength-meter');
  var label = document.getElementById('strength-text');
  var level = 0;
  var text = '';

  if (quality > QUALITY_THRESHOLDS.STRONG) {
    level = 4;
    text = t('strength.veryStrong');
  } else if (quality > QUALITY_THRESHOLDS.FAIR) {
    level = 3;
    text = t('strength.strong');
  } else if (quality > QUALITY_THRESHOLDS.WEAK) {
    level = 2;
    text = t('strength.weak');
  } else if (quality > 0) {
    level = 1;
    text = t('strength.veryWeak');
  }

  meter.setAttribute('data-strength', level);
  label.textContent = text;
}

document.getElementById('pwd_length').addEventListener('input', function () {
  document.getElementById('pwd_length_display').textContent = this.value;
});

document.getElementById('word_count').addEventListener('input', function () {
  document.getElementById('word_count_display').textContent = this.value;
});

function updateOutputMode() {
  var modeRadio = document.querySelector('input[name="output_mode"]:checked');
  var isPassphrase = modeRadio && modeRadio.value === 'passphrase';
  document.getElementById('passphraseOptions').style.display = isPassphrase ? '' : 'none';
  document.getElementById('passwordOptions').style.display = isPassphrase ? 'none' : '';
}

document.querySelectorAll('input[name="output_mode"]').forEach(function (radio) {
  radio.addEventListener('change', updateOutputMode);
});

function setGenerateButtonLoading(isLoading) {
  var button = document.getElementById('btn_gencode');
  button.disabled = isLoading;
  if (isLoading) {
    button.innerHTML =
      '<span>' + t('password.generating') + '</span>' +
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
  } else {
    button.innerHTML =
      '<span data-i18n="password.generate">' + t('password.generate') + '</span>' +
      '<i class="bi bi-arrow-right" aria-hidden="true"></i>';
  }
}

document.getElementById('btn_gencode').addEventListener('click', async function () {
  var inputPwd = document.getElementById('pwd');
  var inputKey = document.getElementById('key');
  var errorsElement = document.getElementById('form-errors');
  var errors = [];

  inputPwd.classList.remove('is-invalid');
  inputKey.classList.remove('is-invalid');

  if (inputPwd.value.length === 0) {
    inputPwd.classList.add('is-invalid');
    errors.push(t('input.masterPassword.error'));
  }
  if (inputKey.value.trim().length === 0) {
    inputKey.classList.add('is-invalid');
    errors.push(t('input.serviceCode.error'));
  }

  if (errors.length > 0) {
    errorsElement.textContent = errors.join(t('error.join'));
    document.querySelector('.form-control.is-invalid').focus();
    return;
  }

  errorsElement.textContent = '';
  setGenerateButtonLoading(true);

  try {
    var generatedPassword = await generate_password();
    if (!generatedPassword) return;

    document.getElementById('code').value = generatedPassword;
    renderPassword(generatedPassword);
    updateStrengthMeter(PasswordQualityCalculator(generatedPassword));

    var serviceCodeValue = inputKey.value.trim();
    var modeRadio = document.querySelector('input[name="output_mode"]:checked');
    var currentSettings = {
      mode: modeRadio ? modeRadio.value : 'password',
      length: parseInt(document.getElementById('pwd_length').value, 10),
      punctuation: document.getElementById('rule_of_punctuation').checked,
      caseSensitive: document.getElementById('rule_of_letter').checked,
      version: document.getElementById('algorithm_version').value,
      wordCount: parseInt(document.getElementById('word_count').value, 10),
      separator: document.getElementById('separator').value
    };
    saveServiceCode(serviceCodeValue, currentSettings);
    copyText(generatedPassword).then(showCopyFeedback).catch(showCopyFailFeedback);
  } catch (error) {
    errorsElement.textContent = t('error.generate');
  } finally {
    setGenerateButtonLoading(false);
  }
});

document.getElementById('btn-toggle-pwd').addEventListener('click', function () {
  var input = document.getElementById('pwd');
  var icon = this.querySelector('i');
  var showPassword = input.type === 'password';
  input.type = showPassword ? 'text' : 'password';
  icon.className = showPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
  this.setAttribute('aria-label', t(showPassword ? 'aria.hidePassword' : 'aria.showPassword'));
});

document.addEventListener('visibilitychange', function () {
  if (!document.hidden) return;
  document.getElementById('code').value = '';
  renderPassword('');
  updateStrengthMeter(0);
  resetCopyButton();
});

// === 服务代码管理 ===

function applyServiceCodeSettings(settings) {
  if (!settings) return;

  var advancedPanel = document.getElementById('advancedOptions');
  if (!advancedPanel.classList.contains('show')) {
    new bootstrap.Collapse(advancedPanel, { toggle: true });
  }

  if (settings.mode) {
    var radioId = settings.mode === 'passphrase' ? 'mode_passphrase' : 'mode_password';
    var radio = document.getElementById(radioId);
    if (radio) radio.checked = true;
    updateOutputMode();
  }
  if (settings.length) {
    document.getElementById('pwd_length').value = settings.length;
    document.getElementById('pwd_length_display').textContent = settings.length;
  }
  if (settings.punctuation !== undefined) {
    document.getElementById('rule_of_punctuation').checked = settings.punctuation;
  }
  if (settings.caseSensitive !== undefined) {
    document.getElementById('rule_of_letter').checked = settings.caseSensitive;
  }
  if (settings.version) {
    document.getElementById('algorithm_version').value = settings.version;
  }
  if (settings.wordCount) {
    document.getElementById('word_count').value = settings.wordCount;
    document.getElementById('word_count_display').textContent = settings.wordCount;
  }
  if (settings.separator !== undefined) {
    document.getElementById('separator').value = settings.separator;
  }
}

function closeServiceCodeDropdown() {
  var dropdown = document.getElementById('service-code-dropdown');
  dropdown.classList.remove('show');
  document.getElementById('key').setAttribute('aria-expanded', 'false');
}

function useServiceCode(entry) {
  var input = document.getElementById('key');
  input.value = entry.code;
  input.classList.remove('is-invalid');
  applyServiceCodeSettings(entry.settings);
  closeServiceCodeDropdown();
}

function renderServiceCodeDropdown(filter) {
  var dropdown = document.getElementById('service-code-dropdown');
  var codes = getSavedServiceCodes();

  if (filter) {
    var lower = filter.toLowerCase();
    codes = codes.filter(function (entry) {
      return entry.code.toLowerCase().indexOf(lower) !== -1;
    });
  }

  dropdown.innerHTML = '';
  if (codes.length === 0) {
    closeServiceCodeDropdown();
    return;
  }

  codes.forEach(function (entry) {
    var item = document.createElement('div');
    var useButton = document.createElement('button');
    var textSpan = document.createElement('span');
    var deleteButton = document.createElement('button');

    item.className = 'service-code-item';
    item.setAttribute('role', 'listitem');

    useButton.type = 'button';
    useButton.className = 'btn-use-code';
    useButton.setAttribute('aria-label', t('serviceCode.use').replace('{code}', entry.code));

    textSpan.className = 'code-text';
    textSpan.textContent = entry.code;
    useButton.appendChild(textSpan);

    if (entry.settings) {
      var badge = document.createElement('i');
      badge.className = 'bi bi-sliders2-vertical settings-badge';
      badge.setAttribute('aria-hidden', 'true');
      useButton.appendChild(badge);
    }

    useButton.addEventListener('click', function () {
      useServiceCode(entry);
    });

    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete-code';
    deleteButton.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
    deleteButton.setAttribute('aria-label', t('serviceCode.delete') + ' ' + entry.code);
    deleteButton.addEventListener('click', function () {
      deleteServiceCode(entry.code);
      renderServiceCodeDropdown(document.getElementById('key').value);
    });

    item.appendChild(useButton);
    item.appendChild(deleteButton);
    dropdown.appendChild(item);
  });

  dropdown.classList.add('show');
  document.getElementById('key').setAttribute('aria-expanded', 'true');
}

document.getElementById('key').addEventListener('focus', function () {
  renderServiceCodeDropdown(this.value);
});

document.getElementById('key').addEventListener('input', function () {
  renderServiceCodeDropdown(this.value);
});

document.getElementById('key').addEventListener('keydown', function (event) {
  var firstSavedCode = document.querySelector('.btn-use-code');
  if (event.key === 'Escape') {
    closeServiceCodeDropdown();
  } else if (event.key === 'ArrowDown' && firstSavedCode) {
    event.preventDefault();
    firstSavedCode.focus();
  }
});

document.addEventListener('click', function (event) {
  var wrapper = document.querySelector('.service-code-wrapper');
  if (wrapper && !wrapper.contains(event.target)) closeServiceCodeDropdown();
});

// === 数据导入导出 ===

document.getElementById('btn-export').addEventListener('click', function () {
  var json = exportServiceCodes();
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'password-generator-backup.json';
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 0);
});

document.getElementById('btn-import').addEventListener('click', function () {
  document.getElementById('import-file-input').click();
});

document.getElementById('import-file-input').addEventListener('change', function (event) {
  var file = event.target.files[0];
  var feedback = document.getElementById('import-feedback');
  if (!file) return;

  if (file.size > 1024 * 1024) {
    feedback.textContent = t('data.importError');
    feedback.className = 'import-feedback show error';
    event.target.value = '';
    return;
  }

  var reader = new FileReader();
  reader.onload = function (readerEvent) {
    try {
      var result = importServiceCodes(readerEvent.target.result);
      feedback.textContent = t('data.importSuccess').replace('{count}', result.imported);
      feedback.className = 'import-feedback show success';
    } catch (error) {
      feedback.textContent = t('data.importError');
      feedback.className = 'import-feedback show error';
    }
    setTimeout(function () { feedback.className = 'import-feedback'; }, 3000);
  };
  reader.readAsText(file);
  event.target.value = '';
});

// === 安装与网络状态 ===

function updateConnectionStatus() {
  var status = document.getElementById('connection-status');
  var label = status.querySelector('[data-i18n]');
  var online = navigator.onLine;
  status.classList.toggle('is-offline', !online);
  label.setAttribute('data-i18n', online ? 'status.online' : 'status.offline');
  label.textContent = t(online ? 'status.online' : 'status.offline');
}

function updateInstallUi() {
  var installButton = document.getElementById('btn-install');
  var installHint = document.getElementById('install-hint');

  if (isStandalone) {
    installButton.hidden = true;
    installHint.textContent = '';
    return;
  }

  installButton.hidden = !(deferredInstallPrompt || isIos);
  if (!installButton.hidden && isIos) {
    installHint.textContent = t('install.iosHint');
  } else {
    installHint.textContent = '';
  }
}

window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUi();
});

document.getElementById('btn-install').addEventListener('click', function () {
  var installHint = document.getElementById('install-hint');
  if (isIos) {
    installHint.textContent = t('install.iosHint');
    return;
  }
  if (!deferredInstallPrompt) {
    installHint.textContent = t('install.unavailable');
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(function () {
    deferredInstallPrompt = null;
    updateInstallUi();
  });
});

window.addEventListener('appinstalled', function () {
  isStandalone = true;
  document.getElementById('install-hint').textContent = t('install.success');
  document.getElementById('btn-install').hidden = true;
});

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// 注册 Service Worker + 更新通知
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { scope: './' });
  navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'SW_UPDATED' && confirm(t('sw.updatePrompt'))) {
      window.location.reload();
    }
  });
}

updateOutputMode();
updateConnectionStatus();
updateInstallUi();
