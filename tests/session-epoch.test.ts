import test from "node:test";
import assert from "node:assert/strict";
import { createSessionEpoch } from "../app/lib/session-epoch.ts";

test("an answer to a check sent before a sign-in is stale once the sign-in happened", () => {
  const epoch = createSessionEpoch();
  const started = epoch.begin(); // page-load check: "is there a session?"
  assert.equal(epoch.isStale(started), false, "nothing has happened yet");
  epoch.bump(); // the shopper signs in (Google callback) while the check is on its way
  assert.equal(epoch.isStale(started), true, "its late 'no session' answer must be ignored");
});

test("a check sent after the sign-in is current; a log out makes earlier checks stale again", () => {
  const epoch = createSessionEpoch();
  epoch.bump();
  const afterSignIn = epoch.begin();
  assert.equal(epoch.isStale(afterSignIn), false);
  epoch.bump(); // log out
  assert.equal(epoch.isStale(afterSignIn), true);
});
