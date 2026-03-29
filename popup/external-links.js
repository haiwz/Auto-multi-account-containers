function buildProfileExternalLinks(profile) {
  return {
    stableLink: buildExternalOpenLink({ profileId: profile.profileId }, "https://example.com"),
    slotLink: profile.openShortcutSlot
      ? buildExternalOpenLink({ slot: profile.openShortcutSlot }, "https://example.com")
      : ""
  };
}

function renderExternalOpenFields(profile) {
  const links = buildProfileExternalLinks(profile);
  return `
    <section class="external-links-panel field-span-full">
      <p class="section-label">${escapeHtml(t("externalOpenTitle"))}</p>
      <label class="field-span-full">
        <span>${escapeHtml(t("externalOpenStableLabel"))}</span>
        <input type="text" readonly="readonly" value="${escapeHtml(links.stableLink)}" />
      </label>
      ${
        links.slotLink ?
          `<label class="field-span-full">
            <span>${escapeHtml(t("externalOpenSlotLabel", { slot: profile.openShortcutSlot }))}</span>
            <input type="text" readonly="readonly" value="${escapeHtml(links.slotLink)}" />
          </label>` :
          ""
      }
      <p class="external-link-note">${escapeHtml(t("externalOpenHint"))}</p>
    </section>
  `;
}
