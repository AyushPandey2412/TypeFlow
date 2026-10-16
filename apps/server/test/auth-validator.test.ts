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
