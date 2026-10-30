import crypto from "node:crypto";
import express from "express";
import { signApplicationToken } from "../middleware/auth.js";

const router = express.Router();

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
  };
}

function requireOAuthConfig() {
  const required = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_CALLBACK_URL"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing OAuth environment variables: ${missing.join(", ")}`);
  }
}

router.get("/login", (req, res, next) => {
  try {
    requireOAuthConfig();
    const state = crypto.randomBytes(24).toString("hex");
    res.cookie("oauth_state", state, {
      ...cookieOptions(),
      maxAge: 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
      state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch (error) {
    next(error);
  }
});

router.get("/auth/github/callback", async (req, res, next) => {
  try {
    requireOAuthConfig();
    const { code, state } = req.query;
    const expectedState = req.cookies?.oauth_state;

    if (!code || !state || !expectedState || state !== expectedState) {
      return res.status(400).send("Invalid OAuth state. Please start the login flow again.");
    }

    res.clearCookie("oauth_state", cookieOptions());

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("GitHub token exchange failed.");
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || "GitHub did not return an access token.");
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenData.access_token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ai-capsule-coursework",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Could not retrieve the GitHub user profile.");
    }

    const githubUser = await userResponse.json();
    const applicationJwt = signApplicationToken(githubUser);

    res.cookie("token", applicationJwt, {
      ...cookieOptions(),
      maxAge: 2 * 60 * 60 * 1000,
    });

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    next(error);
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions());
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  res.redirect(frontendUrl);
});

export default router;
