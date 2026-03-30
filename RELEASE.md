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

## Local Credential File

Create a one-time local file at `.release-secrets.local` in the repository root.
It is ignored by Git and excluded from extension packages.

You can start from the committed example:

```bash
cp .release-secrets.example .release-secrets.local
```

Then fill in:

```bash
WEB_EXT_API_KEY="your-amo-jwt-issuer"
WEB_EXT_API_SECRET="your-amo-jwt-secret"
GH_TOKEN="your-github-token"
```

All release scripts below will load `.release-secrets.local` automatically, so
future conversations do not need you to re-export the variables in each shell.

## Build a Package

```bash
npm run build
```

Artifacts are written to `artifacts/` by `web-ext-config.mjs`.

## Sign for Self-Distribution

```bash
npm run sign:unlisted
```

This produces a signed `.xpi` in `artifacts/` and also copies it to the stable
name `artifacts/auto_multi-account_containers-{version}-signed.xpi`. Install
that signed package in Firefox to avoid the temporary-add-on restart behavior.

## Submit a Listed Version to AMO

```bash
npm run sign:listed
```

The first listed submission uses `amo/metadata-listed.json`, which includes the
required summary, categories, and license metadata for AMO.

## Publish GitHub Release

Preferred flow:

```bash
npm run release:github
```

If `GH_TOKEN` or `GITHUB_TOKEN` is present, `gh` will use it directly and
won't require browser login. The script expects these files to already exist:

- `artifacts/auto_multi-account_containers-{version}.zip`
- `artifacts/auto_multi-account_containers-{version}-signed.xpi`

If no GitHub token is set, the script falls back to the local `gh` login
session and exits with an explicit error when `gh auth status` is not valid.

## Before Signing an Update

1. Increase `version` in `manifest.json`.
2. Run `npm run build` or `npm run lint:ext`.
3. Re-run the appropriate signing command.
