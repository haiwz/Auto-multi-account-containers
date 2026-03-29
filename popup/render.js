const popupState = {
  profiles: [],
  importableContainers: [],
  commandsByName: {},
  expandedProfileId: null,
  isBusy: false
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createOptionNode(value, label, options = {}) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.selected = Boolean(options.selected);
  option.disabled = Boolean(options.disabled);
  if (options.title) {
    option.title = options.title;
  }
  return option;
}

function replaceSelectOptions(select, optionNodes) {
  select.replaceChildren(...optionNodes);
}

function parseElementFromHtml(html) {
  const doc = new DOMParser().parseFromString(html.trim(), "text/html");
  return doc.body.firstElementChild;
}

function setStatus(message, isError = false) {
  const status = document.querySelector("#status");
  status.textContent = message || "";
  status.classList.toggle("error", isError);
}

function syncBusyState() {
  const appShell = document.querySelector(".app-shell");
  if (!appShell) return;

  const isBusy = Boolean(popupState.isBusy);
  appShell.dataset.busy = isBusy ? "true" : "false";
  for (const control of appShell.querySelectorAll("button, input, select")) {
    control.disabled = isBusy;
  }
}

function buildOptions(values, selectedValue, includeEmpty = false, labelResolver = (value) => value) {
  const options = [];
  if (includeEmpty) options.push(`<option value="">${escapeHtml(t("notAssigned"))}</option>`);
  for (const value of values) {
    const selected = String(value) === String(selectedValue) ? ' selected="selected"' : "";
    options.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(labelResolver(value))}</option>`);
  }
  return options.join("");
}

function proxyFieldValues(profile) {
  return profile.customProxy || { type: PROXY_TYPES[0], host: "", port: "", proxyDNS: false };
}

function shortcutBinding(kind, slot) {
  if (!slot) return t("noShortcut");
  const command = commandNameForSlot(kind, slot);
  return popupState.commandsByName[command]?.shortcut || t("unassigned");
}

function shortcutSummary(kind, slot) {
  const label = kind === "open" ? t("openShortcutLabel") : t("cleanShortcutLabel");
  if (!slot) return `${label}: ${t("noShortcut")}`;
  return `${label}: ${t("slotSummary", { slot, shortcut: shortcutBinding(kind, slot) })}`;
}

function proxySummary(profile) {
  const proxy = proxyFieldValues(profile);
  if (profile.proxyMode !== PROXY_MODES.CUSTOM) return t("browserDefault");
  return `${proxy.type} ${proxy.host}:${proxy.port}`;
}

function renderImportOptions() {
  const select = document.querySelector("#import-select");
  const button = document.querySelector("#import-button");
  if (popupState.importableContainers.length === 0) {
    replaceSelectOptions(select, [createOptionNode("", t("noUnmanagedContainers"))]);
    select.disabled = true;
    button.disabled = true;
    return;
  }
  select.disabled = false;
  button.disabled = false;
  replaceSelectOptions(
    select,
    popupState.importableContainers.map((container) =>
      createOptionNode(container.cookieStoreId, container.name)
    )
  );
}

function renderProfiles() {
  const container = document.querySelector("#profiles");
  if (popupState.profiles.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = t("noManagedContainers");
    container.replaceChildren(emptyState);
    return;
  }
  container.replaceChildren(
    ...popupState.profiles.map((profile, index) =>
      parseElementFromHtml(renderProfileCard(profile, index, popupState.profiles.length))
    )
  );
}

function renderProfileSummary(profile) {
  return `
    <div class="summary-chips">
      <span class="summary-chip">${escapeHtml(proxySummary(profile))}</span>
      <span class="summary-chip">${profile.autoClean ? t("autoCleanOn") : t("autoCleanOff")}</span>
      <span class="summary-chip">${escapeHtml(shortcutSummary("open", profile.openShortcutSlot))}</span>
      <span class="summary-chip">${escapeHtml(shortcutSummary("clean", profile.cleanShortcutSlot))}</span>
    </div>
  `;
}

function renderShortcutField(label, kind, slot) {
  const binding = shortcutBinding(kind, slot);
  const slotLabel = slot ? t("slotLabel", { slot }) : t("noShortcut");
  return `
    <div class="shortcut-field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(binding)}</strong>
      <small>${escapeHtml(slotLabel)}</small>
    </div>
  `;
}

function renderShortcutFields(profile) {
  return `
    <div class="shortcut-grid">
      ${renderShortcutField(t("openShortcutLabel"), "open", profile.openShortcutSlot)}
      ${renderShortcutField(t("cleanShortcutLabel"), "clean", profile.cleanShortcutSlot)}
    </div>
    <p class="shortcut-note">${escapeHtml(t("shortcutOrderHint"))}</p>
  `;
}

function renderProxyFields(profile) {
  const proxy = proxyFieldValues(profile);
  return `
    <label>
      <span>${t("proxyModeLabel")}</span>
      <select class="proxy-mode">${buildOptions(Object.values(PROXY_MODES), profile.proxyMode, false, labelForProxyMode)}</select>
    </label>
    <label class="custom-only">
      <span>${t("proxyTypeLabel")}</span>
      <select class="proxy-type">${buildOptions(PROXY_TYPES, proxy.type, false, labelForProxyType)}</select>
    </label>
    <label class="custom-only">
      <span>${t("hostLabel")}</span>
      <input class="proxy-host" type="text" value="${escapeHtml(proxy.host)}" placeholder="${escapeHtml(t("hostPlaceholder"))}" />
    </label>
    <label class="custom-only">
      <span>${t("portLabel")}</span>
      <input class="proxy-port" type="number" min="1" max="65535" value="${escapeHtml(proxy.port)}" placeholder="${escapeHtml(t("portPlaceholder"))}" />
    </label>
    <label class="checkbox-row custom-only dns-only">
      <span>${t("remoteDnsLabel")}</span>
      <input class="proxy-dns" type="checkbox" ${proxy.proxyDNS ? 'checked="checked"' : ""} />
    </label>
  `;
}

function renderProfileCard(profile, index, total) {
  const proxy = proxyFieldValues(profile);
  const colorCode = profile.colorCode || "#4fd1c5";
  const cleanLabel = profile.isMissing ? t("rebuildButton") : t("cleanButton");
  const isExpanded = popupState.expandedProfileId === profile.profileId;
  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;
  return `
    <article class="profile-card ${profile.isMissing ? "missing" : ""}"
      data-profile-id="${escapeHtml(profile.profileId)}"
      data-proxy-mode="${escapeHtml(profile.proxyMode)}"
      data-proxy-type="${escapeHtml(proxy.type)}"
      data-expanded="${isExpanded ? "true" : "false"}"
      style="--container-accent:${escapeHtml(colorCode)}">
      ${profile.isMissing ? `<span class="missing-badge">${t("missingBadge")}</span>` : ""}
      <button type="button" class="profile-toggle" data-action="toggle">
        <div class="profile-head">
          <div>
            <h3 class="profile-title">${renderIconGlyph(profile.icon, {
              iconUrl: profile.iconUrl,
              color: colorCode,
              title: labelForIcon(profile.icon),
              className: "icon-chip"
            })}${escapeHtml(profile.name)}</h3>
            <div class="profile-meta">${escapeHtml(profile.currentCookieStoreId || t("notCreated"))}</div>
          </div>
          <span class="toggle-copy">${isExpanded ? t("closeButton") : t("configureButton")}</span>
        </div>
        ${renderProfileSummary(profile)}
      </button>
      <div class="profile-details">
        <div class="profile-grid">
          <label>
            <span>${t("nameLabel")}</span>
            <input class="profile-name" type="text" maxlength="64" value="${escapeHtml(profile.name)}" />
          </label>
          <label>
            <span>${t("colorLabel")}</span>
            <select class="profile-color">${buildOptions(CONTAINER_COLORS, profile.color, false, labelForColor)}</select>
          </label>
          <label>
            <span>${t("iconLabel")}</span>
            ${renderIconPicker("icon", "profile-icon", profile.icon, {
              iconUrl: profile.iconUrl,
              color: colorCode
            })}
          </label>
          ${renderProxyFields(profile)}
          <label class="checkbox-row">
            <span>${t("autoCleanLabel")}</span>
            <input class="auto-clean" type="checkbox" ${profile.autoClean ? 'checked="checked"' : ""} />
          </label>
          ${renderShortcutFields(profile)}
          ${renderExternalOpenFields(profile)}
        </div>
        <div class="profile-actions">
          <button type="button" class="primary" data-action="save">${t("saveButton")}</button>
          <button type="button" data-action="move-up" ${canMoveUp ? "" : 'disabled="disabled"'}>${t("moveUpButton")}</button>
          <button type="button" data-action="move-down" ${canMoveDown ? "" : 'disabled="disabled"'}>${t("moveDownButton")}</button>
          <button type="button" data-action="clean">${cleanLabel}</button>
          <button type="button" class="danger" data-action="delete">${t("deleteButton")}</button>
        </div>
      </div>
    </article>
  `;
}

function syncCardState(card) {
  card.dataset.proxyMode = card.querySelector(".proxy-mode").value;
  card.dataset.proxyType = card.querySelector(".proxy-type").value;
}

function populateCreateFormDefaults() {
  const form = document.querySelector("#create-form");
  const colorSelect = form.elements.namedItem("color");
  const selectedColor = colorSelect.value || DEFAULT_PROFILE_COLOR;
  const selectedIcon = form.elements.namedItem("icon")?.value || DEFAULT_PROFILE_ICON;
  replaceSelectOptions(
    colorSelect,
    CONTAINER_COLORS.map((color) =>
      createOptionNode(color, labelForColor(color), { selected: color === selectedColor })
    )
  );
  const pickerHost = document.querySelector("#create-icon-picker");
  pickerHost.replaceChildren(
    parseElementFromHtml(
      renderIconPicker("icon", "create-icon", selectedIcon, {
        color: "var(--text)"
      })
    )
  );
}
