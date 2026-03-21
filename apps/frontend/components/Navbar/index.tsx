import ThemeToggle from "../../islands/theme-toggle.tsx";
import LoginButton from "../login-button.tsx";
import MobileDropdown from "./mobile-dropdown.tsx";
import { NAV_ITEMS } from "./nav-items.ts";

export type NavbarProps = {
  userAuthenticated: boolean;
};

export default function Navbar(props: NavbarProps) {
  return (
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        {props.userAuthenticated && <MobileDropdown />}
        <a class="btn btn-ghost text-xl gap-2" href="/" aria-label="reelcipe Home">
          <img src="/logo.svg" alt="reelcipe logo" class="w-8 h-8" />
          <span class="hidden sm:inline font-bold text-lg">reelcipe</span>
        </a>
      </div>
      {props.userAuthenticated && (
        <div class="navbar-center hidden lg:flex">
          <ul class="menu menu-horizontal px-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <a href={item.path}>{item.name}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div class="navbar-end gap-2 items-end">
        <ThemeToggle />
        <LoginButton userAuthenticated={props.userAuthenticated} />
      </div>
    </div>
  );
}
