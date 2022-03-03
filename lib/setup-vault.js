const os = require('os');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const releases = require('@hashicorp/js-releases');
const { Octokit } = require("@octokit/rest");

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch) {
  const mappings = {
    x32: '386',
    x64: 'amd64',
    arm: 'arm64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
  const mappings = {
    darwin: 'darwin',
    win32: 'windows',
    linux: 'linux'
  };
  return mappings[os] || os;
}

function getOctokit() {
  const options = {};
  const token = core.getInput('github_token');
  if (token) {
    core.debug('Using token authentication for Octokit');
    options.auth = token;
  }

  return new Octokit(options);
}

async function resolveReleaseData(version) {
  let releaseVersion = null;

  let params = {
      owner: 'hashicorp',
      repo: 'vault',
      headers: {
          accept: 'application/vnd.github.v3+json',
      }
  }

  if ((!version) || (version.toLowerCase() === 'latest')) {
      core.info("Get release info for latest version")
      const octokit = new getOctokit();
      const releaseTag = await octokit.repos.getLatestRelease(params).then(result => {
          return result.data.name;
      })
      releaseVersion = releaseTag.replace('v','');
  } else {
      releaseVersion = version;
  }

  return releaseVersion
}


async function getDownloadObject(version) {
  // Gather OS details
  const osPlatform = os.platform();
  const osArch = os.arch();

  core.debug(`Finding releases for Vault version ${version}`);
  const release = await releases.getRelease('vault', version, 'GitHub Action: Setup Vault CLI');
  const platform = mapOS(osPlatform);
  const arch = mapArch(osArch);
  
  core.debug(`Getting build for Vault version ${release.version}: ${platform} ${arch}`);
  const build = release.getBuild(platform, arch);
  if (!build) {
    throw new Error(`Vault version ${version} not available for ${platform} and ${arch}`);
  }

  const fullUrl = build.url;
  return {
    fullUrl
  };
}

function isInstalled(version) {
  let toolPath;
  if (version) {
    toolPath = tc.find('vault', version);
    return toolPath != undefined && toolPath !== '';
  }
  toolPath = tc.findAllVersions('vault');
  return toolPath.length > 0;
}


async function downloadCLI (url) {
  core.debug(`Downloading Vault CLI from ${url}`);
  const pathToCLIZip = await tc.downloadTool(url);

  core.debug('Extracting Vault CLI zip file');
  const pathToCLI = await tc.extractZip(pathToCLIZip);
  core.debug(`Vault CLI path is ${pathToCLI}.`);

  if (!pathToCLIZip || !pathToCLI) {
    throw new Error(`Unable to download Vault from ${url}`);
  }

  return pathToCLI;
}

async function run() {
  try {
    // Get version of vault cli to be installed
    const version = core.getInput('vault_version');
    // Install the vault if not already present
    if (!isInstalled(version)) {
      // Download the specific version of the vault
      const releaseVersion = await resolveReleaseData(version);
      const download = await getDownloadObject(releaseVersion);
      const pathToCLI = await downloadCLI(download.fullUrl);
      const cachedPath = await tc.cacheDir(pathToCLI, 'vault', version);
      // Expose vault cli by adding it to the PATH
      core.addPath(cachedPath);
    } else {
        const toolPath = tc.find('vault', version);
        core.addPath(toolPath);
    }
  } catch (error) {
    core.error(error);
    throw error;
  }
}

module.exports = run;
