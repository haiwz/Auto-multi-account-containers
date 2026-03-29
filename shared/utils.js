function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function createProfileId() {
  return crypto.randomUUID();
}

function readErrorMessage(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return String(error);
}

function resolveContainerIconUrl(iconName, iconUrl = "") {
  if (iconUrl) {
    return String(iconUrl);
  }
  if (!CONTAINER_ICONS.includes(iconName)) {
    return "";
  }
  return `resource://usercontext-content/${iconName}.svg`;
}

function parseSlot(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidSlot(slot, maxSlots) {
  return Number.isInteger(slot) && slot >= 1 && slot <= maxSlots;
}

function isDnsProxyType(type) {
  return type === "socks" || type === "socks4";
}

function normalizeProxyConfig(proxyMode, customProxy) {
  if (proxyMode !== PROXY_MODES.CUSTOM) {
    return {
      proxyMode: PROXY_MODES.INHERIT,
      customProxy: null
    };
  }

  const proxyType = customProxy?.type;
  const host = String(customProxy?.host || "").trim();
  const port = Number.parseInt(customProxy?.port, 10);
  if (!PROXY_TYPES.includes(proxyType)) {
    throw new Error("Invalid proxy type");
  }
  if (!host) {
    throw new Error("Proxy host is required");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Proxy port must be between 1 and 65535");
  }

  return {
    proxyMode: PROXY_MODES.CUSTOM,
    customProxy: {
      type: proxyType,
      host,
      port,
      proxyDNS: isDnsProxyType(proxyType) ? Boolean(customProxy?.proxyDNS) : false
    }
  };
}

function buildProxyResult(profile) {
  if (!profile || profile.proxyMode !== PROXY_MODES.CUSTOM || !profile.customProxy) {
    return { type: "direct" };
  }
  // End the failover chain at the container-specific proxy instead of falling back
  // to browser-defined proxies.
  return [cloneData(profile.customProxy), null];
}

function isMissingEntityError(error) {
  const message = readErrorMessage(error).toLowerCase();
  return message.includes("not found") || message.includes("no contextual identity");
}

async function getContainerIfExists(cookieStoreId) {
  if (!cookieStoreId) return null;
  try {
    return await browser.contextualIdentities.get(cookieStoreId);
  } catch (error) {
    if (isMissingEntityError(error)) {
      return null;
    }
    throw error;
  }
}

function sanitizeProfileInput(payload) {
  const name = String(payload?.name || "").trim();
  if (!name) {
    throw new Error("Container name is required");
  }
  if (!CONTAINER_COLORS.includes(payload?.color)) {
    throw new Error("Invalid container color");
  }
  if (!CONTAINER_ICONS.includes(payload?.icon)) {
    throw new Error("Invalid container icon");
  }

  const proxySettings = normalizeProxyConfig(payload?.proxyMode, payload?.customProxy);
  const openShortcutSlot = parseSlot(payload?.openShortcutSlot);
  const cleanShortcutSlot = parseSlot(payload?.cleanShortcutSlot);
  if (openShortcutSlot !== null && !isValidSlot(openShortcutSlot, OPEN_SLOT_COUNT)) {
    throw new Error("Invalid open shortcut slot");
  }
  if (cleanShortcutSlot !== null && !isValidSlot(cleanShortcutSlot, CLEAN_SLOT_COUNT)) {
    throw new Error("Invalid clean shortcut slot");
  }

  return {
    name,
    color: payload.color,
    icon: payload.icon,
    autoClean: Boolean(payload?.autoClean),
    openShortcutSlot,
    cleanShortcutSlot,
    proxyMode: proxySettings.proxyMode,
    customProxy: proxySettings.customProxy
  };
}

function createProfileRecord(container, input = {}) {
  return {
    profileId: input.profileId || createProfileId(),
    currentCookieStoreId: container.cookieStoreId,
    name: input.name || container.name,
    color: input.color || container.color,
    icon: input.icon || container.icon,
    proxyMode: input.proxyMode || PROXY_MODES.INHERIT,
    customProxy: input.customProxy || null,
    autoClean: Boolean(input.autoClean),
    openShortcutSlot: input.openShortcutSlot || null,
    cleanShortcutSlot: input.cleanShortcutSlot || null,
    managed: true
  };
}

function commandNameForSlot(kind, slot) {
  if (slot === null) return null;
  return kind === "open" ? `${OPEN_SLOT_PREFIX}${slot}` : `${CLEAN_SLOT_PREFIX}${slot}`;
}
