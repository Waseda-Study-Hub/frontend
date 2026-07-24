const allowedWasedaDomains = new Set([
  "waseda.jp",
  "akane.waseda.jp",
  "asagi.waseda.jp",
  "fuji.waseda.jp",
  "moegi.waseda.jp",
  "ruri.waseda.jp",
  "suou.waseda.jp",
  "toki.waseda.jp",
  "aoni.waseda.jp",
  "kurenai.waseda.jp",
]);

export function isAllowedWasedaEmail(email: string) {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 && allowedWasedaDomains.has(parts[1]);
}
