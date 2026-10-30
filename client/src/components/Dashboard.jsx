import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CapsuleForm, { emptyForm } from "./CapsuleForm.jsx";
import CapsuleCard from "./CapsuleCard.jsx";

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(body?.error || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [me, records] = await Promise.all([api("/api/me"), api("/api/capsules")]);
      setUser(me.user);
      setCapsules(records.capsules);
    } catch (err) {
      if (err.status === 401) {
        navigate("/", { replace: true });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredCapsules = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return capsules;
    return capsules.filter((capsule) =>
      [
        capsule.project_name,
        capsule.prompt_title,
        capsule.prompt_text,
        capsule.category,
        capsule.notes,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [capsules, query]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const path = editingId ? `/api/capsules/${editingId}` : "/api/capsules";
      const method = editingId ? "PUT" : "POST";
      await api(path, {
        method,
        body: JSON.stringify(form),
      });
      resetForm();
      await loadDashboard();
    } catch (err) {
      if (err.status === 401) navigate("/", { replace: true });
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (capsule) => {
    setEditingId(capsule.id);
    setForm({
      project_name: capsule.project_name || "",
      prompt_title: capsule.prompt_title || "",
      prompt_version: capsule.prompt_version || "",
      prompt_text: capsule.prompt_text || "",
      response_summary: capsule.response_summary || "",
      category: capsule.category || "Coding",
      usefulness: capsule.usefulness || "Good",
      reviewed: Boolean(capsule.reviewed),
      improved: Boolean(capsule.improved),
      screenshot_url: capsule.screenshot_url || "",
      notes: capsule.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this capsule permanently?");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      await api(`/api/capsules/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      setCapsules((current) => current.filter((capsule) => capsule.id !== id));
    } catch (err) {
      if (err.status === 401) navigate("/", { replace: true });
      else setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading your capsule library...</div>;
  }

  return (
    <main className="dashboard-shell">
      <nav className="nav-bar dashboard-nav">
        <a className="brand" href="/dashboard">
          AI Capsule
        </a>
        <div className="nav-user">
          {user?.avatar_url ? <img src={user.avatar_url} alt="" className="avatar" /> : null}
          <div className="user-copy">
            <strong>{user?.name || user?.login}</strong>
            <span>@{user?.login}</span>
          </div>
          <a className="button button-secondary compact" href="/logout">
            Sign out
          </a>
        </div>
      </nav>

      <section className="dashboard-intro">
        <div>
          <h1>My Prompt Records</h1>
          <p>Create and manage your saved AI prompt records.</p>
        </div>
        <p className="record-count">Total records: <strong>{capsules.length}</strong></p>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="dashboard-grid">
        <aside>
          <CapsuleForm
            form={form}
            setForm={setForm}
            editingId={editingId}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            saving={saving}
          />
        </aside>

        <section className="records-panel">
          <div className="records-toolbar">
            <div>
              <h2>Saved Records</h2>
            </div>
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your capsules..."
              aria-label="Search capsules"
            />
          </div>

          {filteredCapsules.length === 0 ? (
            <div className="empty-state">
              <h3>{capsules.length ? "No matching capsules" : "No capsules yet"}</h3>
              <p>
                {capsules.length
                  ? "Try a different search term."
                  : "Create your first prompt record using the form."}
              </p>
            </div>
          ) : (
            <div className="capsule-list">
              {filteredCapsules.map((capsule) => (
                <CapsuleCard
                  key={capsule.id}
                  capsule={capsule}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  deleting={deletingId === capsule.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
