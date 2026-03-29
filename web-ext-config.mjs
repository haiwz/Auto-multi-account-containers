const signConfig =
  process.env.WEB_EXT_API_KEY && process.env.WEB_EXT_API_SECRET
    ? {
        sign: {
          apiKey: process.env.WEB_EXT_API_KEY,
          apiSecret: process.env.WEB_EXT_API_SECRET
        }
      }
    : {};

export default {
  sourceDir: ".",
  artifactsDir: "artifacts",
  ignoreFiles: [
    ".amo-upload-uuid",
    ".gitignore",
    "artifacts/**",
    "amo/**",
    "node_modules/**",
    ".DS_Store",
    "npm-debug.log*",
    "package-lock.json",
    "package.json",
    "RELEASE.md",
    "web-ext-config.mjs"
  ],
  build: {
    overwriteDest: true,
    filename: "{name}-{version}.zip"
  },
  ...signConfig
};
