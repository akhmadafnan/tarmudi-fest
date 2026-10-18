/**
 * STEP 01 AUTH-GATE: public-safe capability probe only.
 * NO auth implementation. NO credential, secret, user or Sheets data.
 */
class CapabilityProbe {
  run() {
    const hmac = Utilities.computeHmacSha256Signature(
      'tarmudi-test-message', 'public-nonsecret-test-key'
    );
    let lockSupported = false;
    try {
      lockSupported = Boolean(LockService.getScriptLock());
    } catch (ignored) { lockSupported = false; }
    return {
      probe: 'TF26-AUTH-GATE-RUNTIME-CAPABILITIES',
      version: 1,
      runtime: 'Apps Script V8',
      classSyntax: this.constructor.name === 'CapabilityProbe',
      globalCryptoAvailable: typeof crypto !== 'undefined',
      subtleCryptoAvailable: typeof SubtleCrypto !== 'undefined',
      textEncoderAvailable: typeof TextEncoder !== 'undefined',
      hmacPrimitiveAvailable: Array.isArray(hmac) && hmac.length === 32,
      scriptLockAvailable: lockSupported,
      disclaimer: 'This proves no password KDF, secure session, rate limit or auth.'
    };
  }
}

function doGet() {
  try {
    const data = new CapabilityProbe().run();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Never expose exception internals in an anonymous response.
    return ContentService.createTextOutput(JSON.stringify({
      probe: 'TF26-AUTH-GATE-RUNTIME-CAPABILITIES',
      status: 'FAILED',
      disclaimer: 'Diagnostic details restricted to script owner.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
