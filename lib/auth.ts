export function checkAuth(request: Request): boolean {
  const token = process.env.API_TOKEN;
  if (!token) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${token}`;
}
