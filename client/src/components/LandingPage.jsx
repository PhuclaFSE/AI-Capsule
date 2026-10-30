export default function LandingPage() {
  return (
    <main className="landing-shell">
      <nav className="nav-bar">
        <a className="brand" href="/">
          AI Capsule
        </a>
        <a className="button button-primary" href="/login">
          Login with GitHub
        </a>
      </nav>

      <section className="hero simple-hero">
        <div className="hero-copy">
          <h1>AI Capsule</h1>
          <p className="hero-text">
            A simple application for saving and managing useful AI prompts.
            Sign in with GitHub to create, view, update and delete your own prompt records.
          </p>
          <a className="button button-primary" href="/login">
            Get Started
          </a>
        </div>
      </section>

      <section className="feature-section" id="features">
        <h2>What you can do</h2>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>Save prompts</h3>
            <p>Store the prompt, project name, version, category and response summary.</p>
          </article>
          <article className="feature-card">
            <h3>Review records</h3>
            <p>Add usefulness, review status, improvement status and notes.</p>
          </article>
          <article className="feature-card">
            <h3>Manage your records</h3>
            <p>Edit or delete your saved prompt records after signing in.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
