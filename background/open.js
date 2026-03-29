function getProfileByOpenShortcutSlot(slot) {
  if (!isValidSlot(slot, OPEN_SLOT_COUNT)) return null;
  return Object.values(backgroundState.profiles).find((profile) => profile.openShortcutSlot === slot) || null;
}

function resolveProfileForOpen(payload) {
  const profileId = String(payload?.profileId || "").trim();
  if (profileId) {
    const profile = getProfile(profileId);
    if (!profile) {
      throw new Error("Managed container not found");
    }
    return profile;
  }

  const cookieStoreId = String(payload?.cookieStoreId || "").trim();
  if (cookieStoreId) {
    const profile = getProfileByCookieStoreId(cookieStoreId);
    if (!profile) {
      throw new Error("Managed container not found");
    }
    return profile;
  }

  const slot = parseSlot(payload?.slot);
  if (slot !== null) {
    const profile = getProfileByOpenShortcutSlot(slot);
    if (!profile) {
      throw new Error("Managed container not found");
    }
    return profile;
  }

  throw new Error("Container reference is required");
}

async function ensureOpenContainer(profile) {
  const existingContainer = await getContainerIfExists(profile.currentCookieStoreId);
  if (existingContainer) {
    return existingContainer;
  }
  return replaceContainer(profile);
}

async function openManagedProfileTab(payload = {}) {
  await ensureStateLoaded();
  const profile = resolveProfileForOpen(payload);
  const container = await ensureOpenContainer(profile);
  const createProperties = {
    cookieStoreId: container.cookieStoreId
  };
  if (payload.url) {
    createProperties.url = normalizeExternalTargetUrl(payload.url);
  }
  await browser.tabs.create(createProperties);
  return {
    profileId: profile.profileId,
    cookieStoreId: container.cookieStoreId,
    url: createProperties.url || ""
  };
}
