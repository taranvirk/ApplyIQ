import { useEffect, useState } from 'react';

const initialState = {
  company: '',
  role: '',
  status: 'Applied',
  appliedDate: '',
  jobLink: '',
  location: '',
  salaryRange: '',
  notes: '',
  jdText: ''
};

export default function ApplicationForm({ onSubmit, editingApplication, onCancelEdit, saving = false }) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (editingApplication) {
      setForm({
        ...initialState,
        ...editingApplication
      });
    } else {
      setForm(initialState);
    }
  }, [editingApplication]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="content-card form-card" onSubmit={handleSubmit}>
      <div className="section-header stacked-start">
        <div>
          <h2>{editingApplication ? 'Edit application' : 'Create application'}</h2>
          <p className="muted-text">Capture the key details you want to track for each role.</p>
        </div>
        {editingApplication ? (
          <button type="button" className="secondary-button" onClick={onCancelEdit}>
            <i className="bx bx-x" /> Cancel
          </button>
        ) : null}
      </div>

      <div className="form-grid form-two-column">
        <div>
          <label className="field-label">Company</label>
          <input name="company" value={form.company} onChange={handleChange} placeholder="e.g. Shopify" required />
        </div>
        <div>
          <label className="field-label">Role</label>
          <input name="role" value={form.role} onChange={handleChange} placeholder="e.g. Software Developer" required />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option>Saved</option>
            <option>Applied</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>
        </div>
        <div>
          <label className="field-label">Applied date</label>
          <input name="appliedDate" type="date" value={form.appliedDate} onChange={handleChange} />
        </div>
      </div>

      <label className="field-label">Job link</label>
      <input name="jobLink" value={form.jobLink} onChange={handleChange} placeholder="Paste the application URL" />

      <div className="form-grid form-two-column">
        <div>
          <label className="field-label">Location</label>
          <input name="location" value={form.location} onChange={handleChange} placeholder="Toronto, ON" />
        </div>
        <div>
          <label className="field-label">Salary range</label>
          <input name="salaryRange" value={form.salaryRange} onChange={handleChange} placeholder="$70,000 - $90,000" />
        </div>
      </div>

      <label className="field-label">Notes</label>
      <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Interview notes, recruiter contact, referral details" rows="4" />

      <label className="field-label">Job description</label>
      <textarea name="jdText" value={form.jdText} onChange={handleChange} placeholder="Paste the job description for future tailoring" rows="6" />

      <button type="submit" className="primary-button wide" disabled={saving}>
        <i className={`bx ${saving ? 'bx-loader-alt bx-spin' : editingApplication ? 'bx-save' : 'bx-plus-circle'}`} />
        {saving ? 'Saving...' : editingApplication ? 'Update application' : 'Save application'}
      </button>
    </form>
  );
}
