// React empties a form after every submit — even when the server says no.
// These copy what was typed out of the submitted form, so the form can be
// refilled after an error instead of making the person type it all again.
// Never list a password field here: passwords are not sent back.

// Text boxes, dropdowns and radio buttons: one value each.
export function formValues<K extends string>(form: FormData, fields: readonly K[]): Partial<Record<K, string>> {
  const values: Partial<Record<K, string>> = {};
  for (const k of fields) {
    const v = form.get(k);
    if (typeof v === "string") values[k] = v;
  }
  return values;
}

// Checkbox groups: every ticked value. An empty list means "none ticked",
// which matters — it must win over what was saved before.
export function formLists<K extends string>(form: FormData, fields: readonly K[]): Record<K, string[]> {
  const lists = {} as Record<K, string[]>;
  for (const k of fields) {
    lists[k] = form.getAll(k).filter((v): v is string => typeof v === "string");
  }
  return lists;
}
