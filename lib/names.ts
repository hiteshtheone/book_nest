const NAME_RE = /^[\p{L}][\p{L}\p{M}\p{N} .'\u2019-]{0,59}$/u;

export function cleanName(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function sameName(a: string, b: string): boolean {
  return cleanName(a).toLocaleLowerCase() === cleanName(b).toLocaleLowerCase();
}

export function validName(input: string): boolean {
  return NAME_RE.test(cleanName(input));
}

export function validPassword(input: string): boolean {
  return input.length >= 4 && input.length <= 200;
}

/** Age appears beside a name only when the person is under 18. */
export function nameWithAge(name: string, age: number | null | undefined): string {
  if (typeof age === "number" && age < 18) return `${name}, ${age}`;
  return name;
}
