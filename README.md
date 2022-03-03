# setup-vault

<p align="left">
  <a href="https://github.com/eLco/setup-vault/actions"><img alt="setup-vault status" src="https://github.com/eLco/setup-vault/workflows/Tests/badge.svg"></a>
</p>

## About

The `eLco/setup-vault` action is a JavaScript action that sets up [Vault CLI](https://www.vaultproject.io/) in your GitHub Actions workflow by:

- Downloading a specific version of Vault CLI and adding it to the `PATH`.

After you've used the action, subsequent steps in the same job can run arbitrary vault commands using [the GitHub Actions `run` syntax](https://help.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepsrun). This allows most vault commands to work exactly like they do on your local command line.

## Usage

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners, and will install and expose a specified version of the `vault` CLI on the runner environment.

The default configuration installs the latest version of vault CLI.

Setup the `vault` CLI:

```yaml
steps:
  - uses: eLco/setup-vault@v1
```

A specific version of the `vault` CLI can be installed:

```yaml
steps:
  - uses: eLco/setup-vault@v1
    with:
      vault_version: 1.8.7
```

A specific version of the `vault` CLI can be installed, using personal github token:

```yaml
steps:
  - uses: eLco/setup-vault@v1
    with:
      vault_version: 1.8.7
      github_token: ${{ secrets.PERSONAL_GITHUB_TOKEN }}
```

## Inputs

The actions supports the following inputs:

- `vault_version`: (optional) The version of `vault` to install, defaulting to `latest`
- `github_token`: (optional) if set, github_token will be used for Octokit authentication. Defaulting to GitHub App installation access token.

## License

[MIT](LICENSE).
