# Renovate Config
[Documentation](https://docs.renovatebot.com/config-presets/#github-hosted-presets)

## Validation
1. `export GITHUB_TOKEN=""` PAT from GitHub with R/O
1. `npx renovate`
1. `node validate-renovate-config.js .renovaterc`

TBD
`npx --yes renovate --dry-run --print-config`
