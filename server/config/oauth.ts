// OAuth cấu hình
export const googleOAuth = {
  clientID: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackURL: "/auth/google/callback"
};

// JWT cấu hình
export const jwtConfig = {
  secret: process.env.JWT_SECRET || "smartui-mes-secret-key",
  expiresIn: "7d"
};

// Session cấu hình
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || "smartui-mes-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

// Redirect URLs
export const redirectUrls = {
  successRedirect: "/",
  failureRedirect: "/login"
};