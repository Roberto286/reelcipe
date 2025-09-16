import { define } from "../utils.ts";
import ThemeToggle from "../islands/theme-toggle.tsx";
import { Head } from "fresh/runtime";

export default define.page(function Home(ctx) {
  return (
    <div class="px-4 py-8 mx-auto  min-h-screen">
      <Head>
        <title>Fresh counter</title>
      </Head>
      <ThemeToggle />
    </div>
  );
});
