import { Hono, Next } from "jsr:@hono/hono";
import { cors } from "jsr:@hono/hono/cors";
import { logger } from "jsr:@hono/hono/logger";
import { HTTPException } from "jsr:@hono/hono/http-exception";
import { createClient, User } from "jsr:@supabase/supabase-js@2";
import { Context } from "node:vm";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);
const app = new Hono();
type CustomContext = Context & {
  get(key: "user"): User;
  get(key: "token"): string;
  get(key: string): unknown;
};
// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Utility functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return !!password && password.length >= 6;
};

const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split("Bearer ")[1];
};

// Middleware per validazione token
const requireAuth = async (c: CustomContext, next: Next) => {
  const token = extractToken(c.req.header("Authorization"));

  if (!token) {
    throw new HTTPException(401, {
      message: "Missing or invalid Authorization header",
    });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HTTPException(401, {
      message: error?.message || "Invalid token",
    });
  }

  c.set("user", data.user);
  c.set("token", token);
  await next();
};

// ==========================================
// CORE AUTHENTICATION ENDPOINTS
// ==========================================

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "Supabase Auth Service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (c) => {
  try {
    // Test connessione Supabase
    const { error } = await supabase.auth.getSession();

    if (error) {
      return c.json({
        status: "unhealthy",
        error: "Cannot connect to Supabase",
        timestamp: new Date().toISOString(),
      }, 503);
    }

    return c.json({
      status: "healthy",
      service: "auth-service",
      supabase_connected: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(error);
    return c.json({
      status: "unhealthy",
      error: "Service error",
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

// Registrazione utente
app.post("/signup", async (c) => {
  try {
    const { email, password, metadata } = await c.req.json();

    if (!email || !password) {
      throw new HTTPException(400, { message: "Missing email or password" });
    }

    if (!validateEmail(email)) {
      throw new HTTPException(400, { message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      throw new HTTPException(400, {
        message: "Password must be at least 6 characters long",
      });
    }

    const signUpData = {
      email,
      password,
      options: metadata ? { data: metadata } : undefined,
    };

    const { data, error } = await supabase.auth.signUp(signUpData);

    if (error) {
      throw new HTTPException(400, { message: error.message });
    }

    return c.json({
      message: "User created successfully",
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !data.session,
    }, 201);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});
function parseMessage(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error
    ? (error as { message: string }).message
    : String(error);
}

// Login con email + password
app.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      throw new HTTPException(400, { message: "Missing email or password" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new HTTPException(401, { message: error.message });
    }

    return c.json({
      message: "Login successful",
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// Logout
app.post("/logout", requireAuth, async (c) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new HTTPException(400, { message: error.message });
    }

    return c.json({ message: "Logout successful" });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

// Refresh token
app.post("/refresh", async (c) => {
  try {
    const body = await c.req.json();
    const refresh_token = body.refresh_token || body.refreshToken;

    if (!refresh_token) {
      throw new HTTPException(400, { message: "Missing refresh_token" });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      throw new HTTPException(401, { message: error.message });
    }

    return c.json({
      message: "Token refreshed successfully",
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// Verifica token
app.get("/verify", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));

    if (!token) {
      throw new HTTPException(401, {
        message: "Missing or invalid Authorization header",
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new HTTPException(401, {
        message: error?.message || "Invalid token",
      });
    }

    return c.json({
      valid: true,
      user: user,
      token: token,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(401, { message: "Token verification failed" });
  }
});

// Validazione e refresh combinati (per il Bot)
app.post("/session/validate-and-refresh", async (c) => {
  try {
    const { access_token, refresh_token } = await c.req.json();

    if (!access_token) {
      throw new HTTPException(400, { message: "Missing access_token" });
    }

    // Prima prova a validare l'access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      access_token,
    );

    if (!userError && user) {
      return c.json({
        valid: true,
        user: user,
        token: access_token,
        refreshed: false,
      });
    }

    // Se access token non valido, prova refresh
    if (!refresh_token) {
      throw new HTTPException(401, {
        message: "Token invalid and no refresh_token provided",
      });
    }

    const { data: refreshData, error: refreshError } = await supabase.auth
      .refreshSession({
        refresh_token,
      });

    if (refreshError || !refreshData.session) {
      throw new HTTPException(401, {
        message: "Token invalid and refresh failed",
      });
    }

    return c.json({
      valid: true,
      user: refreshData.user,
      token: refreshData.session.access_token,
      refresh_token: refreshData.session.refresh_token,
      expires_at: refreshData.session.expires_at,
      refreshed: true,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// ==========================================
// USER PROFILE MANAGEMENT
// ==========================================

// Get user info
app.get("/user", requireAuth, (c: CustomContext) => {
  const user = c.get("user");

  return c.json({
    user: user,
    metadata: user.user_metadata,
    app_metadata: user.app_metadata,
  });
});

// Update user profile
app.patch("/user", requireAuth, async (c) => {
  try {
    const updates = await c.req.json();

    // Rimuovi campi che non dovrebbero essere aggiornati direttamente
    const {
      id: _id,
      email: _email,
      created_at: _created_at,
      updated_at: _updated_at,
      ...allowedUpdates
    } = updates;

    if (Object.keys(allowedUpdates).length === 0) {
      throw new HTTPException(400, { message: "No valid fields to update" });
    }

    const { data, error } = await supabase.auth.updateUser({
      data: allowedUpdates,
    });

    if (error) {
      throw new HTTPException(400, { message: error.message });
    }

    return c.json({
      message: "Profile updated successfully",
      user: data.user,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// ==========================================
// PASSWORD MANAGEMENT
// ==========================================

// Reset password
app.post("/reset-password", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      throw new HTTPException(400, { message: "Missing email" });
    }

    if (!validateEmail(email)) {
      throw new HTTPException(400, { message: "Invalid email format" });
    }

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:3500";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/reset-password`,
    });

    if (error) {
      throw new HTTPException(400, { message: error.message });
    }

    return c.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// Update password
app.post("/update-password", requireAuth, async (c) => {
  try {
    const { password } = await c.req.json();

    if (!password) {
      throw new HTTPException(400, { message: "Missing password" });
    }

    if (!validatePassword(password)) {
      throw new HTTPException(400, {
        message: "Password must be at least 6 characters long",
      });
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new HTTPException(400, { message: error.message });
    }

    return c.json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// ==========================================
// TELEGRAM INTEGRATION
// ==========================================

// Link Telegram account (chiamato dal frontend dopo login)
app.post("/link-telegram", requireAuth, async (c: CustomContext) => {
  try {
    const { telegram_id, telegram_username } = await c.req.json();

    if (!telegram_id || typeof telegram_id !== "number") {
      throw new HTTPException(400, {
        message: "Missing or invalid telegram_id",
      });
    }

    // Aggiorna metadata utente con info Telegram
    const updateData = {
      telegram_id: telegram_id.toString(),
      telegram_username: "",
    };

    if (telegram_username) {
      updateData.telegram_username = telegram_username;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updateData,
    });

    if (error) {
      throw new HTTPException(400, { message: error.message });
    }

    return c.json({
      message: "Telegram account linked successfully",
      user: data.user,
      telegram_id: telegram_id,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// Get user by Telegram ID (per servizi interni)
app.get("/user-by-telegram/:telegram_id", async (c) => {
  try {
    const telegram_id = c.req.param("telegram_id");
    const serviceKey = c.req.header("X-Service-Key");

    // Verifica che la richiesta venga da un servizio autorizzato
    const expectedServiceKey = Deno.env.get("INTERNAL_SERVICE_KEY");
    if (!serviceKey || serviceKey !== expectedServiceKey) {
      throw new HTTPException(401, { message: "Unauthorized service" });
    }

    if (!telegram_id) {
      throw new HTTPException(400, { message: "Missing telegram_id" });
    }

    // Query users tramite Supabase Admin API
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw new HTTPException(500, { message: "Failed to query users" });
    }

    const user = data.users.find((u) =>
      u.user_metadata?.telegram_id === telegram_id
    );

    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        created_at: user.created_at,
      },
      supabase_user_id: user.id,
      telegram_id: telegram_id,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(500, { message });
  }
});

// Endpoint per il Bot - verifica token e associa telegram_id
app.post("/bot/verify-and-link", async (c) => {
  try {
    const { access_token, refresh_token, telegram_id } = await c.req.json();
    const serviceKey = c.req.header("X-Service-Key");

    // Verifica service key
    const expectedServiceKey = Deno.env.get("INTERNAL_SERVICE_KEY");
    if (!serviceKey || serviceKey !== expectedServiceKey) {
      throw new HTTPException(401, { message: "Unauthorized service" });
    }

    if (!access_token || !telegram_id) {
      throw new HTTPException(400, {
        message: "Missing access_token or telegram_id",
      });
    }

    // Verifica access token
    let { data: { user }, error } = await supabase.auth.getUser(access_token);
    let currentToken = access_token;
    let refreshed = false;

    // Se token non valido, prova refresh
    if (error && refresh_token) {
      const { data: refreshData, error: refreshError } = await supabase.auth
        .refreshSession({
          refresh_token,
        });

      if (!refreshError && refreshData.session) {
        user = refreshData.user;
        currentToken = refreshData.session.access_token;
        refreshed = true;
        error = null;
      }
    }

    if (error || !user) {
      throw new HTTPException(401, { message: "Invalid or expired tokens" });
    }

    // Se l'utente non ha telegram_id, aggiungilo
    if (!user.user_metadata?.telegram_id) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            telegram_id: telegram_id.toString(),
          },
        },
      );

      if (updateError) {
        console.error("Failed to link telegram_id:", updateError);
      }
    }

    return c.json({
      valid: true,
      user: user,
      token: currentToken,
      refreshed: refreshed,
      telegram_linked: true,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// ==========================================
// SESSION MANAGEMENT
// ==========================================

// Validazione e refresh combinati
app.post("/session/validate-and-refresh", async (c) => {
  try {
    const { access_token, refresh_token } = await c.req.json();

    if (!access_token) {
      throw new HTTPException(400, { message: "Missing access_token" });
    }

    // Prima prova a validare l'access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      access_token,
    );

    if (!userError && user) {
      return c.json({
        valid: true,
        user: user,
        token: access_token,
        refreshed: false,
      });
    }

    // Se access token non valido, prova refresh
    if (!refresh_token) {
      throw new HTTPException(401, {
        message: "Token invalid and no refresh_token provided",
      });
    }

    const { data: refreshData, error: refreshError } = await supabase.auth
      .refreshSession({
        refresh_token,
      });

    if (refreshError || !refreshData.session) {
      throw new HTTPException(401, {
        message: "Token invalid and refresh failed",
      });
    }

    return c.json({
      valid: true,
      user: refreshData.user,
      token: refreshData.session.access_token,
      refresh_token: refreshData.session.refresh_token,
      expires_at: refreshData.session.expires_at,
      refreshed: true,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(400, { message });
  }
});

// Invalida sessioni per telegram_id (per logout dal bot)
app.delete("/session/telegram/:telegram_id", async (c) => {
  try {
    const telegram_id = c.req.param("telegram_id");
    const serviceKey = c.req.header("X-Service-Key");

    // Verifica service key
    const expectedServiceKey = Deno.env.get("INTERNAL_SERVICE_KEY");
    if (!serviceKey || serviceKey !== expectedServiceKey) {
      throw new HTTPException(401, { message: "Unauthorized service" });
    }

    // Trova l'utente
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw new HTTPException(500, { message: "Failed to query users" });
    }

    const user = data.users.find((u) =>
      u.user_metadata?.telegram_id === telegram_id
    );

    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    // Invalida tutte le sessioni dell'utente
    const { error: signOutError } = await supabase.auth.admin.signOut(user.id);

    if (signOutError) {
      throw new HTTPException(400, { message: signOutError.message });
    }

    return c.json({
      message: "User sessions invalidated",
      telegram_id: telegram_id,
      user_id: user.id,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const message = parseMessage(error);
    throw new HTTPException(500, { message });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
      status: err.status,
      timestamp: new Date().toISOString(),
    }, err.status);
  }

  console.error("Unhandled error:", err);
  return c.json({
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  }, 500);
});

app.notFound((c) => {
  return c.json({
    error: "Endpoint not found",
    path: c.req.path,
    method: c.req.method,
  }, 404);
});

// Start server
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`🚀 Auth Service running on port ${port}`);

Deno.serve(app.fetch);
