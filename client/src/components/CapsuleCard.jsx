export default function CapsuleCard({ capsule, onEdit, onDelete, deleting }) {
  return (
    <article className="capsule-card">
      <div className="capsule-card-header">
        <div>
          <div className="pill-row">
            <span className="pill">{capsule.category || "Uncategorised"}</span>
            {capsule.reviewed ? <span className="pill pill-success">Reviewed</span> : null}
            {capsule.improved ? <span className="pill pill-violet">Improved</span> : null}
          </div>
          <p className="muted-label">
            {capsule.project_name} {capsule.prompt_version ? `· ${capsule.prompt_version}` : ""}
          </p>
          <h3>{capsule.prompt_title}</h3>
        </div>
        <div className="card-actions">
          <button className="text-button" type="button" onClick={() => onEdit(capsule)}>
            Edit
          </button>
          <button
            className="text-button danger"
            type="button"
            onClick={() => onDelete(capsule.id)}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="capsule-section">
        <span className="muted-label">Prompt</span>
        <p className="preserve-lines">{capsule.prompt_text}</p>
      </div>

      {capsule.response_summary ? (
        <div className="capsule-section">
          <span className="muted-label">Response summary</span>
          <p className="preserve-lines">{capsule.response_summary}</p>
        </div>
      ) : null}

      <div className="capsule-meta-grid">
        <div>
          <span className="muted-label">Usefulness</span>
          <strong>{capsule.usefulness || "Not rated"}</strong>
        </div>
        <div>
          <span className="muted-label">Created</span>
          <strong>{new Date(capsule.created_at).toLocaleString()}</strong>
        </div>
      </div>

      {capsule.notes ? (
        <div className="capsule-section note-box">
          <span className="muted-label">Notes</span>
          <p className="preserve-lines">{capsule.notes}</p>
        </div>
      ) : null}

      {capsule.screenshot_url ? (
        <a
          className="evidence-link"
          href={capsule.screenshot_url}
          target="_blank"
          rel="noreferrer"
        >
          Open screenshot evidence ↗
        </a>
      ) : null}
    </article>
  );
}
