export default function LoginButton(
  { userAuthenticated }: { userAuthenticated: boolean },
) {
  return userAuthenticated
    ? (
      <a
        class="btn btn-primary"
        role="button"
        href="/api/logout?mode=login"
        aria-label="Logout"
      >
        Logout
      </a>
    )
    : (
      <a
        class="btn btn-primary"
        role="button"
        href="/login?mode=login"
        aria-label="Login"
      >
        Login
      </a>
    );
}
