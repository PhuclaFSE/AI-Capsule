const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "v1",
  prompt_text: "",
  response_summary: "",
  category: "Coding",
  usefulness: "Good",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

export { emptyForm };

export default function CapsuleForm({
  form,
  setForm,
  editingId,
  onSubmit,
  onCancel,
  saving,
}) {
  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <form className="capsule-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <div>
          <h2>{editingId ? "Edit Record" : "Add New Record"}</h2>
        </div>
        {editingId && (
          <button className="text-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <div className="form-grid two-col">
        <label>
          <span>Project name *</span>
          <input
            name="project_name"
            value={form.project_name}
            onChange={update}
            placeholder="Enter your project name"
            required
          />
        </label>
        <label>
          <span>Prompt title *</span>
          <input
            name="prompt_title"
            value={form.prompt_title}
            onChange={update}
            placeholder="Enter the prompt title"
            required
          />
        </label>
        <label>
          <span>Prompt version</span>
          <input
            name="prompt_version"
            value={form.prompt_version}
            onChange={update}
            placeholder="v1"
          />
        </label>
        <label>
          <span>Category</span>
          <select name="category" value={form.category} onChange={update}>
            <option>Coding</option>
            <option>Writing</option>
            <option>Research</option>
          </select>
        </label>
      </div>

      <label>
        <span>Prompt text *</span>
        <textarea
          name="prompt_text"
          value={form.prompt_text}
          onChange={update}
          rows="5"
          placeholder="Enter the full prompt you want to save..."
          required
        />
      </label>

      <label>
        <span>Response summary</span>
        <textarea
          name="response_summary"
          value={form.response_summary}
          onChange={update}
          rows="3"
          placeholder="Summarise the useful part of the AI response..."
        />
      </label>

      <div className="form-grid two-col">
        <label>
          <span>Usefulness</span>
          <select name="usefulness" value={form.usefulness} onChange={update}>
            <option>Good</option>
            <option>Needs Improvement</option>
          </select>
        </label>
        <label>
          <span>Screenshot evidence URL</span>
          <input
            name="screenshot_url"
            type="url"
            value={form.screenshot_url}
            onChange={update}
            placeholder="https://..."
          />
        </label>
      </div>

      <div className="checkbox-row">
        <label className="checkbox-label">
          <input
            name="reviewed"
            type="checkbox"
            checked={form.reviewed}
            onChange={update}
          />
          <span>Response reviewed</span>
        </label>
        <label className="checkbox-label">
          <input
            name="improved"
            type="checkbox"
            checked={form.improved}
            onChange={update}
          />
          <span>Output improved</span>
        </label>
      </div>

      <label>
        <span>Notes</span>
        <textarea
          name="notes"
          value={form.notes}
          onChange={update}
          rows="3"
          placeholder="Reflection, testing notes, or what you changed..."
        />
      </label>

      <button
        className="button button-primary full-width"
        type="submit"
        disabled={saving}
      >
        {saving ? "Saving..." : editingId ? "Save Changes" : "Create Record"}
      </button>
    </form>
  );
}
