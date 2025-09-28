import ThemeToggle from "../islands/theme-toggle.tsx";
import { define } from "../utils.ts";

export type NavbarProps = {
  userAuthenticated: boolean;
};

export default function Navbar(props: NavbarProps) {
  return (
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <div class="dropdown">
          <div tabIndex={0} role="button" class="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
        </div>
        <a class="btn btn-ghost text-xl" href="/">Openrecipes</a>
      </div>
      <div class="navbar-center hidden lg:flex">
      </div>
      <div class="navbar-end gap-2 items-end">
        <ThemeToggle />
        {props.userAuthenticated
          ? <a class="btn btn-primary" href="/api/logout?mode=login">Logout</a>
          : <a class="btn btn-primary" href="/login?mode=login">Login</a>}
      </div>
    </div>
  );
}
