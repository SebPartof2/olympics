import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

function AdminSettings() {
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [form, setForm] = useState({ default_timezone: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await api.getSettings();
      setForm({ default_timezone: settings.default_timezone || 'America/New_York' });
    } catch (err) {
      showMessage('error', 'Failed to load settings: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.updateSettings(form);
      showMessage('success', 'Settings saved');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Global Settings</h2>
      <MessageDisplay />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label>Default Timezone (for data entry)</label>
            <input
              type="text"
              list="timezone-list"
              value={form.default_timezone}
              onChange={(e) => setForm({ ...form, default_timezone: e.target.value })}
              placeholder="e.g., America/New_York"
            />
            <datalist id="timezone-list">
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (ET)</option>
              <option value="America/Chicago">America/Chicago (CT)</option>
              <option value="America/Denver">America/Denver (MT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
              <option value="America/Anchorage">America/Anchorage (AKT)</option>
              <option value="America/Phoenix">America/Phoenix (MST)</option>
              <option value="America/Toronto">America/Toronto (ET)</option>
              <option value="America/Vancouver">America/Vancouver (PT)</option>
              <option value="America/Mexico_City">America/Mexico_City (CST)</option>
              <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
              <option value="America/Buenos_Aires">America/Buenos_Aires (ART)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
              <option value="Europe/Rome">Europe/Rome (CET/CEST)</option>
              <option value="Europe/Madrid">Europe/Madrid (CET/CEST)</option>
              <option value="Europe/Amsterdam">Europe/Amsterdam (CET/CEST)</option>
              <option value="Europe/Moscow">Europe/Moscow (MSK)</option>
              <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
              <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Seoul">Asia/Seoul (KST)</option>
              <option value="Australia/Perth">Australia/Perth (AWST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
              <option value="Australia/Melbourne">Australia/Melbourne (AEST)</option>
              <option value="Pacific/Auckland">Pacific/Auckland (NZST)</option>
              <option value="Pacific/Honolulu">Pacific/Honolulu (HST)</option>
            </datalist>
            <small className={styles.hint}>Enter any valid IANA timezone (e.g., Europe/Paris, Asia/Tokyo)</small>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Save Settings</button>
      </form>
    </div>
  );
}

export default AdminSettings;
