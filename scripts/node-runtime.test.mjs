import assert from "node:assert/strict";
import test from "node:test";
import { resolveNodeToolchain, supportsNodeVersion } from "./node-runtime.mjs";

function probe({ pathVersion, fallbackVersion = null, queueVersion = "v22.23.4" }) {
  const commands = [];
  const runtime = resolveNodeToolchain({
    requiredVersion: "22.23.4",
    versionSelector: "22",
    queueVersion,
    executable: "/runtime/launcher/node",
    commandVersion(command, args) {
      commands.push([command, ...args]);
      return command === "node" ? pathVersion : fallbackVersion;
    }
  });
  return { runtime, commands };
}

test("readiness enforces the security floor within the supported major line", () => {
  for (const version of ["v22.23.3", "v22.9.99", "v20.99.99", "v24.0.0", "v22.23.4-rc.1", null]) {
    assert.equal(supportsNodeVersion(version, "22.23.4"), false, String(version));
  }
  for (const version of ["v22.23.4", "22.23.5", "v22.24.0"]) {
    assert.equal(supportsNodeVersion(version, "22.23.4"), true, version);
  }
});

test("a patched launcher does not make a below-floor PATH runtime ready", () => {
  const { runtime } = probe({ pathVersion: "v22.23.3" });
  assert.equal(runtime.status, "failed");
  assert.equal(runtime.version, "v22.23.3");
  assert.equal(runtime.commandPrefix, null);
  assert.match(runtime.instruction, /22\.23\.4/);
});

test("a patched PATH runtime selects the actual child runtime despite an older launcher", () => {
  const { runtime, commands } = probe({ pathVersion: "v22.24.0", queueVersion: "v20.19.0" });
  assert.equal(runtime.status, "passed");
  assert.equal(runtime.version, "v22.24.0");
  assert.equal(runtime.queueNodeVersion, "v20.19.0");
  assert.deepEqual(runtime.commandPrefix, []);
  assert.deepEqual(commands, [["node", "-v"]]);
});

test("fallback selects the supported release line and verifies its security minimum", () => {
  const { runtime, commands } = probe({ pathVersion: "v24.0.0", fallbackVersion: "v22.23.4" });
  assert.equal(runtime.status, "passed");
  assert.equal(runtime.version, "v22.23.4");
  assert.deepEqual(runtime.commandPrefix, ["fnm", "exec", "--using", "22"]);
  assert.deepEqual(commands[1], ["fnm", "exec", "--using", "22", "node", "-v"]);
});

test("an unsupported fallback cannot grant readiness", () => {
  for (const fallbackVersion of ["v22.23.3", "v24.23.4", "unknown", null]) {
    const { runtime } = probe({ pathVersion: null, fallbackVersion });
    assert.equal(runtime.status, "failed");
  }
});

test("a broad or malformed runtime pin fails before probing commands", () => {
  assert.throws(() => resolveNodeToolchain({
    requiredVersion: "22",
    commandVersion() { assert.fail("must not probe an invalid requirement"); }
  }), /explicit stable/);
});
