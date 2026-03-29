const popupLocale = {
  preference: POPUP_LANGUAGE_AUTO,
  current: "en-US"
};

function normalizeLanguage(value) {
  const input = String(value || "").trim().toLowerCase();
  if (!input || input === POPUP_LANGUAGE_AUTO) return POPUP_LANGUAGE_AUTO;
  if (input === "en" || input === "en-us") return "en-US";
  if (input === "zh-tw" || input === "zh-hk" || input === "zh-mo" || input === "zh-hant") return "zh-TW";
  if (input.startsWith("zh")) return "zh-CN";
  return "en-US";
}

function detectBrowserLanguage() {
  try {
    if (typeof browser !== "undefined" && browser.i18n?.getUILanguage) {
      return browser.i18n.getUILanguage();
    }
  } catch (error) {
    void error;
  }
  return navigator.language || "en-US";
}

function getEffectiveLanguage(preference) {
  if (preference !== POPUP_LANGUAGE_AUTO) return preference;
  const detected = normalizeLanguage(detectBrowserLanguage());
  return detected === POPUP_LANGUAGE_AUTO ? "en-US" : detected;
}

function applyLanguage(preference) {
  popupLocale.preference = normalizeLanguage(preference);
  popupLocale.current = getEffectiveLanguage(popupLocale.preference);
  document.documentElement.lang = popupLocale.current;
}

async function loadLanguagePreference() {
  const data = await browser.storage.local.get(POPUP_LANGUAGE_STORAGE_KEY);
  applyLanguage(data[POPUP_LANGUAGE_STORAGE_KEY]);
}

async function saveLanguagePreference(preference) {
  const nextPreference = normalizeLanguage(preference);
  await browser.storage.local.set({ [POPUP_LANGUAGE_STORAGE_KEY]: nextPreference });
  applyLanguage(nextPreference);
}

function t(key, replacements = {}) {
  const current = POPUP_TRANSLATIONS[popupLocale.current] || POPUP_TRANSLATIONS["en-US"];
  const fallback = POPUP_TRANSLATIONS["en-US"];
  let message = current[key] || fallback[key] || key;
  for (const [name, value] of Object.entries(replacements)) {
    message = message.replaceAll(`{${name}}`, String(value));
  }
  return message;
}

function applyStaticTranslations() {
  document.title = t("heroTitle");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  }
}

function labelForColor(color) {
  return t(`color.${color}`);
}

function labelForIcon(iconName) {
  return t(`icon.${iconName}`);
}

function labelForProxyMode(mode) {
  return t(`proxyMode.${mode}`);
}

function labelForProxyType(type) {
  return t(`proxyType.${type}`);
}

function labelForLanguageOption(language) {
  return t(`language.${language}`);
}
