function readProfileForm(card) {
  return {
    profileId: card.dataset.profileId,
    name: card.querySelector(".profile-name").value,
    color: card.querySelector(".profile-color").value,
    icon: card.querySelector(".profile-icon").value,
    proxyMode: card.querySelector(".proxy-mode").value,
    customProxy: {
      type: card.querySelector(".proxy-type").value,
      host: card.querySelector(".proxy-host").value,
      port: card.querySelector(".proxy-port").value,
      proxyDNS: card.querySelector(".proxy-dns").checked
    },
    autoClean: card.querySelector(".auto-clean").checked
  };
}

async function sendMessage(type, payload) {
  return browser.runtime.sendMessage({ type, payload });
}

function renderLanguageSelector() {
  const select = document.querySelector("#language-select");
  replaceSelectOptions(
    select,
    POPUP_SUPPORTED_LANGUAGES.map((language) =>
      createOptionNode(language, labelForLanguageOption(language), {
        selected: language === popupLocale.preference
      })
    )
  );
}

function rerenderPopup(statusMessage = "", isError = false) {
  applyStaticTranslations();
  renderLanguageSelector();
  populateCreateFormDefaults();
  renderImportOptions();
  renderProfiles();
  setStatus(statusMessage, isError);
  syncBusyState();
}

async function refreshPopup(statusKey = "") {
  const [payload, commands] = await Promise.all([
    sendMessage(MESSAGE_TYPES.LIST_PROFILES),
    browser.commands.getAll()
  ]);
  popupState.profiles = payload.profiles;
  popupState.importableContainers = payload.importableContainers;
  popupState.commandsByName = Object.fromEntries(commands.map((command) => [command.name, command]));
  rerenderPopup(statusKey ? t(statusKey) : "");
}

async function createProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    name: form.elements.namedItem("name").value,
    color: form.elements.namedItem("color").value,
    icon: form.elements.namedItem("icon").value,
    proxyMode: PROXY_MODES.INHERIT,
    autoClean: false
  };
  await sendMessage(MESSAGE_TYPES.CREATE_PROFILE, payload);
  form.reset();
  form.elements.namedItem("color").value = DEFAULT_PROFILE_COLOR;
  form.elements.namedItem("icon").value = DEFAULT_PROFILE_ICON;
  await refreshPopup("statusCreated");
}

async function importProfile() {
  const select = document.querySelector("#import-select");
  if (!select.value) return;
  await sendMessage(MESSAGE_TYPES.IMPORT_PROFILE, { cookieStoreId: select.value });
  await refreshPopup("statusImported");
}

function handleIconPickerClick(event) {
  if (popupState.isBusy) return;
  const iconOption = event.target.closest(".icon-option");
  if (!iconOption) return;
  event.preventDefault();
  const pickerField = iconOption.closest(".icon-picker-field");
  if (!pickerField) return;
  const card = iconOption.closest(".profile-card");
  syncIconPicker(pickerField, iconOption.dataset.iconValue, iconPickerColorForCard(card));
}

async function handleCardAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".profile-card");
  const profileId = card.dataset.profileId;
  if (button.dataset.action === "toggle") {
    popupState.expandedProfileId = popupState.expandedProfileId === profileId ? null : profileId;
    rerenderPopup();
    return;
  }
  if (button.dataset.action === "save") {
    await sendMessage(MESSAGE_TYPES.UPDATE_PROFILE, readProfileForm(card));
    await refreshPopup("statusSaved");
    return;
  }
  if (button.dataset.action === "move-up" || button.dataset.action === "move-down") {
    await sendMessage(MESSAGE_TYPES.REORDER_PROFILE, {
      profileId,
      direction: button.dataset.action === "move-up" ? "up" : "down"
    });
    await refreshPopup("statusReordered");
    return;
  }
  if (button.dataset.action === "clean") {
    await sendMessage(MESSAGE_TYPES.CLEAN_PROFILE, { profileId });
    await refreshPopup("statusCleaned");
    return;
  }
  if (button.dataset.action === "delete" && confirm(t("confirmDelete"))) {
    if (popupState.expandedProfileId === profileId) popupState.expandedProfileId = null;
    await sendMessage(MESSAGE_TYPES.DELETE_PROFILE, { profileId });
    await refreshPopup("statusDeleted");
  }
}

function handleProfilesChange(event) {
  const card = event.target.closest(".profile-card");
  if (card) syncCardState(card);
}

async function guardedAction(action) {
  if (popupState.isBusy) return;
  popupState.isBusy = true;
  syncBusyState();
  try {
    setStatus(t("statusWorking"));
    await action();
  } catch (error) {
    setStatus(readErrorMessage(error), true);
  } finally {
    popupState.isBusy = false;
    syncBusyState();
  }
}

async function bootstrapPopup() {
  await loadLanguagePreference();
  rerenderPopup();
  document.querySelector("#create-form").addEventListener("submit", (event) => {
    void guardedAction(() => createProfile(event));
  });
  document.querySelector("#import-button").addEventListener("click", () => {
    void guardedAction(importProfile);
  });
  document.querySelector(".app-shell").addEventListener("click", handleIconPickerClick);
  document.querySelector("#language-select").addEventListener("change", (event) => {
    void guardedAction(async () => {
      await saveLanguagePreference(event.target.value);
      rerenderPopup(t("statusLanguageSaved"));
    });
  });
  document.querySelector("#profiles").addEventListener("click", (event) => {
    void guardedAction(() => handleCardAction(event));
  });
  document.querySelector("#profiles").addEventListener("change", handleProfilesChange);
  await refreshPopup();
}

void bootstrapPopup();
