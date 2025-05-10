// src/App.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';
import './styles.css';

interface Graduate {
  id: number;
  fullName: string;
  email: string;
  university: string;
  degree: string;
  graduationYear: number;
  skills: string[];
  portfolioUrl?: string;
}

const API_URL = 'https://employer-portal-api.onrender.com/graduates';

function App() {
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [form, setForm] = useState<Omit<Graduate, 'id'> & { portfolioUrl: string }>({
    fullName: '',
    email: '',
    university: '',
    degree: '',
    graduationYear: new Date().getFullYear(),
    skills: [],
    portfolioUrl: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}`).then(res => {
      setGraduates(res.data.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.fullName ||
      !form.email ||
      !form.university ||
      !form.degree ||
      !form.graduationYear ||
      form.skills.length === 0
    ) {
      toast.error('Please fill in all required fields (skills too).');
      return;
    }

    const trimmedUrl = (form.portfolioUrl || '').trim();

    if (trimmedUrl && !/^https?:\/\/[\w.-]+\.[a-z]{2,}.*$/i.test(trimmedUrl)) {
      toast.error('Please enter a valid portfolio URL (e.g., https://example.com).');
      return;
    }

    const payload = {
      ...form,
      portfolioUrl: trimmedUrl || undefined,
    };


    try {
      if (editingId !== null) {
        const res = await axios.patch(`${API_URL}/${editingId}`, payload);
        setGraduates(prev => prev.map(g => (g.id === editingId ? res.data : g)));
        toast.success('Graduate updated successfully!');
      } else {
        const emailExists = graduates.some(g => g.email === form.email.trim());
        if (emailExists) {
          toast.error('A graduate with this email already exists.');
          return;
        }
        const res = await axios.post(API_URL, payload);
        setGraduates(prev => [...prev, res.data]);
        toast.success('Graduate added successfully!');
      }

      setForm({
        fullName: '',
        email: '',
        university: '',
        degree: '',
        graduationYear: new Date().getFullYear(),
        skills: [],
        portfolioUrl: '',
      });
      setSkillInput('');
      setEditingId(null);
      setShowFormModal(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (g: Graduate) => {
    setForm({
      fullName: g.fullName,
      email: g.email,
      university: g.university,
      degree: g.degree,
      graduationYear: g.graduationYear,
      skills: g.skills,
      portfolioUrl: g.portfolioUrl || '',
    });
    setEditingId(g.id);
    setSkillInput('');
    setShowFormModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setGraduates(prev => prev.filter(g => g.id !== id));
      toast.success('Graduate deleted!');
    } catch (err: any) {
      toast.error('Failed to delete graduate');
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!form.skills.includes(skillInput.trim())) {
        setForm({
          ...form,
          skills: [...form.skills, skillInput.trim()],
        });
        setSkillInput('');
      }
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setForm({
      ...form,
      skills: form.skills.filter(s => s !== skill),
    });
  };

  const filteredGraduates = graduates.filter((g) => {
    const search = searchTerm.toLowerCase();
    return (
      g.fullName.toLowerCase().includes(search) ||
      g.university.toLowerCase().includes(search) ||
      g.degree.toLowerCase().includes(search) ||
      g.graduationYear.toString().includes(search) ||
      g.skills.some(skill => skill.toLowerCase().includes(search))
    );
  });

  return (
    <div className="container">
      <Toaster position="top-right" />
      <header className="header">
        <h1>🎓 Graduate Talent Portal</h1>
        <p>Find, Add, and Manage Graduate Candidates</p>
      </header>

      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button className="button-primary" onClick={() => {
          setEditingId(null);
          setForm({
            fullName: '',
            email: '',
            university: '',
            degree: '',
            graduationYear: new Date().getFullYear(),
            skills: [],
            portfolioUrl: '',
          });
          setShowFormModal(true);
        }}>
          + Add Graduate
        </button>
      </div>

      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2
              style={{
                fontSize: '1.5rem',
                marginBottom: '1rem',
                color: editingId ? '#d97706' : '#333',
              }}
            >
              {editingId ? '✏️ Editing Graduate Profile' : '➕ Add a New Graduate'}
            </h2>
            <form onSubmit={handleSubmit} className="form-grid">
              <div>
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label>University</label>
                <input type="text" value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} required />
              </div>
              <div>
                <label>Degree</label>
                <input type="text" value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })} required />
              </div>
              <div>
                <label>Graduation Year</label>
                <input type="number" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: +e.target.value })} required />
              </div>
              <div className="span-2">
                <label>Skills (press Enter to add)</label>
                <div className="chip-input">
                  {form.skills.map(skill => (
                    <span key={skill} className="chip">
                      {skill} <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Type a skill and press Enter"
                  />
                </div>
              </div>
              <div className="span-2">
                <label>Portfolio URL <span style={{ fontWeight: 'normal', color: '#888' }}>(optional)</span></label>
                <input type="url" value={form.portfolioUrl} onChange={e => setForm({ ...form, portfolioUrl: e.target.value })} />
              </div>
              <div
                className="span-2 text-right"
                style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}
              >
                <button type="submit" className="button-primary">
                  {editingId ? 'Update Graduate' : 'Add Graduate'}
                </button>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setForm({
                      fullName: '',
                      email: '',
                      university: '',
                      degree: '',
                      graduationYear: new Date().getFullYear(),
                      skills: [],
                      portfolioUrl: '',
                    });
                    setSkillInput('');
                  }}
                >
                  Clear All
                </button>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setForm({
                      fullName: '',
                      email: '',
                      university: '',
                      degree: '',
                      graduationYear: new Date().getFullYear(),
                      skills: [],
                      portfolioUrl: '',
                    });
                    setSkillInput('');
                    setEditingId(null);
                    setShowFormModal(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem', width: '97.5%' }}>
        <input
          type="text"
          placeholder="Search graduates by name, university, degree, year or skill"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '0.5rem'
          }}
        />
      </div>


      <section>
        <h2 className="section-heading">Current Graduates</h2>
        <div className="card-grid">
          {filteredGraduates.map(g => (
            <div key={g.id} className="graduate-card">
              <div className="card-actions">
                <button
                  onClick={() => handleEdit(g)}
                  className="edit-button"
                  title="Edit"
                >✏️</button>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="delete-button"
                  title="Delete"
                >❌</button>
              </div>
              <h3>{g.fullName} <span>({g.graduationYear})</span></h3>
              <p>{g.degree}, {g.university}</p>
              <p>📧 {g.email}</p>
              <p>🛠 {g.skills.join(', ')}</p>
              {g.portfolioUrl && (
                <p>🔗 <a href={g.portfolioUrl} target="_blank" rel="noopener noreferrer">Portfolio</a></p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div >
  );
}

export default App;
