const backgroundState = {
  initialized: false,
  initPromise: null,
  profiles: {},
  profileOrder: [],
  profileIdByCookieStoreId: {},
  tabIdToCookieStoreId: {},
  cleaningProfileIds: new Set(),
  reconcileTimers: new Map(),
  autoCleanBlockUntil: {}
};

function rebuildCookieStoreIndex() {
  backgroundState.profileIdByCookieStoreId = {};
  for (const profileId of Object.keys(backgroundState.profiles)) {
    const profile = backgroundState.profiles[profileId];
    if (profile.currentCookieStoreId) {
      backgroundState.profileIdByCookieStoreId[profile.currentCookieStoreId] = profileId;
    }
  }
}

function normalizeStoredProfiles(storedProfiles, storedOrder) {
  const profiles = storedProfiles && typeof storedProfiles === "object" ? storedProfiles : {};
  const profileOrder = Array.isArray(storedOrder) ? storedOrder.filter((id) => profiles[id]) : [];
  for (const profileId of Object.keys(profiles)) {
    if (!profileOrder.includes(profileId)) {
      profileOrder.push(profileId);
    }
  }
  return { profiles, profileOrder };
}

async function loadProfilesFromStorage() {
  const data = await browser.storage.local.get(["schemaVersion", "profiles", "profileOrder"]);
  const normalized = normalizeStoredProfiles(data.profiles, data.profileOrder);
  backgroundState.profiles = normalized.profiles;
  backgroundState.profileOrder = normalized.profileOrder;
  const slotsChanged = syncOrderedShortcutSlots();
  if (data.schemaVersion !== SCHEMA_VERSION || slotsChanged) {
    await persistProfiles();
  }
}

async function loadTabCacheFromStorage() {
  const session = await browser.storage.session.get("tabIdToCookieStoreId");
  if (session.tabIdToCookieStoreId && typeof session.tabIdToCookieStoreId === "object") {
    backgroundState.tabIdToCookieStoreId = session.tabIdToCookieStoreId;
    return;
  }

  const nextCache = {};
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id !== undefined && tab.cookieStoreId) {
      nextCache[tab.id] = tab.cookieStoreId;
    }
  }
  backgroundState.tabIdToCookieStoreId = nextCache;
  await persistTabCache();
}

async function ensureStateLoaded() {
  if (backgroundState.initialized) return;
  if (backgroundState.initPromise) return backgroundState.initPromise;

  backgroundState.initPromise = (async () => {
    await loadProfilesFromStorage();
    await loadTabCacheFromStorage();
    rebuildCookieStoreIndex();
    backgroundState.initialized = true;
    backgroundState.initPromise = null;
  })().catch((error) => {
    backgroundState.initPromise = null;
    throw error;
  });

  return backgroundState.initPromise;
}

async function persistProfiles() {
  await browser.storage.local.set({
    schemaVersion: SCHEMA_VERSION,
    profiles: backgroundState.profiles,
    profileOrder: backgroundState.profileOrder
  });
}

async function persistTabCache() {
  await browser.storage.session.set({
    tabIdToCookieStoreId: backgroundState.tabIdToCookieStoreId
  });
}

function getProfile(profileId) {
  return backgroundState.profiles[profileId] || null;
}

function getProfileByCookieStoreId(cookieStoreId) {
  const profileId = backgroundState.profileIdByCookieStoreId[cookieStoreId];
  return profileId ? getProfile(profileId) : null;
}

async function getAllContainers() {
  return browser.contextualIdentities.query({});
}
