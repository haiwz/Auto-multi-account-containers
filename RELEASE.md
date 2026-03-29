# Release

This project is configured for `web-ext`-based packaging and AMO signing.

## Prerequisites

- Node.js LTS
- `npm install`
- An AMO API key and secret for signing

Mozilla documents `web-ext build`, `web-ext sign`, the `WEB_EXT_API_KEY` and
`WEB_EXT_API_SECRET` environment variables, and MV3 listed submission metadata
requirements here:

- https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/
- https://extensionworkshop.com/documentation/develop/web-ext-command-reference/

## Install Tooling

```bash
npm install
```

## Build a Package

```bash
npm run build
```

Artifacts are written to `artifacts/` by `web-ext-config.mjs`.

## Sign for Self-Distribution

```bash
export WEB_EXT_API_KEY="your-amo-jwt-issuer"
export WEB_EXT_API_SECRET="your-amo-jwt-secret"
npm run sign:unlisted
```

This produces a signed `.xpi` in `artifacts/`. Install that signed package in
Firefox to avoid the temporary-add-on restart behavior.

## Submit a Listed Version to AMO

```bash
export WEB_EXT_API_KEY="your-amo-jwt-issuer"
export WEB_EXT_API_SECRET="your-amo-jwt-secret"
npm run sign:listed
```

The first listed submission uses `amo/metadata-listed.json`, which includes the
required summary, categories, and license metadata for AMO.

## Before Signing an Update

1. Increase `version` in `manifest.json`.
2. Run `npm run build` or `npm run lint:ext`.
3. Re-run the appropriate signing command.
