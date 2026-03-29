const SCHEMA_VERSION = 1;
const OPEN_SLOT_COUNT = 9;
const CLEAN_SLOT_COUNT = 9;
const OPEN_SLOT_PREFIX = "open-slot-";
const CLEAN_SLOT_PREFIX = "clean-slot-";
const EXTERNAL_OPEN_PROTOCOL = "ext+automac";
const EXTERNAL_OPEN_ACTION = "open";
const RECONCILE_DELAY_MS = 500;
const AUTO_CLEAN_BLOCK_MS = 1500;
const ALLOWED_EXTERNAL_URL_PROTOCOLS = Object.freeze(["http:", "https:"]);
const PROXY_MODES = Object.freeze({
  INHERIT: "inherit",
  CUSTOM: "custom"
});
const PROXY_TYPES = Object.freeze(["http", "https", "socks", "socks4"]);
const CONTAINER_COLORS = Object.freeze([
  "blue",
  "turquoise",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "toolbar"
]);
const CONTAINER_ICONS = Object.freeze([
  "fingerprint",
  "briefcase",
  "dollar",
  "cart",
  "circle",
  "gift",
  "vacation",
  "food",
  "fruit",
  "pet",
  "tree",
  "chill",
  "fence"
]);
const CONTAINER_ICON_SYMBOLS = Object.freeze({
  fingerprint: "✋",
  briefcase: "💼",
  dollar: "💵",
  cart: "🛒",
  circle: "⬤",
  gift: "🎁",
  vacation: "🏖",
  food: "🍜",
  fruit: "🍎",
  pet: "🐾",
  tree: "🌲",
  chill: "❄",
  fence: "🪵"
});
const CLEAN_DATA_TYPES = Object.freeze({
  cookies: true,
  indexedDB: true,
  localStorage: true
});
const MESSAGE_TYPES = Object.freeze({
  LIST_PROFILES: "profiles.list",
  CREATE_PROFILE: "profile.create",
  IMPORT_PROFILE: "profile.import",
  UPDATE_PROFILE: "profile.update",
  REORDER_PROFILE: "profile.reorder",
  DELETE_PROFILE: "profile.delete",
  CLEAN_PROFILE: "profile.clean",
  OPEN_EXTERNAL_LINK: "profile.openExternalLink"
});
const OPEN_COMMANDS = Object.freeze(
  Array.from({ length: OPEN_SLOT_COUNT }, (_, index) => `${OPEN_SLOT_PREFIX}${index + 1}`)
);
const CLEAN_COMMANDS = Object.freeze(
  Array.from({ length: CLEAN_SLOT_COUNT }, (_, index) => `${CLEAN_SLOT_PREFIX}${index + 1}`)
);
const DEFAULT_PROFILE_COLOR = CONTAINER_COLORS[0];
const DEFAULT_PROFILE_ICON = CONTAINER_ICONS[0];
