function syncOrderedSlots(slotKey, maxSlots) {
  let changed = false;
  for (const [index, profileId] of backgroundState.profileOrder.entries()) {
    const profile = getProfile(profileId);
    if (!profile) continue;
    const nextSlot = index < maxSlots ? index + 1 : null;
    if (profile[slotKey] !== nextSlot) {
      profile[slotKey] = nextSlot;
      changed = true;
    }
  }
  return changed;
}

function syncOrderedShortcutSlots() {
  const openChanged = syncOrderedSlots("openShortcutSlot", OPEN_SLOT_COUNT);
  const cleanChanged = syncOrderedSlots("cleanShortcutSlot", CLEAN_SLOT_COUNT);
  return openChanged || cleanChanged;
}

function toContainerSummary(container) {
  return {
    cookieStoreId: container.cookieStoreId,
    name: container.name,
    color: container.color,
    icon: container.icon,
    colorCode: container.colorCode || null,
    iconUrl: resolveContainerIconUrl(container.icon, container.iconUrl)
  };
}

function toProfileView(profile, containersById) {
  const container = containersById[profile.currentCookieStoreId] || null;
  return {
    ...cloneData(profile),
    isMissing: !container,
    colorCode: container?.colorCode || null,
    iconUrl: resolveContainerIconUrl(container?.icon || profile.icon, container?.iconUrl || "")
  };
}

async function buildProfilesPayload() {
  await ensureStateLoaded();
  const containers = await getAllContainers();
  const containersById = Object.fromEntries(containers.map((item) => [item.cookieStoreId, item]));
  const managedIds = new Set(Object.values(backgroundState.profiles).map((item) => item.currentCookieStoreId));
  const profiles = backgroundState.profileOrder
    .map((profileId) => getProfile(profileId))
    .filter(Boolean)
    .map((profile) => toProfileView(profile, containersById));
  const importableContainers = containers
    .filter((container) => !managedIds.has(container.cookieStoreId))
    .map(toContainerSummary);

  return { profiles, importableContainers };
}

async function createManagedProfile(payload) {
  await ensureStateLoaded();
  const input = sanitizeProfileInput(payload);
  const container = await browser.contextualIdentities.create({
    name: input.name,
    color: input.color,
    icon: input.icon
  });
  const profile = createProfileRecord(container, input);
  backgroundState.profiles[profile.profileId] = profile;
  backgroundState.profileOrder.push(profile.profileId);
  syncOrderedShortcutSlots();
  rebuildCookieStoreIndex();
  await persistProfiles();
  return buildProfilesPayload();
}

async function importManagedProfile(payload) {
  await ensureStateLoaded();
  const cookieStoreId = String(payload?.cookieStoreId || "").trim();
  if (!cookieStoreId) {
    throw new Error("Container ID is required for import");
  }
  if (getProfileByCookieStoreId(cookieStoreId)) {
    throw new Error("This container is already managed");
  }

  const container = await browser.contextualIdentities.get(cookieStoreId);
  if (getProfileByCookieStoreId(cookieStoreId)) {
    throw new Error("This container is already managed");
  }
  const profile = createProfileRecord(container);
  backgroundState.profiles[profile.profileId] = profile;
  backgroundState.profileOrder.push(profile.profileId);
  syncOrderedShortcutSlots();
  rebuildCookieStoreIndex();
  await persistProfiles();
  return buildProfilesPayload();
}

async function updateManagedProfile(payload) {
  await ensureStateLoaded();
  const profile = getProfile(payload?.profileId);
  if (!profile) {
    throw new Error("Managed container not found");
  }

  const input = sanitizeProfileInput(payload);
  const currentContainer = await getContainerIfExists(profile.currentCookieStoreId);
  if (currentContainer) {
    await browser.contextualIdentities.update(profile.currentCookieStoreId, {
      name: input.name,
      color: input.color,
      icon: input.icon
    });
  }

  Object.assign(profile, input);
  syncOrderedShortcutSlots();
  await persistProfiles();
  return buildProfilesPayload();
}

async function reorderManagedProfile(payload) {
  await ensureStateLoaded();
  const profileId = String(payload?.profileId || "").trim();
  const direction = String(payload?.direction || "").trim();
  const index = backgroundState.profileOrder.indexOf(profileId);
  if (index === -1) {
    throw new Error("Managed container not found");
  }

  const nextIndex =
    direction === "up" ? index - 1 :
    direction === "down" ? index + 1 :
    -1;
  if (nextIndex < 0 || nextIndex >= backgroundState.profileOrder.length) {
    return buildProfilesPayload();
  }

  const nextOrder = [...backgroundState.profileOrder];
  [nextOrder[index], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[index]];
  backgroundState.profileOrder = nextOrder;
  syncOrderedShortcutSlots();
  await persistProfiles();
  return buildProfilesPayload();
}

async function deleteManagedProfile(payload) {
  await ensureStateLoaded();
  const profile = getProfile(payload?.profileId);
  if (!profile) {
    throw new Error("Managed container not found");
  }

  await deleteProfileContainer(profile);
  delete backgroundState.profiles[profile.profileId];
  backgroundState.profileOrder = backgroundState.profileOrder.filter((id) => id !== profile.profileId);
  syncOrderedShortcutSlots();
  rebuildCookieStoreIndex();
  await persistProfiles();
  return buildProfilesPayload();
}
