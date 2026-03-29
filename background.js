async function upsertTabCache(tab) {
  if (tab?.id === undefined || !tab.cookieStoreId) return;
  backgroundState.tabIdToCookieStoreId[tab.id] = tab.cookieStoreId;
  await persistTabCache();
}

async function removeTabCache(tabId) {
  delete backgroundState.tabIdToCookieStoreId[tabId];
  await persistTabCache();
}

async function handleProxyRequest(requestDetails) {
  await ensureStateLoaded();
  const profile = getProfileByCookieStoreId(requestDetails.cookieStoreId);
  return buildProxyResult(profile);
}

async function handleMessage(message) {
  switch (message?.type) {
    case MESSAGE_TYPES.LIST_PROFILES:
      return buildProfilesPayload();
    case MESSAGE_TYPES.CREATE_PROFILE:
      return createManagedProfile(message.payload);
    case MESSAGE_TYPES.IMPORT_PROFILE:
      return importManagedProfile(message.payload);
    case MESSAGE_TYPES.UPDATE_PROFILE:
      return updateManagedProfile(message.payload);
    case MESSAGE_TYPES.REORDER_PROFILE:
      return reorderManagedProfile(message.payload);
    case MESSAGE_TYPES.DELETE_PROFILE:
      return deleteManagedProfile(message.payload);
    case MESSAGE_TYPES.CLEAN_PROFILE:
      return cleanProfile(message.payload?.profileId);
    case MESSAGE_TYPES.OPEN_EXTERNAL_LINK:
      return openManagedProfileTab(message.payload);
    default:
      return undefined;
  }
}

async function handleCommand(command) {
  await ensureStateLoaded();
  const profiles = Object.values(backgroundState.profiles);
  const openProfile = profiles.find((item) => commandNameForSlot("open", item.openShortcutSlot) === command);
  if (openProfile) {
    await openManagedProfileTab({ profileId: openProfile.profileId });
    return;
  }

  const cleanProfileMatch = profiles.find(
    (item) => commandNameForSlot("clean", item.cleanShortcutSlot) === command
  );
  if (cleanProfileMatch) {
    await cleanProfile(cleanProfileMatch.profileId);
  }
}

async function handleTabRemoved(tabId) {
  await ensureStateLoaded();
  const cookieStoreId = backgroundState.tabIdToCookieStoreId[tabId];
  await removeTabCache(tabId);
  if (!cookieStoreId) return;

  const profile = getProfileByCookieStoreId(cookieStoreId);
  if (profile?.autoClean) {
    scheduleAutoClean(profile.profileId);
  }
}

async function handleContainerUpdated(change) {
  await ensureStateLoaded();
  const context = change?.contextualIdentity;
  const profile = getProfileByCookieStoreId(context?.cookieStoreId);
  if (!profile) return;

  profile.name = context.name;
  profile.color = context.color;
  profile.icon = context.icon;
  await persistProfiles();
}

function reportBackgroundError(error) {
  console.error("Background error", readErrorMessage(error));
}

browser.runtime.onMessage.addListener((message) => handleMessage(message));
browser.runtime.onStartup.addListener(() => {
  void ensureStateLoaded().catch(reportBackgroundError);
});
browser.runtime.onInstalled.addListener(() => {
  void ensureStateLoaded().catch(reportBackgroundError);
});
browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });
browser.proxy.onError.addListener((error) => {
  console.error("Proxy error", readErrorMessage(error));
});
browser.commands.onCommand.addListener((command) => {
  void handleCommand(command).catch(reportBackgroundError);
});
browser.tabs.onCreated.addListener((tab) => {
  void upsertTabCache(tab).catch(reportBackgroundError);
});
browser.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
  void upsertTabCache(tab).catch(reportBackgroundError);
});
browser.tabs.onRemoved.addListener((tabId) => {
  void handleTabRemoved(tabId).catch(reportBackgroundError);
});
browser.contextualIdentities.onUpdated.addListener((change) => {
  void handleContainerUpdated(change).catch(reportBackgroundError);
});
