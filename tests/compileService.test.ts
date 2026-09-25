import assert from "node:assert/strict";
import test from "node:test";
import { isLatexCompilerEnabled } from "../src/lib/services/compileService";

test("defaults to enabled when Docker is available and the flag is unset", () => {
  const previous = process.env.LATEX_COMPILER_ENABLED;
  delete process.env.LATEX_COMPILER_ENABLED;

  try {
    assert.equal(isLatexCompilerEnabled({ dockerAvailable: true }), true);
  } finally {
    if (previous === undefined) delete process.env.LATEX_COMPILER_ENABLED;
    else process.env.LATEX_COMPILER_ENABLED = previous;
  }
});

test("honors an explicit opt-out", () => {
  const previous = process.env.LATEX_COMPILER_ENABLED;
  process.env.LATEX_COMPILER_ENABLED = "false";

  try {
    assert.equal(isLatexCompilerEnabled({ dockerAvailable: true }), false);
  } finally {
    if (previous === undefined) delete process.env.LATEX_COMPILER_ENABLED;
    else process.env.LATEX_COMPILER_ENABLED = previous;
  }
});
