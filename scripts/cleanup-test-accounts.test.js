const assert = require("node:assert/strict");
const test = require("node:test");

const {
  APPLY_FLAG,
  CONFIRM_DELETE_FLAG,
  EMAIL_FLAG,
  HELP_FLAG,
  batchImagePaths,
  collectOwnedImagePaths,
  parseArguments,
  removeAccount,
} = require("./cleanup-test-accounts");

test("generic cleanup targets unique normalized email arguments", () => {
  assert.deepEqual(
    parseArguments([EMAIL_FLAG, "Test-One@Example.com", EMAIL_FLAG, "test-one@example.com"]),
    { emails: ["test-one@example.com"], apply: false, help: false }
  );
});

test("generic cleanup requires both destructive flags", () => {
  const target = [EMAIL_FLAG, "test-one@example.com"];

  assert.deepEqual(
    parseArguments([...target, APPLY_FLAG, CONFIRM_DELETE_FLAG]),
    { emails: ["test-one@example.com"], apply: true, help: false }
  );
  assert.throws(() => parseArguments([...target, APPLY_FLAG]), /must be provided together/);
  assert.throws(() => parseArguments([...target, CONFIRM_DELETE_FLAG]), /must be provided together/);
});

test("generic cleanup rejects missing, malformed, and unrecognized arguments", () => {
  assert.deepEqual(parseArguments([HELP_FLAG]), { help: true });
  assert.throws(() => parseArguments([]), /At least one/);
  assert.throws(() => parseArguments([EMAIL_FLAG, "not-an-email"]), /Invalid email/);
  assert.throws(() => parseArguments(["--inactive-days", "90"]), /Unrecognized/);
});

test("batch paths only include string image paths", () => {
  assert.deepEqual(batchImagePaths([{ imagePaths: ["a/0.jpg", 1] }, null]), ["a/0.jpg"]);
});

test("image cleanup is limited to the analysis folder and deduplicated", () => {
  assert.deepEqual(
    collectOwnedImagePaths({
      id: "analysis-1",
      image_paths: ["analysis-1/0.jpg", "other-analysis/0.jpg"],
      image_generation_batches: [{ imagePaths: ["analysis-1/0.jpg", "analysis-1/1.jpg"] }],
    }, ["1.jpg", "2.jpg"]),
    ["analysis-1/0.jpg", "analysis-1/1.jpg", "analysis-1/2.jpg"]
  );
});

test("storage failure prevents Auth deletion", async () => {
  let authDeleteCalled = false;
  const supabase = {
    storage: {
      from: () => ({
        remove: async () => ({ error: { message: "storage unavailable" } }),
      }),
    },
    from: () => {
      throw new Error("analyses must not be touched after storage failure");
    },
    auth: {
      admin: {
        deleteUser: async () => {
          authDeleteCalled = true;
        },
      },
    },
  };

  await assert.rejects(
    removeAccount(supabase, { user: { id: "user-1" }, imagePaths: ["analysis-1/0.jpg"] }),
    /Unable to remove referenced images/
  );
  assert.equal(authDeleteCalled, false);
});
