function setExternalOpenStatus(message, isError = false) {
  const title = document.querySelector("#external-open-title");
  const status = document.querySelector("#external-open-status");
  title.textContent = isError ? t("externalOpenErrorTitle") : t("externalOpenPageTitle");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function closeExternalOpenTab() {
  const currentTab = await browser.tabs.getCurrent();
  if (currentTab?.id === undefined) {
    return false;
  }
  await browser.tabs.remove(currentTab.id);
  return true;
}

async function handleExternalOpenPage() {
  await loadLanguagePreference();
  document.title = t("externalOpenPageTitle");
  setExternalOpenStatus(t("externalOpenLoading"));
  const handledLink = new URL(window.location.href).searchParams.get("link");
  const payload = parseExternalOpenEnvelope(handledLink);
  await browser.runtime.sendMessage({ type: MESSAGE_TYPES.OPEN_EXTERNAL_LINK, payload });
  if (!(await closeExternalOpenTab())) {
    setExternalOpenStatus(t("externalOpenDone"));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void handleExternalOpenPage().catch((error) => {
    const message = readErrorMessage(error);
    setExternalOpenStatus(message, true);
  });
});
