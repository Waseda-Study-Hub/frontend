const domains = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ??
  "fuji.waseda.jp,suou.waseda.jp"
)
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export const allowedEmailDomains = domains;
export const isAllowedEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at !== normalized.indexOf("@")) return false;
  const domain = normalized.slice(at + 1);
  return Boolean(domain && domains.includes(domain));
};

export const mapAuthError = (code: string) => {
  const messages: Record<string, string> = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/email-already-in-use": "An account already uses this email.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Check your connection and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/weak-password": "Use a password with at least eight characters.",
  };
  return messages[code] ?? "Authentication failed. Please try again.";
};
