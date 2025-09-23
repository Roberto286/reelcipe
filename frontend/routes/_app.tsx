import Navbar from "../components/Navbar.tsx";
import { define } from "../utils.ts";

export default define.page(function App({ Component, state }) {
  return (
    <html data-theme={state.theme}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>frontend</title>
      </head>
      <body>
        <Navbar />
        <Component />
      </body>
    </html>
  );
});
