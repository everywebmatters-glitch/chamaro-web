import test from "node:test";
import assert from "node:assert/strict";
import { clearPersonalData, GUEST, removeLegacyData, SAVED_INFO_KEY, STORE_KEY, userKey } from "../app/lib/user-storage.ts";

// A minimal in-memory stand-in for the two browser storages.
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    keys: () => [...data.keys()].sort(),
  };
}

function withBrowser(local: ReturnType<typeof fakeStorage>, session: ReturnType<typeof fakeStorage>, run: () => void) {
  const original = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = { localStorage: local, sessionStorage: session };
  try {
    run();
  } finally {
    (globalThis as { window?: unknown }).window = original;
  }
}

test("every personal key carries the user's id, and a guest has its own", () => {
  assert.equal(userKey(STORE_KEY, "user-a"), "chamaro-store-v2:user-a");
  assert.equal(userKey(STORE_KEY, null), `chamaro-store-v2:${GUEST}`);
  assert.notEqual(userKey(STORE_KEY, "user-a"), userKey(STORE_KEY, "user-b"));
  assert.notEqual(userKey(SAVED_INFO_KEY, "user-a"), userKey(STORE_KEY, "user-a"));
});

test("keys written by earlier versions (shared by everyone on the browser) are deleted, never adopted", () => {
  const local = fakeStorage({ "chamaro-store-v1": "{}", "chamaro-checkout-info": '{"phone":"9"}', "chamaro-store-v2:user-a": "{}", other: "keep" });
  const session = fakeStorage({ "chamaro-auth": '{"token":"old"}', other: "keep" });
  withBrowser(local, session, () => removeLegacyData());
  assert.deepEqual(local.keys(), ["chamaro-store-v2:user-a", "other"]);
  assert.deepEqual(session.keys(), ["other"]);
});

test("logging out removes that user's saved delivery details and nobody else's", () => {
  const local = fakeStorage({
    [userKey(SAVED_INFO_KEY, "user-a")]: '{"address":"A"}',
    [userKey(SAVED_INFO_KEY, "user-b")]: '{"address":"B"}',
    [userKey(STORE_KEY, "user-a")]: '{"cart":[]}',
    "chamaro-checkout-info": '{"address":"shared"}',
  });
  withBrowser(local, fakeStorage(), () => clearPersonalData("user-a"));
  assert.deepEqual(local.keys(), [userKey(SAVED_INFO_KEY, "user-b"), userKey(STORE_KEY, "user-a")].sort());
});

test("storage that throws never breaks sign-out", () => {
  const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); }, removeItem: () => { throw new Error("denied"); } };
  withBrowser(broken as never, broken as never, () => {
    assert.doesNotThrow(() => clearPersonalData("user-a"));
    assert.doesNotThrow(() => removeLegacyData());
  });
});
