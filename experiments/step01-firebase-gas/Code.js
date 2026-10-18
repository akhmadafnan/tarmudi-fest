/**
 * Tarmudi Fest STEP 01 — Firebase Authentication ↔ GAS proof-of-concept.
 *
 * Test-only. No production accounts, no participant data, no password hashing.
 * Firebase handles password sign-in. GAS validates the Firebase token using
 * the Identity Toolkit account lookup and allows only privately whitelisted UID.
 *
 * Required Script Properties (NEVER commit values):
 * TF26_FIREBASE_API_KEY          (public web API key for the chosen project)
 * TF26_FIREBASE_PROJECT_ID       (the expected Firebase project ID)
 * TF26_INTERNAL_LOGIN_DOMAIN     (synthetic email domain, verified at setup)
 * TF26_AUTH_ALLOWLIST_JSON       (JSON map UID -> {role, competition, active})
 */

const AUTH_GENERIC_ERROR_ = "ACCESS_DENIED";
const FIREBASE_LOOKUP_URL_ =
  "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=";

class FirebaseIdentityVerifier {
  constructor(properties, urlFetch, utilities, nowSeconds) {
    this.properties_ = properties;
    this.urlFetch_ = urlFetch;
    this.utilities_ = utilities;
    this.nowSeconds_ = nowSeconds;
  }

  verify(idToken) {
    const configuration = this.configuration_();
    if (typeof idToken !== "string" ||
        idToken.length < 60 || idToken.length > 6000 ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(idToken)) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    const reply = this.urlFetch_.fetch(
      FIREBASE_LOOKUP_URL_ + encodeURIComponent(configuration.apiKey), {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ idToken }),
        muteHttpExceptions: true,
        followRedirects: false
      }
    );
    if (reply.getResponseCode() !== 200) throw new Error(AUTH_GENERIC_ERROR_);
    let accountData;
    try {
      accountData = JSON.parse(reply.getContentText());
    } catch (ignored) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    const records = accountData && accountData.users;
    if (!Array.isArray(records) || records.length !== 1) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    const account = records[0];
    if (!account || typeof account.localId !== "string" ||
        !account.localId || account.disabled === true) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }

    // Google Identity Toolkit has checked the supplied token before returning
    // an account. Only AFTER that authoritative validation may we inspect
    // decoded JWT claims for our stricter project, time and UID requirements.
    let claims;
    try {
      const part = idToken.split(".")[1];
      const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
      const bytes = this.utilities_.base64DecodeWebSafe(padded);
      claims = JSON.parse(this.utilities_.newBlob(bytes).getDataAsString("UTF-8"));
    } catch (ignored) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    const now = this.nowSeconds_();
    const projectId = configuration.projectId;
    if (!claims || claims.aud !== projectId ||
        claims.iss !== "https://securetoken.google.com/" + projectId ||
        claims.sub !== account.localId ||
        typeof claims.exp !== "number" || claims.exp <= now ||
        typeof claims.iat !== "number" || claims.iat > now + 60 ||
        claims.iat <= 0) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    const validSince = Number(account.validSince || 0);
    if (!Number.isFinite(validSince) || claims.iat < validSince) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    return { uid: account.localId };
  }

  configuration_() {
    const apiKey = this.properties_.getProperty("TF26_FIREBASE_API_KEY");
    const projectId = this.properties_.getProperty("TF26_FIREBASE_PROJECT_ID");
    if (typeof apiKey !== "string" || !/^AIza[A-Za-z0-9_-]{20,}$/.test(apiKey) ||
        typeof projectId !== "string" ||
        !/^[a-z][a-z0-9-]{4,40}$/.test(projectId)) {
      throw new Error("SERVICE_NOT_READY");
    }
    return { apiKey, projectId };
  }
}

class InternalAccountAuthorizer {
  constructor(properties) {
    this.properties_ = properties;
  }

  findEnabledAccount(uid) {
    const json = this.properties_.getProperty("TF26_AUTH_ALLOWLIST_JSON");
    if (typeof json !== "string" || json.length > 32000) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    let map;
    try {
      map = JSON.parse(json);
    } catch (ignored) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    if (!map || typeof map !== "object" || Array.isArray(map) ||
        !Object.prototype.hasOwnProperty.call(map, uid)) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    const role = map[uid];
    if (!role || role.active !== true ||
        !["admin", "registrasi", "juri"].includes(role.role) ||
        (role.role !== "admin" && !["MDG", "THF", "MWN"].includes(role.competition)) ||
        (role.role === "admin" && role.competition !== "ALL")) {
      throw new Error(AUTH_GENERIC_ERROR_);
    }
    return { role: role.role, competition: role.competition };
  }
}

function apiWhoAmI(idToken) {
  try {
    const props = PropertiesService.getScriptProperties();
    const verifier = new FirebaseIdentityVerifier(
      props, UrlFetchApp, Utilities, () => Math.floor(Date.now() / 1000)
    );
    const identity = verifier.verify(idToken);
    const role = new InternalAccountAuthorizer(props).findEnabledAccount(identity.uid);
    // Nothing here contains participants, Google resource identifiers or tokens.
    return { ok: true, role: role.role, competition: role.competition };
  } catch (ignored) {
    // Do not expose server errors, Firebase UID, token or username to browser.
    return { ok: false, error: "AUTH_REQUIRED" };
  }
}

function doGet() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty("TF26_FIREBASE_API_KEY") || "";
  const domain = props.getProperty("TF26_INTERNAL_LOGIN_DOMAIN") || "";
  const projectId = props.getProperty("TF26_FIREBASE_PROJECT_ID") || "";
  const validDomain = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain);
  // API key is publicly visible in Firebase clients; never embed credentials.
  const template = HtmlService.createTemplateFromFile("Index");
  template.publicConfig = JSON.stringify({
    apiKey: /^AIza[A-Za-z0-9_-]{20,}$/.test(apiKey) ? apiKey : "",
    projectId: /^[a-z][a-z0-9-]{4,40}$/.test(projectId) ? projectId : "",
    domain: validDomain ? domain : ""
  });
  return template.evaluate().setTitle("Tarmudi Fest — Uji Login")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}
