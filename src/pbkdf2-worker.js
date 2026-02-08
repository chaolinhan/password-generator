self.addEventListener('message', function (e) {
  var data = e.data;
  if (data.type === 'derive') {
    deriveBits(data.pwd, data.key).then(function (bytes) {
      self.postMessage({ type: 'result', bytes: bytes }, [bytes.buffer]);
    }).catch(function (err) {
      self.postMessage({ type: 'error', message: err.message });
    });
  }
});

async function deriveBits(pwd, key) {
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
