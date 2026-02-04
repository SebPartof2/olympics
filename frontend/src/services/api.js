const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('adminToken') || '';
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

  // Events
  async getEvents(params = {}) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/events?${searchParams}` : '/events';
    return this.request(endpoint, { auth: false });
  }

  async addEvent(data) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id, data) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  }

  // Medals
  async getMedalStandings() {
    return this.request('/medals', { auth: false });
  }

  async getAllMedals() {
    return this.request('/medals/all', { auth: false });
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

  // Results
  async getResults(eventId = null) {
    const endpoint = eventId ? `/results?event=${eventId}` : '/results';
    return this.request(endpoint, { auth: false });
  }

  async addResult(data) {
    return this.request('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResult(id, data) {
    return this.request(`/results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResult(id) {
    return this.request(`/results/${id}`, { method: 'DELETE' });
  }

  // Stats
  async getStats() {
    return this.request('/stats', { auth: false });
  }
}

export const api = new ApiService();
export default api;
