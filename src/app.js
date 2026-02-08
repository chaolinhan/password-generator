// 密码强度阈值
var QUALITY_THRESHOLDS = { WEAK: 64, FAIR: 80, STRONG: 112, MAX: 120 };

// 字符集（用于着色分类）
var CHAR_SETS = {
  punct: ',.:;!?~!@#$%^&*()-_=+',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789'
};

// 主题切换
function updateThemeIcon() {
  var theme = document.documentElement.getAttribute('data-bs-theme');
  var icon = document.querySelector('#btn-theme-toggle i');
  if (theme === 'dark') {
    icon.className = 'bi bi-sun-fill';
  } else {
    icon.className = 'bi bi-moon-fill';
  }
}

document.getElementById('btn-theme-toggle').addEventListener('click', function () {
  var current = document.documentElement.getAttribute('data-bs-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-bs-theme', next);
  localStorage.setItem('theme', next);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = next === 'dark' ? '#000000' : '#f5f5f7';
  updateThemeIcon();
});

updateThemeIcon();

// 语言切换
document.getElementById('btn-lang-toggle').addEventListener('click', function () {
  var next = currentLang === 'zh' ? 'en' : 'zh';
  setLang(next);
  if (!document.getElementById('code').value) {
    renderPassword('');
  }
});

translatePage();

// 复制反馈
var copyResetTimer = null;
function showCopyFeedback() {
  var copyBtn = document.getElementById('btn_copy');
  copyBtn.innerHTML = '<i class="bi bi-check-lg" aria-hidden="true"></i>';
  copyBtn.classList.add('copy-success');
  if (copyResetTimer) clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(function () {
    copyBtn.innerHTML = '<i class="bi bi-clipboard" aria-hidden="true"></i>';
    copyBtn.classList.remove('copy-success');
  }, 2000);
}

function showCopyFailFeedback() {
  var copyBtn = document.getElementById('btn_copy');
  copyBtn.innerHTML = '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>';
  copyBtn.classList.add('copy-fail');
  if (copyResetTimer) clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(function () {
    copyBtn.innerHTML = '<i class="bi bi-clipboard" aria-hidden="true"></i>';
    copyBtn.classList.remove('copy-fail');
  }, 2000);
}

// 复制按钮
document.getElementById('btn_copy').addEventListener('click', function () {
  var pwd = document.getElementById('code').value;
  if (pwd && navigator.clipboard) {
    navigator.clipboard.writeText(pwd).then(showCopyFeedback).catch(showCopyFailFeedback);
  }
});

// 点击密码区域复制
document.getElementById('password-display').addEventListener('click', function (e) {
  if (e.target.closest('.btn-copy-inline')) return;
  var pwd = document.getElementById('code').value;
  if (pwd && navigator.clipboard) {
    navigator.clipboard.writeText(pwd).then(showCopyFeedback).catch(showCopyFailFeedback);
  }
});

// 回车键触发生成
document.getElementById('pwd').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn_gencode').click(); }
});
document.getElementById('key').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn_gencode').click(); }
});

// 密码逐字着色渲染
function renderPassword(pwd) {
  var container = document.getElementById('password-chars');
  container.innerHTML = '';
  if (!pwd) {
    var placeholder = document.createElement('span');
    placeholder.className = 'password-placeholder';
    placeholder.setAttribute('data-i18n', 'password.placeholder');
    placeholder.textContent = t('password.placeholder');
    container.appendChild(placeholder);
    return;
  }
  for (var i = 0; i < pwd.length; i++) {
    var span = document.createElement('span');
    span.textContent = pwd[i];
    span.className = 'char';
    if (CHAR_SETS.digit.indexOf(pwd[i]) !== -1) span.classList.add('char-digit');
    else if (CHAR_SETS.upper.indexOf(pwd[i]) !== -1) span.classList.add('char-upper');
    else if (CHAR_SETS.punct.indexOf(pwd[i]) !== -1) span.classList.add('char-symbol');
    else span.classList.add('char-lower');
    span.style.animationDelay = (i * 0.035) + 's';
    container.appendChild(span);
  }
}

// 分段强度条
function updateStrengthMeter(quality) {
  var meter = document.getElementById('strength-meter');
  var label = document.getElementById('strength-text');
  var level = 0, text = '';
  if (quality > QUALITY_THRESHOLDS.STRONG) { level = 4; text = t('strength.veryStrong'); }
  else if (quality > QUALITY_THRESHOLDS.FAIR) { level = 3; text = t('strength.strong'); }
  else if (quality > QUALITY_THRESHOLDS.WEAK) { level = 2; text = t('strength.weak'); }
  else if (quality > 0) { level = 1; text = t('strength.veryWeak'); }
  meter.setAttribute('data-strength', level);
  label.textContent = text;
}

// Slider 联动
document.getElementById('pwd_length').addEventListener('input', function () {
  document.getElementById('pwd_length_display').textContent = this.value;
});

document.getElementById('word_count').addEventListener('input', function () {
  document.getElementById('word_count_display').textContent = this.value;
});

// 输出模式切换
function updateOutputMode() {
  var modeRadio = document.querySelector('input[name="output_mode"]:checked');
  var isPassphrase = modeRadio && modeRadio.value === 'passphrase';
  document.getElementById('passphraseOptions').style.display = isPassphrase ? '' : 'none';
  document.getElementById('passwordOptions').style.display = isPassphrase ? 'none' : '';
}

document.querySelectorAll('input[name="output_mode"]').forEach(function (radio) {
  radio.addEventListener('change', updateOutputMode);
});

// 生成按钮
document.getElementById('btn_gencode').onclick = async function () {
  var btn = document.getElementById('btn_gencode');

  // 输入校验
  var inputPwd = document.getElementById('pwd');
  var inputKey = document.getElementById('key');
  var errorsEl = document.getElementById('form-errors');
  var errors = [];

  inputPwd.classList.remove('is-invalid');
  inputKey.classList.remove('is-invalid');

  if (inputPwd.value.length === 0) {
    inputPwd.classList.add('is-invalid');
    errors.push(t('input.masterPassword.error'));
  }
  if (inputKey.value.length === 0) {
    inputKey.classList.add('is-invalid');
    errors.push(t('input.serviceCode.error'));
  }

  if (errors.length > 0) {
    errorsEl.textContent = errors.join(t('error.join'));
    return;
  }
  errorsEl.textContent = '';

  // loading 态
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' + t('password.generating');

  try {
    var sk_pwd = await generate_password();
    if (sk_pwd) {
      document.getElementById('code').value = sk_pwd;
      renderPassword(sk_pwd);
      // 保存服务代码和当前设置到历史
      var serviceCodeValue = inputKey.value.trim();
      if (serviceCodeValue) {
        var modeRadio = document.querySelector('input[name="output_mode"]:checked');
        var currentSettings = {
          mode: modeRadio ? modeRadio.value : 'password',
          length: parseInt(document.getElementById('pwd_length').value),
          punctuation: document.getElementById('rule_of_punctuation').checked,
          caseSensitive: document.getElementById('rule_of_letter').checked,
          version: document.getElementById('algorithm_version').value,
          wordCount: parseInt(document.getElementById('word_count').value),
          separator: document.getElementById('separator').value
        };
        saveServiceCode(serviceCodeValue, currentSettings);
      }
      // 自动复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(sk_pwd).then(showCopyFeedback).catch(showCopyFailFeedback);
      }
    }
  } finally {
    btn.disabled = false;
    btn.textContent = t('password.generate');
  }

  // 密码强度
  var quality = PasswordQualityCalculator(
    document.getElementById('code').value
  );
  updateStrengthMeter(quality);
};

// 显示/隐藏密码
document.getElementById('btn-toggle-pwd').addEventListener('click', function () {
  var input = document.getElementById('pwd');
  var icon = this.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
    this.setAttribute('aria-label', t('aria.hidePassword'));
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
    this.setAttribute('aria-label', t('aria.showPassword'));
  }
});

// 页面隐藏时清除敏感值
document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    document.getElementById('code').value = '';
    renderPassword('');
    document.getElementById('strength-meter').setAttribute('data-strength', '0');
    document.getElementById('strength-text').textContent = '';
  }
});

// === 服务代码管理 ===

function applyServiceCodeSettings(settings) {
  if (!settings) return;
  // 展开高级选项面板
  var advPanel = document.getElementById('advancedOptions');
  if (!advPanel.classList.contains('show')) {
    new bootstrap.Collapse(advPanel, { toggle: true });
  }
  // 输出模式
  if (settings.mode) {
    var radioId = settings.mode === 'passphrase' ? 'mode_passphrase' : 'mode_password';
    var radio = document.getElementById(radioId);
    if (radio) { radio.checked = true; }
    updateOutputMode();
  }
  // 长度
  var slider = document.getElementById('pwd_length');
  if (settings.length) {
    slider.value = settings.length;
    document.getElementById('pwd_length_display').textContent = settings.length;
  }
  // 标点
  if (settings.punctuation !== undefined) {
    document.getElementById('rule_of_punctuation').checked = settings.punctuation;
  }
  // 大小写
  if (settings.caseSensitive !== undefined) {
    document.getElementById('rule_of_letter').checked = settings.caseSensitive;
  }
  // 算法版本
  if (settings.version) {
    document.getElementById('algorithm_version').value = settings.version;
  }
  // 短语选项
  if (settings.wordCount) {
    document.getElementById('word_count').value = settings.wordCount;
    document.getElementById('word_count_display').textContent = settings.wordCount;
  }
  if (settings.separator !== undefined) {
    document.getElementById('separator').value = settings.separator;
  }
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
    dropdown.classList.remove('show');
    return;
  }

  for (var i = 0; i < codes.length; i++) {
    (function (entry) {
      var item = document.createElement('div');
      item.className = 'service-code-item';

      var textSpan = document.createElement('span');
      textSpan.className = 'code-text';
      textSpan.textContent = entry.code;
      if (entry.settings) {
        var badge = document.createElement('i');
        badge.className = 'bi bi-sliders2-vertical settings-badge';
        badge.setAttribute('aria-hidden', 'true');
        textSpan.appendChild(badge);
      }
      item.appendChild(textSpan);

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-delete-code';
      delBtn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
      delBtn.setAttribute('aria-label', t('serviceCode.delete'));
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteServiceCode(entry.code);
        renderServiceCodeDropdown(document.getElementById('key').value);
      });
      item.appendChild(delBtn);

      item.addEventListener('click', function () {
        document.getElementById('key').value = entry.code;
        applyServiceCodeSettings(entry.settings);
        dropdown.classList.remove('show');
      });

      dropdown.appendChild(item);
    })(codes[i]);
  }

  dropdown.classList.add('show');
}

document.getElementById('key').addEventListener('focus', function () {
  renderServiceCodeDropdown(this.value);
});

document.getElementById('key').addEventListener('input', function () {
  renderServiceCodeDropdown(this.value);
});

document.addEventListener('click', function (e) {
  var wrapper = document.querySelector('.service-code-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('service-code-dropdown').classList.remove('show');
  }
});

document.getElementById('key').addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.getElementById('service-code-dropdown').classList.remove('show');
  }
});

// === 数据导入导出 ===

document.getElementById('btn-export').addEventListener('click', function () {
  var json = exportServiceCodes();
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'password-generator-backup.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-import').addEventListener('click', function () {
  document.getElementById('import-file-input').click();
});

document.getElementById('import-file-input').addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (event) {
    var feedback = document.getElementById('import-feedback');
    try {
      var result = importServiceCodes(event.target.result);
      feedback.textContent = t('data.importSuccess').replace('{count}', result.imported);
      feedback.className = 'import-feedback show success';
    } catch (err) {
      feedback.textContent = t('data.importError');
      feedback.className = 'import-feedback show error';
    }
    setTimeout(function () { feedback.className = 'import-feedback'; }, 3000);
  };
  reader.readAsText(file);
  e.target.value = '';
});

// 注册 Service Worker + 更新通知
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
  navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'SW_UPDATED') {
      if (confirm(t('sw.updatePrompt'))) {
        window.location.reload();
      }
    }
  });
}
