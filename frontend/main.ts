import { App, staticFiles } from "fresh";
import { authMiddleware } from "./middlewares/auth.ts";
import { themeMiddleware } from "./middlewares/theme.ts";

import { type State } from "./utils.ts";
import { exampleLoggerMiddleware } from "./middlewares/logger.ts";
import { authGuardMiddleware } from "./middlewares/auth-guard.ts";

export const app = new App<State>();

app.use(staticFiles());
app.use(exampleLoggerMiddleware);
app.use(themeMiddleware);
app.use(authMiddleware);
app.use(authGuardMiddleware);

app.fsRoutes();
