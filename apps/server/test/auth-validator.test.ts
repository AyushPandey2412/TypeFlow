import assert from "node:assert/strict";
import test from "node:test";
import { credentialsSchema, registrationSchema } from "../src/validators/auth.validator.ts";

test("login accepts existing passwords without applying registration rules", () => {
  for (const password of ["oldpass", "12345678", "letters-only"]) {
    assert.equal(credentialsSchema.parse({ username: "existing-user", password }).password, password);
  }
  assert.equal(credentialsSchema.safeParse({ username: "existing-user", password: "" }).success, false);
});

test("registration still requires a strong password and normalizes email", () => {
  const input = { username: "new-user", email: " Person@Example.com " };
  for (const password of ["oldpass", "1234567890", "letters-only"]) {
    assert.equal(registrationSchema.safeParse({ ...input, password }).success, false);
  }
  assert.equal(registrationSchema.parse({ ...input, password: "StrongPass123" }).email, "person@example.com");
});

test("login accepts a normalized email or trimmed username", () => {
  assert.equal(credentialsSchema.parse({ username: " Person@Example.com ", password: "oldpass" }).username, "person@example.com");
  assert.equal(credentialsSchema.parse({ username: " existing-user ", password: "oldpass" }).username, "existing-user");
  assert.equal(credentialsSchema.safeParse({ username: "invalid email@", password: "oldpass" }).success, false);
});

test("registration keeps username restrictions and explains password failures", () => {
  const input = { username: "new-user", email: "person@example.com", password: "StrongPass123" };
  assert.equal(registrationSchema.safeParse({ ...input, username: input.email }).success, false);
  assert.equal(registrationSchema.safeParse({ ...input, username: "x".repeat(41) }).success, false);
  const result = registrationSchema.safeParse({ ...input, password: "lettersonly" });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues[0].message, "Password must include a number.");
});
