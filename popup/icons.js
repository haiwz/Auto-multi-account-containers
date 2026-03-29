function iconMaskStyle(iconName, iconUrl, color) {
  const resolvedIconUrl = resolveContainerIconUrl(iconName, iconUrl);
  return `--icon-mask:url('${escapeHtml(resolvedIconUrl)}'); --icon-color:${escapeHtml(color)};`;
}

function renderIconGlyph(iconName, options = {}) {
  const {
    iconUrl = "",
    color = "var(--text)",
    className = "",
    title = "",
    selected = false
  } = options;
  const classes = ["container-icon", className, selected ? "selected" : ""].filter(Boolean).join(" ");
  return `<span class="${classes}" title="${escapeHtml(title)}" style="${iconMaskStyle(iconName, iconUrl, color)}"></span>`;
}

function renderIconPicker(fieldName, fieldClass, selectedIcon, options = {}) {
  const {
    iconUrl = "",
    color = "var(--text)",
    pickerClass = ""
  } = options;
  return `
    <div class="icon-picker-field ${pickerClass}">
      <input type="hidden" name="${escapeHtml(fieldName)}" class="${escapeHtml(fieldClass)}" value="${escapeHtml(selectedIcon)}" />
      <details class="icon-picker" data-icon-picker>
        <summary class="icon-picker-trigger" title="${escapeHtml(labelForIcon(selectedIcon))}">
          ${renderIconGlyph(selectedIcon, { iconUrl, color, title: labelForIcon(selectedIcon), className: "icon-picker-current" })}
          <span class="icon-picker-caret" aria-hidden="true"></span>
        </summary>
        <div class="icon-picker-grid">
          ${CONTAINER_ICONS.map((iconName) => {
            const isSelected = iconName === selectedIcon;
            return `
              <button
                type="button"
                class="icon-option ${isSelected ? "selected" : ""}"
                data-icon-value="${escapeHtml(iconName)}"
                aria-label="${escapeHtml(labelForIcon(iconName))}"
                title="${escapeHtml(labelForIcon(iconName))}">
                ${renderIconGlyph(iconName, {
                  color,
                  title: labelForIcon(iconName),
                  selected: isSelected
                })}
              </button>
            `;
          }).join("")}
        </div>
      </details>
    </div>
  `;
}

function syncIconPicker(pickerField, iconName, color = "var(--text)", iconUrl = "") {
  const hiddenInput = pickerField.querySelector('input[type="hidden"]');
  const currentGlyph = pickerField.querySelector(".icon-picker-current");
  const trigger = pickerField.querySelector(".icon-picker-trigger");
  const options = pickerField.querySelectorAll(".icon-option");
  if (!hiddenInput || !currentGlyph || !trigger) return;

  hiddenInput.value = iconName;
  currentGlyph.setAttribute("style", iconMaskStyle(iconName, iconUrl, color));
  currentGlyph.setAttribute("title", labelForIcon(iconName));
  trigger.setAttribute("title", labelForIcon(iconName));

  for (const option of options) {
    const isSelected = option.dataset.iconValue === iconName;
    option.classList.toggle("selected", isSelected);
    option.querySelector(".container-icon")?.classList.toggle("selected", isSelected);
  }

  const details = pickerField.querySelector("details");
  if (details) {
    details.open = false;
  }
}

function iconPickerColorForCard(card) {
  return card?.style.getPropertyValue("--container-accent").trim() || "var(--text)";
}

function syncIconPickerColor(pickerField, color, iconUrl = "") {
  const hiddenInput = pickerField.querySelector('input[type="hidden"]');
  const currentGlyph = pickerField.querySelector(".icon-picker-current");
  if (!hiddenInput || !currentGlyph) return;

  const iconName = hiddenInput.value;
  currentGlyph.setAttribute("style", iconMaskStyle(iconName, iconUrl, color));
  for (const option of pickerField.querySelectorAll(".icon-option .container-icon")) {
    const optionIconName = option.closest(".icon-option")?.dataset.iconValue;
    if (!optionIconName) continue;
    option.setAttribute("style", iconMaskStyle(optionIconName, "", color));
  }
}
