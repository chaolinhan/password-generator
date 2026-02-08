/**
 * sha512加密密码
 * @param {记忆密码} pwd
 * @param {区分代码} key
 */
function hex_password(pwd, key) {
  var hexone = sha512.hmac(key, pwd);
  var hextwo = sha512.hmac("hello", hexone);
  var hexthree = sha512.hmac("world", hexone);

  var source = hextwo.split("");
  var rule = hexthree.split("");
  console.assert(rule.length === source.length, "sha512长度错误！");

  // 字母大小写转换
  for (var i = 0; i < source.length; ++i) {
    if (isNaN(source[i])) {
      var str = "whenthecatisawaythemicewillplay";
      if (str.search(rule[i]) > -1) {
        source[i] = source[i].toUpperCase();
      }
    }
  }
  return source.join("");
}

/**
 * 生成密码
 * @param {sha512加密后字符串} hash
 * @param {输出密码长度} length
 * @param {是否使用标点} rule_of_punctuation
 * @param {是否区分大小写} rule_of_letter
 */
function seek_password(hash, length, rule_of_punctuation, rule_of_letter) {
  // 生成字符表
  var lower = "abcdefghijklmnopqrstuvwxyz".split("");
  var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var number = "0123456789".split("");
  var punctuation = ",.:;!?".split("");
  var alphabet = lower.concat(number);
  if (parseInt(rule_of_punctuation) == 1) {
    alphabet = alphabet.concat(punctuation);
  }
  if (parseInt(rule_of_letter) == 1) {
    alphabet = alphabet.concat(upper);
  }

  // 生成密码
  // 从0开始截取长度为length的字符串，直到满足密码复杂度为止
  for (var i = 0; i <= hash.length - length; ++i) {
    var sub_hash = hash.slice(i, i + parseInt(length)).split("");
    var count = 0;
    var map_index = sub_hash.map(function(c) {
      count = (count + c.charCodeAt()) % alphabet.length;
      return count;
    });
    var sk_pwd = map_index.map(function(k) {
      return alphabet[k];
    });

    // 验证密码
    var matched = [false, false, false, false];
    sk_pwd.forEach(function(e) {
      matched[0] = matched[0] || lower.includes(e);
      matched[1] = matched[1] || upper.includes(e);
      matched[2] = matched[2] || number.includes(e);
      matched[3] = matched[3] || punctuation.includes(e);
    });
    if (parseInt(rule_of_letter) == -1) {
      matched[1] = true;
    }
    if (parseInt(rule_of_punctuation) == -1) {
      matched[3] = true;
    }
    if (!matched.includes(false)) {
      return sk_pwd.join("");
    }
  }
  return "";
}

/**
 * v2: PBKDF2-SHA512 密钥派生
 * @param {记忆密码} pwd
 * @param {区分代码} key
 * @returns {Promise<Uint8Array>} 128字节派生密钥
 */
async function hex_password_v2(pwd, key) {
  var enc = new TextEncoder();
  var keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pwd),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  var salt = enc.encode("pw-gen-v2:" + key);
  var derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 200000,
      hash: "SHA-512"
    },
    keyMaterial,
    1024
  );
  return new Uint8Array(derived);
}

/**
 * v2: Web Worker 版 PBKDF2 派生（带主线程回退）
 */
var _pbkdf2Worker = null;

function hex_password_v2_worker(pwd, key) {
  // 尝试创建 Worker
  if (!_pbkdf2Worker) {
    try {
      _pbkdf2Worker = new Worker('src/pbkdf2-worker.min.js');
    } catch (e) {
      _pbkdf2Worker = false;
    }
  }
  if (!_pbkdf2Worker) {
    return hex_password_v2(pwd, key);
  }
  var worker = _pbkdf2Worker;
  return new Promise(function (resolve, reject) {
    var handler = function (e) {
      worker.removeEventListener('message', handler);
      worker.removeEventListener('error', errorHandler);
      if (e.data.type === 'result') {
        resolve(e.data.bytes);
      } else if (e.data.type === 'error') {
        reject(new Error(e.data.message));
      }
    };
    var errorHandler = function () {
      worker.removeEventListener('message', handler);
      worker.removeEventListener('error', errorHandler);
      hex_password_v2(pwd, key).then(resolve).catch(reject);
    };
    worker.addEventListener('message', handler);
    worker.addEventListener('error', errorHandler);
    worker.postMessage({ type: 'derive', pwd: pwd, key: key });
  });
}

/**
 * v2: 使用rejection sampling生成密码
 * @param {Uint8Array} bytes - 64字节派生密钥
 * @param {输出密码长度} length
 * @param {是否使用标点} rule_of_punctuation
 * @param {是否区分大小写} rule_of_letter
 */
function seek_password_v2(bytes, length, rule_of_punctuation, rule_of_letter) {
  var lower = "abcdefghijklmnopqrstuvwxyz";
  var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var number = "0123456789";
  var punctuation = "~!@#$%^&*()-_=+";
  var alphabet = lower + number;
  var usePunctuation = parseInt(rule_of_punctuation) == 1;
  var useUpper = parseInt(rule_of_letter) == 1;
  if (usePunctuation) {
    alphabet += punctuation;
  }
  if (useUpper) {
    alphabet += upper;
  }

  var maxUnbiased = 256 - (256 % alphabet.length);
  var pwd_length = parseInt(length);
  var result = [];
  var byteIndex = 0;

  // 使用rejection sampling从字节流中提取密码字符
  while (result.length < pwd_length && byteIndex < bytes.length) {
    var b = bytes[byteIndex++];
    if (b < maxUnbiased) {
      result.push(alphabet[b % alphabet.length]);
    }
  }

  // 如果字节用完但密码长度不够，用剩余字节的HMAC扩展
  // 正常情况下128字节足够生成20位密码
  if (result.length < pwd_length) {
    return "";
  }

  // 类别保证：检查每个必需类别是否存在，若缺失则确定性替换
  var categories = [
    { chars: lower, required: true },
    { chars: upper, required: useUpper },
    { chars: number, required: true },
    { chars: punctuation, required: usePunctuation }
  ];

  for (var ci = 0; ci < categories.length; ci++) {
    if (!categories[ci].required) continue;
    var found = false;
    for (var ri = 0; ri < result.length; ri++) {
      if (categories[ci].chars.indexOf(result[ri]) !== -1) {
        found = true;
        break;
      }
    }
    if (!found) {
      // 使用尚未被用于rejection sampling的字节来确定替换位置和字符
      var positionByte = byteIndex < bytes.length ? bytes[byteIndex++] : ci;
      var charByte = byteIndex < bytes.length ? bytes[byteIndex++] : ci * 7 + 3;
      var replacePos = positionByte % pwd_length;
      var catChars = categories[ci].chars;
      result[replacePos] = catChars[charByte % catChars.length];
    }
  }

  return result.join("");
}

/**
 * v2: 从派生字节生成助记短语
 * @param {Uint8Array} bytes - 128字节派生密钥
 * @param {number} wordCount - 词数 (4-8)
 * @param {string} separator - 分隔符
 * @returns {string} 助记短语
 */
function seek_passphrase_v2(bytes, wordCount, separator) {
  var words = WORDLIST_EN; // 2048 words
  var result = [];
  var byteIndex = 0;

  // 每个词用2字节 (16 bits), 65536 / 2048 = 32, 无模偏差
  for (var i = 0; i < wordCount && byteIndex + 1 < bytes.length; i++) {
    var val = (bytes[byteIndex] << 8) | bytes[byteIndex + 1];
    byteIndex += 2;
    var wordIndex = val % words.length;
    result.push(words[wordIndex]);
  }

  if (result.length < wordCount) return "";
  return result.join(separator);
}

/**
 * 获取下拉选择框内容
 * @param {id} select_id
 */
function get_select_option(select_id) {
  var select = document.getElementById(select_id);
  var select_index = select.selectedIndex;
  return [
    select.options[select_index].value,
    select.options[select_index].text
  ];
}

/**
 * 获取规则值（兼容 checkbox 和 select）
 * @param {id} id
 */
function get_rule_value(id) {
  var el = document.getElementById(id);
  if (!el) return ["1", ""];
  if (el.type === "checkbox") return [el.checked ? "1" : "-1", ""];
  var idx = el.selectedIndex;
  return [el.options[idx].value, el.options[idx].text];
}

/**
 * 获取长度值（兼容 range/number 和 select）
 * @param {id} id
 */
function get_length_value(id) {
  var el = document.getElementById(id);
  if (!el) return ["16", "16 位"];
  if (el.type === "range" || el.type === "number") return [el.value, el.value + " 位"];
  var idx = el.selectedIndex;
  return [el.options[idx].value, el.options[idx].text];
}

/**
 * 生成密码
 */
async function generate_password() {
  //获取页面传过来的值
  var pwd = document.getElementById("pwd").value;
  var key = document.getElementById("key").value;
  var rule_of_punctuation = get_rule_value("rule_of_punctuation");
  var rule_of_letter = get_rule_value("rule_of_letter");
  var pwd_length = get_length_value("pwd_length");
  var versionSelect = document.getElementById("algorithm_version");
  var version = versionSelect ? versionSelect.value : "1";

  // 检查输出模式
  var modeRadio = document.querySelector('input[name="output_mode"]:checked');
  var mode = modeRadio ? modeRadio.value : "password";

  //加密
  if (pwd && key) {
    // 短语模式：始终使用 v2
    if (mode === "passphrase") {
      var derivedBytes = await hex_password_v2_worker(pwd, key);
      var wordCountEl = document.getElementById("word_count");
      var separatorEl = document.getElementById("separator");
      var wordCount = wordCountEl ? parseInt(wordCountEl.value) : 5;
      var separator = separatorEl ? separatorEl.value : "-";
      return seek_passphrase_v2(derivedBytes, wordCount, separator);
    }

    if (version === "2") {
      var derivedBytes = await hex_password_v2_worker(pwd, key);
      var sk_pwd = seek_password_v2(
        derivedBytes,
        pwd_length[0],
        rule_of_punctuation[0],
        rule_of_letter[0]
      );
      return sk_pwd;
    } else {
      var hash = hex_password(pwd, key);
      console.assert(hash.length === 128, "hash长度不是128位！");
      var sk_pwd = seek_password(
        hash,
        pwd_length[0],
        rule_of_punctuation[0],
        rule_of_letter[0]
      );
      return sk_pwd;
    }
  }
}
