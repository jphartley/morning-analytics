export function parseNodeVersion(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(value).trim());
  return match ? match.slice(1).map(Number) : null;
}

export function supportsNodeVersion(version, minimum) {
  const actual = parseNodeVersion(version);
  const required = parseNodeVersion(minimum);
  if (!actual || !required || actual[0] !== required[0]) return false;
  return actual[1] > required[1]
    || (actual[1] === required[1] && actual[2] >= required[2]);
}

// Probe only; callers decide whether to install, build, or serve after readiness.
export function resolveNodeToolchain({ requiredVersion, versionSelector = requiredVersion, queueVersion, executable, commandVersion }) {
  const required = parseNodeVersion(requiredVersion);
  if (!required) throw new Error("The Node runtime pin must be an explicit stable major.minor.patch version.");

  const pathNodeVersion = commandVersion("node", ["-v"]);
  const pathNodeMajor = parseNodeVersion(pathNodeVersion)?.[0] ?? null;
  const queueNodeMajor = parseNodeVersion(queueVersion)?.[0] ?? null;
  const base = {
    requiredMajor: required[0],
    requiredVersion,
    queueNodeVersion: queueVersion,
    queueNodeMajor,
    pathNodeVersion,
    pathNodeMajor,
    executable,
    instruction: `Run app commands with Node ${required[0]}.x >= ${requiredVersion}. Install the latest supported release with nvm install ${versionSelector}, or select it with fnm exec --using ${versionSelector} npm ci.`
  };

  // npm and its child processes use PATH; do not infer their version from the launcher.
  if (supportsNodeVersion(pathNodeVersion, requiredVersion)) {
    return {
      ...base,
      status: "passed",
      mode: "direct",
      commandPrefix: [],
      version: pathNodeVersion,
      major: pathNodeMajor,
      runner: "direct"
    };
  }

  const commandPrefix = ["fnm", "exec", "--using", versionSelector];
  const fnmVersion = commandVersion(commandPrefix[0], [...commandPrefix.slice(1), "node", "-v"]);
  if (supportsNodeVersion(fnmVersion, requiredVersion)) {
    return {
      ...base,
      status: "passed",
      mode: "fnm",
      commandPrefix,
      version: fnmVersion,
      major: parseNodeVersion(fnmVersion)[0],
      runner: commandPrefix.join(" ")
    };
  }

  return {
    ...base,
    status: "failed",
    mode: "unavailable",
    commandPrefix: null,
    version: pathNodeVersion || queueVersion,
    major: pathNodeMajor ?? queueNodeMajor,
    runner: null
  };
}
