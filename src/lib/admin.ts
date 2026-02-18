// Admin email list - add admin emails here
const ADMIN_EMAILS = [
  "admin@stepmeal.com",
  "jjjajh@naver.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
