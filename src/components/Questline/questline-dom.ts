/* DOM ids accept only `[A-Za-z0-9_-]`; milestone ids are free-form. */
export function domFragment(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-')
}
