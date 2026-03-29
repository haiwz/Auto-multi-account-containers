async function closeTabsForCookieStore(cookieStoreId) {
  const tabs = await browser.tabs.query({ cookieStoreId });
  const tabIds = tabs.map((tab) => tab.id).filter((id) => id !== undefined);
  if (tabIds.length > 0) {
    await browser.tabs.remove(tabIds);
  }
}

async function removeBrowsingDataForCookieStore(cookieStoreId) {
  await browser.browsingData.remove({ cookieStoreId }, CLEAN_DATA_TYPES);
}

async function deleteProfileContainer(profile) {
  const existingContainer = await getContainerIfExists(profile.currentCookieStoreId);
  if (!existingContainer) return;

  await closeTabsForCookieStore(existingContainer.cookieStoreId);
  await browser.contextualIdentities.remove(existingContainer.cookieStoreId);
}

async function replaceContainer(profile) {
  const container = await browser.contextualIdentities.create({
    name: profile.name,
    color: profile.color,
    icon: profile.icon
  });
  profile.currentCookieStoreId = container.cookieStoreId;
  rebuildCookieStoreIndex();
  await persistProfiles();
  return container;
}

async function cleanProfile(profileId) {
  await ensureStateLoaded();
  if (backgroundState.cleaningProfileIds.has(profileId)) return buildProfilesPayload();

  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error("Managed container not found");
  }

  backgroundState.cleaningProfileIds.add(profileId);
  try {
    const existingContainer = await getContainerIfExists(profile.currentCookieStoreId);
    backgroundState.autoCleanBlockUntil[profileId] = Date.now() + AUTO_CLEAN_BLOCK_MS;
    clearTimeout(backgroundState.reconcileTimers.get(profileId));
    backgroundState.reconcileTimers.delete(profileId);
    if (existingContainer) {
      await closeTabsForCookieStore(existingContainer.cookieStoreId);
      await removeBrowsingDataForCookieStore(existingContainer.cookieStoreId);
      await browser.contextualIdentities.remove(existingContainer.cookieStoreId);
    }
    await replaceContainer(profile);
    return buildProfilesPayload();
  } finally {
    backgroundState.cleaningProfileIds.delete(profileId);
  }
}

function scheduleAutoClean(profileId) {
  const timer = backgroundState.reconcileTimers.get(profileId);
  if (timer) {
    clearTimeout(timer);
  }

  const nextTimer = setTimeout(async () => {
    backgroundState.reconcileTimers.delete(profileId);
    await reconcileProfile(profileId).catch((error) => {
      console.error("Failed to reconcile profile", readErrorMessage(error));
    });
  }, RECONCILE_DELAY_MS);
  backgroundState.reconcileTimers.set(profileId, nextTimer);
}

async function reconcileProfile(profileId) {
  await ensureStateLoaded();
  const profile = getProfile(profileId);
  if (!profile || !profile.autoClean || !profile.currentCookieStoreId) return;
  if (backgroundState.cleaningProfileIds.has(profileId)) return;
  if ((backgroundState.autoCleanBlockUntil[profileId] || 0) > Date.now()) return;

  const tabs = await browser.tabs.query({ cookieStoreId: profile.currentCookieStoreId });
  if (tabs.length === 0) {
    await cleanProfile(profileId);
  }
}
