const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('adminToken') || '';
    this.defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('adminToken', token);
  }

  clearToken() {
    this.token = '';
    localStorage.removeItem('adminToken');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token && options.auth !== false) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async checkAuth() {
    try {
      const result = await this.request('/auth/check', { method: 'POST' });
      return result.authenticated;
    } catch {
      return false;
    }
  }

  // Settings
  async getSettings() {
    return this.request('/settings', { auth: false });
  }

  async updateSettings(data) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Countries
  async getCountries() {
    return this.request('/countries', { auth: false });
  }

  async addCountry(data) {
    return this.request('/countries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCountry(id) {
    return this.request(`/countries/${id}`, { method: 'DELETE' });
  }

  // Sports
  async getSports() {
    return this.request('/sports', { auth: false });
  }

  async addSport(data) {
    return this.request('/sports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSport(id) {
    return this.request(`/sports/${id}`, { method: 'DELETE' });
  }

  // Medal Events
  async getMedalEvents(params = {}) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/medal-events?${searchParams}` : '/medal-events';
    return this.request(endpoint, { auth: false });
  }

  async getMedalEvent(id) {
    return this.request(`/medal-events/${id}`, { auth: false });
  }

  async addMedalEvent(data) {
    return this.request('/medal-events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedalEvent(id, data) {
    return this.request(`/medal-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMedalEvent(id) {
    return this.request(`/medal-events/${id}`, { method: 'DELETE' });
  }

  // Event Participants
  async getEventParticipants(params = {}) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/event-participants?${searchParams}` : '/event-participants';
    return this.request(endpoint, { auth: false });
  }

  async getMedalEventParticipants(medalEventId) {
    return this.request(`/medal-events/${medalEventId}/participants`, { auth: false });
  }

  async setMedalEventParticipants(medalEventId, countryIds) {
    return this.request(`/medal-events/${medalEventId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ country_ids: countryIds }),
    });
  }

  async addEventParticipant(data) {
    return this.request('/event-participants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEventParticipant(id) {
    return this.request(`/event-participants/${id}`, { method: 'DELETE' });
  }

  // Rounds (sub-events)
  async getRounds(params = {}) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/rounds?${searchParams}` : '/rounds';
    return this.request(endpoint, { auth: false });
  }

  async getRound(id) {
    return this.request(`/rounds/${id}`, { auth: false });
  }

  async addRound(data) {
    return this.request('/rounds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRound(id, data) {
    return this.request(`/rounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRound(id) {
    return this.request(`/rounds/${id}`, { method: 'DELETE' });
  }

  // Round Results
  async getRoundResults(roundId) {
    return this.request(`/round-results?round=${roundId}`, { auth: false });
  }

  async addRoundResult(data) {
    return this.request('/round-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoundResult(id, data) {
    return this.request(`/round-results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoundResult(id) {
    return this.request(`/round-results/${id}`, { method: 'DELETE' });
  }

  // Matches (for team sports, round robin, etc.)
  async getMatches(params = {}) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/matches?${searchParams}` : '/matches';
    return this.request(endpoint, { auth: false });
  }

  async getMatch(id) {
    return this.request(`/matches/${id}`, { auth: false });
  }

  async addMatch(data) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMatch(id, data) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMatch(id) {
    return this.request(`/matches/${id}`, { method: 'DELETE' });
  }

  // Medals
  async getMedalStandings(olympicsId) {
    const endpoint = olympicsId ? `/medals?olympics=${olympicsId}` : '/medals';
    return this.request(endpoint, { auth: false });
  }

  async getAllMedals(olympicsId) {
    const endpoint = olympicsId ? `/medals/all?olympics=${olympicsId}` : '/medals/all';
    return this.request(endpoint, { auth: false });
  }

  async awardMedal(data) {
    return this.request('/medals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMedal(id) {
    return this.request(`/medals/${id}`, { method: 'DELETE' });
  }

  // Schedule
  async getSchedule(params = {}) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/schedule?${searchParams}` : '/schedule';
    return this.request(endpoint, { auth: false });
  }

  // Live rounds
  async getLiveRounds(olympicsId) {
    const endpoint = olympicsId ? `/rounds?status=live&olympics=${olympicsId}` : '/rounds?status=live';
    return this.request(endpoint, { auth: false });
  }

  // Stats
  async getStats(olympicsId) {
    const endpoint = olympicsId ? `/stats?olympics=${olympicsId}` : '/stats';
    return this.request(endpoint, { auth: false });
  }

  // Olympics
  async getOlympics() {
    return this.request('/olympics', { auth: false });
  }

  async getOlympicsById(id) {
    return this.request(`/olympics/${id}`, { auth: false });
  }

  async addOlympics(data) {
    return this.request('/olympics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOlympics(id, data) {
    return this.request(`/olympics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOlympics(id) {
    return this.request(`/olympics/${id}`, { method: 'DELETE' });
  }

  async activateOlympics(id) {
    return this.request(`/olympics/${id}/activate`, { method: 'POST' });
  }
}

// Timezone utilities
export function formatLocalTime(utcDateString, timezone) {
  if (!utcDateString) return 'TBD';
  const date = new Date(utcDateString);
  return date.toLocaleString('en-US', {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatLocalDate(utcDateString, timezone) {
  if (!utcDateString) return 'TBD';
  const date = new Date(utcDateString);
  return date.toLocaleDateString('en-US', {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(utcDateString, timezone) {
  if (!utcDateString) return 'TBD';
  const date = new Date(utcDateString);
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function toUTCString(localDateString, timezone) {
  // Convert local datetime-local input to UTC ISO string
  if (!localDateString) return null;
  const date = new Date(localDateString);
  return date.toISOString();
}

export function toLocalInputValue(utcDateString, timezone) {
  // Convert UTC to datetime-local input format
  if (!utcDateString) return '';
  const date = new Date(utcDateString);
  // Format: YYYY-MM-DDTHH:MM
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export const api = new ApiService();
export default api;
