// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { formLists, formValues } from "./form-values.ts";

test("formValues copies only the listed text fields", () => {
  const form = new FormData();
  form.set("email", "ana@example.com");
  form.set("password", "secret123");
  form.set("display_name", "");
  assert.deepEqual(formValues(form, ["email", "display_name"]), { email: "ana@example.com", display_name: "" });
});

test("formValues leaves out fields that were not sent", () => {
  assert.deepEqual(formValues(new FormData(), ["email"]), {});
});

test("formLists keeps every ticked box, and an empty list when none are ticked", () => {
  const form = new FormData();
  form.append("subjects", "math");
  form.append("subjects", "english");
  assert.deepEqual(formLists(form, ["subjects", "levels"]), { subjects: ["math", "english"], levels: [] });
});
