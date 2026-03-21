import Navbar from "../components/Navbar/index.tsx";
import { define } from "../utils.ts";

export default define.page(function App({ Component, state }) {
  return (
    <html lang="en" data-theme={state.theme}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>reelcipe</title>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
      </head>
      <body class="min-h-screen flex flex-col">
        <Navbar userAuthenticated={!!state.authenticated} />
        <main class="flex-1">
          <Component />
        </main>
      </body>
    </html>
  );
});
