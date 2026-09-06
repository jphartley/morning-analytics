const assert = require("node:assert/strict");
const test = require("node:test");

const {
  APPLY_FLAG,
  TEST_ACCOUNT_EMAILS,
  batchImagePaths,
  collectOwnedImagePaths,
  parseArguments,
} = require("./cleanup-first-use-test-accounts");

test("cleanup scope contains only the four confirmed test accounts", () => {
  assert.deepEqual(TEST_ACCOUNT_EMAILS, [
    "princess-daisy@morning.com",
    "princess-peanut@morning.com",
    "princess-donut@morning.com",
    "princess-peach@morning.com",
  ]);
});

test("arguments are dry-run by default and require the dedicated apply flag", () => {
  assert.deepEqual(parseArguments([]), { apply: false });
  assert.deepEqual(parseArguments([APPLY_FLAG]), { apply: true });
  assert.throws(() => parseArguments(["--email", "anyone@example.com"]), /Usage:/);
  assert.throws(() => parseArguments([APPLY_FLAG, "--verbose"]), /Usage:/);
});

test("batch paths only include string image paths", () => {
  assert.deepEqual(batchImagePaths([
    { imagePaths: ["a/0.jpg", 12] },
    { imagePaths: "not-an-array" },
    null,
  ]), ["a/0.jpg"]);
});

test("image cleanup is limited to the analysis folder and deduplicated", () => {
  const paths = collectOwnedImagePaths({
    id: "analysis-1",
    image_paths: ["analysis-1/0.jpg", "other-analysis/0.jpg"],
    image_generation_batches: [{ imagePaths: ["analysis-1/0.jpg", "analysis-1/1.jpg"] }],
  }, ["1.jpg", "2.jpg"]);

  assert.deepEqual(paths, ["analysis-1/0.jpg", "analysis-1/1.jpg", "analysis-1/2.jpg"]);
});
