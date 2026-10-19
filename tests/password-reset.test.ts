import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readResetToken } from "../app/lib/password-reset.ts";

// Same shape as the backend's tokens: 32 random bytes, base64url (43 characters)
const TOKEN = randomBytes(32).toString("base64url");

test("reads a well-formed token from the fragment", () => {
  assert.equal(TOKEN.length, 43);
  assert.equal(readResetToken(`#token=${TOKEN}`), TOKEN);
  assert.equal(readResetToken(`token=${TOKEN}`), TOKEN);
});

test("missing, empty or malformed tokens are refused", () => {
  for (const hash of ["", "#", "#token=", "#code=abc", `#token=${TOKEN}x`, `#token=${TOKEN.slice(1)}`, `#token=${TOKEN.slice(1)}=`, "#token=<script>alert(1)</script>"]) {
    assert.equal(readResetToken(hash), null, hash);
  }
});
