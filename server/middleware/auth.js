import jwt from "jsonwebtoken";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return process.env.JWT_SECRET;
}

export function signApplicationToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      login: user.login,
      name: user.name || user.login,
      avatar_url: user.avatar_url || "",
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
      issuer: "ai-capsule",
      audience: "ai-capsule-web",
    },
  );
}

export function verifyApplicationToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: "ai-capsule",
    audience: "ai-capsule-web",
  });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    req.user = verifyApplicationToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requirePageAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/");

  try {
    req.user = verifyApplicationToken(token);
    return next();
  } catch {
    return res.redirect("/");
  }
}
