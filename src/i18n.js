var I18N = {
  zh: {
    'page.title': '密码生成工具',
    'page.subtitle': '确定性密码派生 · 本地计算',

    'input.masterPassword': '记忆密码',
    'input.serviceCode': '区分代码',
    'input.masterPassword.error': '请输入记忆密码',
    'input.serviceCode.error': '请输入区分代码',

    'options.toggle': '选项',
    'options.length': '密码长度',
    'options.punctuation': '使用标点符号',
    'options.caseSensitive': '区分大小写',
    'options.algorithm': '算法版本',
    'options.v2': 'v2（推荐）',
    'options.v1': 'v1（旧版兼容）',
    'options.mode': '输出模式',
    'options.modePassword': '密码',
    'options.modePassphrase': '短语',
    'options.wordCount': '词数',
    'options.separator': '分隔符',
    'options.wordlistNote': '词库：BIP39 英语词表（2048 词）',
    'options.hint': 'v2 使用 PBKDF2 增强安全性；v1 兼容已有密码',

    'password.placeholder': '点击下方按钮生成密码',
    'password.generate': '生成密码',
    'password.generating': '生成中...',
    'password.copyLabel': '复制密码',
    'password.displayLabel': '生成的密码，点击复制',
    'password.strengthLabel': '密码强度',

    'strength.veryWeak': '极弱',
    'strength.weak': '弱',
    'strength.strong': '强',
    'strength.veryStrong': '极强',

    'aria.toggleTheme': '切换深色/浅色主题',
    'aria.showPassword': '显示密码',
    'aria.hidePassword': '隐藏密码',

    'sw.updatePrompt': '发现新版本，是否刷新页面？',

    'error.join': '，',

    'instructions.title': '使用说明',
    'instructions.1': '基于密钥派生函数（v2: PBKDF2-SHA512, 200k 迭代），所有计算在浏览器本地完成',
    'instructions.2': '记忆密码作为主密钥，应具备足够熵值，在所有服务间保持一致',
    'instructions.3': '区分代码作为盐值，为每个服务设唯一标识，如：',

    'serviceCode.delete': '删除',

    'privacy.banner': '所有计算在本地完成，不传输数据、无网络请求、不追踪任何信息',

    'data.export': '导出',
    'data.import': '导入',
    'data.importSuccess': '成功导入 {count} 个服务代码',
    'data.importError': '导入失败：文件格式不正确',

    'lang.toggle': 'EN'
  },
  en: {
    'page.title': 'Password Generator',
    'page.subtitle': 'Deterministic Derivation · Local Computation',

    'input.masterPassword': 'Master Password',
    'input.serviceCode': 'Service Code',
    'input.masterPassword.error': 'Please enter master password',
    'input.serviceCode.error': 'Please enter service code',

    'options.toggle': 'Options',
    'options.length': 'Password Length',
    'options.punctuation': 'Include Punctuation',
    'options.caseSensitive': 'Mixed Case',
    'options.algorithm': 'Algorithm Version',
    'options.v2': 'v2 (Recommended)',
    'options.v1': 'v1 (Legacy)',
    'options.mode': 'Output Mode',
    'options.modePassword': 'Password',
    'options.modePassphrase': 'Passphrase',
    'options.wordCount': 'Word Count',
    'options.separator': 'Separator',
    'options.wordlistNote': 'Wordlist: BIP39 English (2048 words)',
    'options.hint': 'v2 uses PBKDF2 for enhanced security; v1 for backward compatibility',

    'password.placeholder': 'Click the button below to generate',
    'password.generate': 'Generate Password',
    'password.generating': 'Generating...',
    'password.copyLabel': 'Copy password',
    'password.displayLabel': 'Generated password, click to copy',
    'password.strengthLabel': 'Password strength',

    'strength.veryWeak': 'Very Weak',
    'strength.weak': 'Weak',
    'strength.strong': 'Strong',
    'strength.veryStrong': 'Very Strong',

    'aria.toggleTheme': 'Toggle dark/light theme',
    'aria.showPassword': 'Show password',
    'aria.hidePassword': 'Hide password',

    'sw.updatePrompt': 'New version available. Refresh the page?',

    'error.join': ', ',

    'instructions.title': 'Instructions',
    'instructions.1': 'Uses key derivation (v2: PBKDF2-SHA512, 200k iterations). All computation is local.',
    'instructions.2': 'Master password serves as the main key. Keep it consistent across all services.',
    'instructions.3': 'Service code is the salt. Use a unique identifier per service, e.g. ',

    'serviceCode.delete': 'Delete',

    'privacy.banner': 'All computation is local — no data transmitted, no network requests, no tracking',

    'data.export': 'Export',
    'data.import': 'Import',
    'data.importSuccess': 'Successfully imported {count} service codes',
    'data.importError': 'Import failed: invalid file format',

    'lang.toggle': '中文'
  }
};

var currentLang = localStorage.getItem('lang') || 'zh';

function t(key) {
  var dict = I18N[currentLang] || I18N['zh'];
  return dict[key] || I18N['zh'][key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  translatePage();
}

function translatePage() {
  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    els[i].textContent = t(els[i].getAttribute('data-i18n'));
  }
  var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  for (var i = 0; i < placeholders.length; i++) {
    placeholders[i].placeholder = t(placeholders[i].getAttribute('data-i18n-placeholder'));
  }
  var ariaEls = document.querySelectorAll('[data-i18n-aria]');
  for (var i = 0; i < ariaEls.length; i++) {
    ariaEls[i].setAttribute('aria-label', t(ariaEls[i].getAttribute('data-i18n-aria')));
  }
  document.title = t('page.title');
}
