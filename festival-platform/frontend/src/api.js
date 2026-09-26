const BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (code, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ code, password }) }),
  listJudges: () => request('/auth/judges'),
  createJudge: (payload) => request('/auth/judges', { method: 'POST', body: JSON.stringify(payload) }),

  listPrograms: () => request('/programs'),
  programsForJudge: (judgeId) => request(`/programs/for-judge/${judgeId}`),
  createProgram: (payload) => request('/programs', { method: 'POST', body: JSON.stringify(payload) }),
  assignJudge: (programId, judgeId) => request(`/programs/${programId}/judges`, { method: 'POST', body: JSON.stringify({ judge_id: judgeId }) }),
  unassignJudge: (programId, judgeId) => request(`/programs/${programId}/judges/${judgeId}`, { method: 'DELETE' }),

  register: (payload) => request('/registrations', { method: 'POST', body: JSON.stringify(payload) }),
  listRegistrations: (programId) => request(`/registrations${programId ? `?program_id=${programId}` : ''}`),
  judgeView: (programId) => request(`/registrations/judge-view?program_id=${programId}`),
  setStatus: (id, status) => request(`/registrations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  submitScore: (payload) => request('/scores', { method: 'POST', body: JSON.stringify(payload) }),
  scoresByJudge: (judgeId) => request(`/scores/by-judge/${judgeId}`),

  results: (programId) => request(`/results/${programId}`),
  certificateUrl: (programId, registrationId) => `${BASE}/results/${programId}/certificate/${registrationId}`
};
