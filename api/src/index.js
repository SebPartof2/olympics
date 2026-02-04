// Olympics API - Cloudflare Worker with D1

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

function checkAuth(request, env) {
  const auth = request.headers.get('Authorization');
  return auth && auth === `Bearer ${env.ADMIN_PASSWORD}`;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ============ SETTINGS ============
      if (path === '/api/settings') {
        if (method === 'GET') {
          const results = await env.DB.prepare('SELECT key, value FROM settings').all();
          const settings = {};
          results.results.forEach(row => { settings[row.key] = row.value; });
          return jsonResponse(settings);
        }
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          for (const [key, value] of Object.entries(body)) {
            await env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
              .bind(key, String(value))
              .run();
          }
          return jsonResponse({ success: true, message: 'Settings updated' });
        }
      }

      // ============ OLYMPICS ============
      if (path === '/api/olympics') {
        if (method === 'GET') {
          const results = await env.DB.prepare(`
            SELECT o.*,
              (SELECT COUNT(*) FROM medal_events WHERE olympics_id = o.id) as event_count,
              (SELECT COUNT(*) FROM medals m JOIN medal_events me ON m.medal_event_id = me.id WHERE me.olympics_id = o.id) as medal_count
            FROM olympics o
            ORDER BY o.year DESC, o.type
          `).all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { name, year, type, city, country, logo_url, start_date, end_date } = await request.json();
          if (!name || !year || !type || !city || !country) {
            return errorResponse('name, year, type, city, and country are required');
          }
          const result = await env.DB.prepare(
            'INSERT INTO olympics (name, year, type, city, country, logo_url, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(name, year, type, city, country, logo_url || null, start_date || null, end_date || null).run();
          return jsonResponse({ success: true, message: 'Olympics created', id: result.meta.last_row_id }, 201);
        }
      }

      if (path.match(/^\/api\/olympics\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'GET') {
          const olympics = await env.DB.prepare('SELECT * FROM olympics WHERE id = ?').bind(id).first();
          if (!olympics) return errorResponse('Olympics not found', 404);
          return jsonResponse(olympics);
        }
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { name, year, type, city, country, logo_url, start_date, end_date } = await request.json();
          await env.DB.prepare(
            'UPDATE olympics SET name = ?, year = ?, type = ?, city = ?, country = ?, logo_url = ?, start_date = ?, end_date = ? WHERE id = ?'
          ).bind(name, year, type, city, country, logo_url || null, start_date || null, end_date || null, id).run();
          return jsonResponse({ success: true, message: 'Olympics updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM olympics WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Olympics deleted' });
        }
      }

      if (path.match(/^\/api\/olympics\/\d+\/activate$/)) {
        const id = path.split('/')[3];
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          // Set all others to inactive, then activate this one
          await env.DB.prepare('UPDATE olympics SET is_active = 0').run();
          await env.DB.prepare('UPDATE olympics SET is_active = 1 WHERE id = ?').bind(id).run();
          await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_olympics_id', ?)").bind(id).run();
          return jsonResponse({ success: true, message: 'Olympics activated' });
        }
      }

      // ============ COUNTRIES ============
      if (path === '/api/countries') {
        if (method === 'GET') {
          const results = await env.DB.prepare('SELECT * FROM countries ORDER BY name').all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { name, code, flag_url } = await request.json();
          if (!name || !code) return errorResponse('Name and code are required');
          await env.DB.prepare('INSERT INTO countries (name, code, flag_url) VALUES (?, ?, ?)')
            .bind(name, code.toUpperCase(), flag_url || null)
            .run();
          return jsonResponse({ success: true, message: 'Country added' }, 201);
        }
      }

      if (path.match(/^\/api\/countries\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { name, code, flag_url } = await request.json();
          await env.DB.prepare('UPDATE countries SET name = ?, code = ?, flag_url = ? WHERE id = ?')
            .bind(name, code.toUpperCase(), flag_url || null, id)
            .run();
          return jsonResponse({ success: true, message: 'Country updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM countries WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Country deleted' });
        }
      }

      // ============ SPORTS ============
      if (path === '/api/sports') {
        if (method === 'GET') {
          const results = await env.DB.prepare('SELECT * FROM sports ORDER BY name').all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { name, icon_url } = await request.json();
          if (!name) return errorResponse('Name is required');
          await env.DB.prepare('INSERT INTO sports (name, icon_url) VALUES (?, ?)')
            .bind(name, icon_url || null)
            .run();
          return jsonResponse({ success: true, message: 'Sport added' }, 201);
        }
      }

      if (path.match(/^\/api\/sports\/\d+$/) && method === 'PUT') {
        const id = path.split('/').pop();
        if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
        const { name, icon_url } = await request.json();
        await env.DB.prepare('UPDATE sports SET name = ?, icon_url = ? WHERE id = ?')
          .bind(name, icon_url || null, id)
          .run();
        return jsonResponse({ success: true, message: 'Sport updated' });
      }

      if (path.match(/^\/api\/sports\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM sports WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Sport deleted' });
        }
      }

      // ============ MEDAL EVENTS ============
      if (path === '/api/medal-events') {
        if (method === 'GET') {
          const olympics_id = url.searchParams.get('olympics');
          const sport = url.searchParams.get('sport');
          const gender = url.searchParams.get('gender');
          let query = `
            SELECT me.*, s.name as sport_name, s.icon_url as sport_icon_url, o.name as olympics_name,
              (SELECT COUNT(*) FROM event_rounds WHERE medal_event_id = me.id) as round_count,
              (SELECT COUNT(*) FROM medals WHERE medal_event_id = me.id) as medal_count
            FROM medal_events me
            LEFT JOIN sports s ON me.sport_id = s.id
            LEFT JOIN olympics o ON me.olympics_id = o.id
            WHERE 1=1
          `;
          const params = [];
          if (olympics_id) { query += ' AND me.olympics_id = ?'; params.push(olympics_id); }
          if (sport) { query += ' AND me.sport_id = ?'; params.push(sport); }
          if (gender) { query += ' AND me.gender = ?'; params.push(gender); }
          query += ' ORDER BY me.scheduled_date, s.name, me.name';
          const stmt = env.DB.prepare(query);
          const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { olympics_id, sport_id, name, gender, event_type, venue, scheduled_date } = await request.json();
          if (!olympics_id || !name) return errorResponse('olympics_id and name are required');
          const result = await env.DB.prepare(
            'INSERT INTO medal_events (olympics_id, sport_id, name, gender, event_type, venue, scheduled_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(olympics_id, sport_id || null, name, gender || 'mixed', event_type || 'individual', venue || null, scheduled_date || null).run();
          return jsonResponse({ success: true, message: 'Medal event added', id: result.meta.last_row_id }, 201);
        }
      }

      if (path.match(/^\/api\/medal-events\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'GET') {
          const event = await env.DB.prepare(`
            SELECT me.*, s.name as sport_name, o.name as olympics_name
            FROM medal_events me
            LEFT JOIN sports s ON me.sport_id = s.id
            LEFT JOIN olympics o ON me.olympics_id = o.id
            WHERE me.id = ?
          `).bind(id).first();
          if (!event) return errorResponse('Medal event not found', 404);

          const rounds = await env.DB.prepare(
            'SELECT * FROM event_rounds WHERE medal_event_id = ? ORDER BY start_time_utc'
          ).bind(id).all();

          const medals = await env.DB.prepare(`
            SELECT m.*, c.name as country_name, c.code as country_code
            FROM medals m
            LEFT JOIN countries c ON m.country_id = c.id
            WHERE m.medal_event_id = ?
            ORDER BY CASE m.medal_type WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 WHEN 'bronze' THEN 3 END
          `).bind(id).all();

          return jsonResponse({ ...event, rounds: rounds.results, medals: medals.results });
        }
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { olympics_id, sport_id, name, gender, event_type, venue, scheduled_date } = await request.json();
          await env.DB.prepare(
            'UPDATE medal_events SET olympics_id = ?, sport_id = ?, name = ?, gender = ?, event_type = ?, venue = ?, scheduled_date = ? WHERE id = ?'
          ).bind(olympics_id, sport_id || null, name, gender || 'mixed', event_type || 'individual', venue || null, scheduled_date || null, id).run();
          return jsonResponse({ success: true, message: 'Medal event updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM medal_events WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Medal event deleted' });
        }
      }

      // ============ EVENT ROUNDS ============
      if (path === '/api/rounds') {
        if (method === 'GET') {
          const olympics_id = url.searchParams.get('olympics');
          const medal_event_id = url.searchParams.get('medal_event');
          const status = url.searchParams.get('status');
          const upcoming = url.searchParams.get('upcoming');
          let query = `
            SELECT r.*, me.name as medal_event_name, me.gender, me.olympics_id,
              s.name as sport_name, s.icon_url as sport_icon_url
            FROM event_rounds r
            LEFT JOIN medal_events me ON r.medal_event_id = me.id
            LEFT JOIN sports s ON me.sport_id = s.id
            WHERE 1=1
          `;
          const params = [];
          if (olympics_id) { query += ' AND me.olympics_id = ?'; params.push(olympics_id); }
          if (medal_event_id) { query += ' AND r.medal_event_id = ?'; params.push(medal_event_id); }
          if (status) { query += ' AND r.status = ?'; params.push(status); }
          if (upcoming === 'true') { query += " AND r.start_time_utc >= datetime('now')"; }
          query += ' ORDER BY r.start_time_utc';
          const stmt = env.DB.prepare(query);
          const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { medal_event_id, round_type, round_number, round_name, start_time_utc, end_time_utc, venue, status, notes } = await request.json();
          if (!medal_event_id || !round_type || !start_time_utc) {
            return errorResponse('medal_event_id, round_type, and start_time_utc are required');
          }
          const result = await env.DB.prepare(
            'INSERT INTO event_rounds (medal_event_id, round_type, round_number, round_name, start_time_utc, end_time_utc, venue, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(medal_event_id, round_type, round_number || 1, round_name || null, start_time_utc, end_time_utc || null, venue || null, status || 'scheduled', notes || null).run();
          return jsonResponse({ success: true, message: 'Round added', id: result.meta.last_row_id }, 201);
        }
      }

      if (path.match(/^\/api\/rounds\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'GET') {
          const round = await env.DB.prepare(`
            SELECT r.*, me.name as medal_event_name, s.name as sport_name
            FROM event_rounds r
            LEFT JOIN medal_events me ON r.medal_event_id = me.id
            LEFT JOIN sports s ON me.sport_id = s.id
            WHERE r.id = ?
          `).bind(id).first();
          if (!round) return errorResponse('Round not found', 404);

          const results = await env.DB.prepare(`
            SELECT rr.*, c.name as country_name, c.code as country_code
            FROM round_results rr
            LEFT JOIN countries c ON rr.country_id = c.id
            WHERE rr.event_round_id = ?
            ORDER BY rr.final_position, rr.lane_or_position
          `).bind(id).all();

          return jsonResponse({ ...round, results: results.results });
        }
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { round_type, round_number, round_name, start_time_utc, end_time_utc, venue, status, notes } = await request.json();
          await env.DB.prepare(
            'UPDATE event_rounds SET round_type = ?, round_number = ?, round_name = ?, start_time_utc = ?, end_time_utc = ?, venue = ?, status = ?, notes = ? WHERE id = ?'
          ).bind(round_type, round_number || 1, round_name || null, start_time_utc, end_time_utc || null, venue || null, status || 'scheduled', notes || null, id).run();
          return jsonResponse({ success: true, message: 'Round updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM event_rounds WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Round deleted' });
        }
      }

      // ============ ROUND RESULTS ============
      if (path === '/api/round-results') {
        if (method === 'GET') {
          const round_id = url.searchParams.get('round');
          if (!round_id) return errorResponse('round parameter is required');
          const results = await env.DB.prepare(`
            SELECT rr.*, c.name as country_name, c.code as country_code
            FROM round_results rr
            LEFT JOIN countries c ON rr.country_id = c.id
            WHERE rr.event_round_id = ?
            ORDER BY rr.final_position, rr.lane_or_position
          `).bind(round_id).all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { event_round_id, country_id, athlete_name, lane_or_position, result_value, result_status, final_position, qualified_to } = await request.json();
          if (!event_round_id) return errorResponse('event_round_id is required');
          await env.DB.prepare(
            'INSERT INTO round_results (event_round_id, country_id, athlete_name, lane_or_position, result_value, result_status, final_position, qualified_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(event_round_id, country_id || null, athlete_name || null, lane_or_position || null, result_value || null, result_status || null, final_position || null, qualified_to || null).run();
          return jsonResponse({ success: true, message: 'Result added' }, 201);
        }
      }

      if (path.match(/^\/api\/round-results\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { result_value, result_status, final_position, qualified_to } = await request.json();
          await env.DB.prepare(
            'UPDATE round_results SET result_value = ?, result_status = ?, final_position = ?, qualified_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(result_value || null, result_status || null, final_position || null, qualified_to || null, id).run();
          return jsonResponse({ success: true, message: 'Result updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM round_results WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Result deleted' });
        }
      }

      // ============ MATCHES ============
      if (path === '/api/matches') {
        if (method === 'GET') {
          const round_id = url.searchParams.get('round');
          const olympics_id = url.searchParams.get('olympics');
          const status = url.searchParams.get('status');
          let query = `
            SELECT m.*,
              ca.name as team_a_country_name, ca.code as team_a_country_code, ca.flag_url as team_a_flag_url,
              cb.name as team_b_country_name, cb.code as team_b_country_code, cb.flag_url as team_b_flag_url,
              cw.name as winner_country_name, cw.code as winner_country_code,
              r.round_type, r.round_name, r.start_time_utc as round_start_time,
              me.name as medal_event_name, me.gender, me.olympics_id,
              s.name as sport_name
            FROM matches m
            LEFT JOIN countries ca ON m.team_a_country_id = ca.id
            LEFT JOIN countries cb ON m.team_b_country_id = cb.id
            LEFT JOIN countries cw ON m.winner_country_id = cw.id
            LEFT JOIN event_rounds r ON m.event_round_id = r.id
            LEFT JOIN medal_events me ON r.medal_event_id = me.id
            LEFT JOIN sports s ON me.sport_id = s.id
            WHERE 1=1
          `;
          const params = [];
          if (round_id) { query += ' AND m.event_round_id = ?'; params.push(round_id); }
          if (olympics_id) { query += ' AND me.olympics_id = ?'; params.push(olympics_id); }
          if (status) { query += ' AND m.status = ?'; params.push(status); }
          query += ' ORDER BY m.start_time_utc, m.id';
          const stmt = env.DB.prepare(query);
          const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { event_round_id, match_name, team_a_country_id, team_b_country_id, team_a_name, team_b_name, team_a_score, team_b_score, winner_country_id, start_time_utc, status, notes } = await request.json();
          if (!event_round_id) return errorResponse('event_round_id is required');
          const result = await env.DB.prepare(
            'INSERT INTO matches (event_round_id, match_name, team_a_country_id, team_b_country_id, team_a_name, team_b_name, team_a_score, team_b_score, winner_country_id, start_time_utc, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(event_round_id, match_name || null, team_a_country_id || null, team_b_country_id || null, team_a_name || null, team_b_name || null, team_a_score || null, team_b_score || null, winner_country_id || null, start_time_utc || null, status || 'scheduled', notes || null).run();
          return jsonResponse({ success: true, message: 'Match added', id: result.meta.last_row_id }, 201);
        }
      }

      if (path.match(/^\/api\/matches\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'GET') {
          const match = await env.DB.prepare(`
            SELECT m.*,
              ca.name as team_a_country_name, ca.code as team_a_country_code, ca.flag_url as team_a_flag_url,
              cb.name as team_b_country_name, cb.code as team_b_country_code, cb.flag_url as team_b_flag_url,
              cw.name as winner_country_name, cw.code as winner_country_code,
              r.round_type, r.round_name,
              me.name as medal_event_name, s.name as sport_name
            FROM matches m
            LEFT JOIN countries ca ON m.team_a_country_id = ca.id
            LEFT JOIN countries cb ON m.team_b_country_id = cb.id
            LEFT JOIN countries cw ON m.winner_country_id = cw.id
            LEFT JOIN event_rounds r ON m.event_round_id = r.id
            LEFT JOIN medal_events me ON r.medal_event_id = me.id
            LEFT JOIN sports s ON me.sport_id = s.id
            WHERE m.id = ?
          `).bind(id).first();
          if (!match) return errorResponse('Match not found', 404);
          return jsonResponse(match);
        }
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { match_name, team_a_country_id, team_b_country_id, team_a_name, team_b_name, team_a_score, team_b_score, winner_country_id, start_time_utc, status, notes } = await request.json();
          await env.DB.prepare(
            'UPDATE matches SET match_name = ?, team_a_country_id = ?, team_b_country_id = ?, team_a_name = ?, team_b_name = ?, team_a_score = ?, team_b_score = ?, winner_country_id = ?, start_time_utc = ?, status = ?, notes = ? WHERE id = ?'
          ).bind(match_name || null, team_a_country_id || null, team_b_country_id || null, team_a_name || null, team_b_name || null, team_a_score || null, team_b_score || null, winner_country_id || null, start_time_utc || null, status || 'scheduled', notes || null, id).run();
          return jsonResponse({ success: true, message: 'Match updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM matches WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Match deleted' });
        }
      }

      // ============ MEDALS ============
      if (path === '/api/medals') {
        if (method === 'GET') {
          const olympics_id = url.searchParams.get('olympics');
          let query = `
            SELECT
              c.id, c.name, c.code, c.flag_url,
              COUNT(CASE WHEN m.medal_type = 'gold' THEN 1 END) as gold,
              COUNT(CASE WHEN m.medal_type = 'silver' THEN 1 END) as silver,
              COUNT(CASE WHEN m.medal_type = 'bronze' THEN 1 END) as bronze,
              COUNT(m.id) as total
            FROM countries c
            JOIN medals m ON c.id = m.country_id
            JOIN medal_events me ON m.medal_event_id = me.id
          `;
          const params = [];
          if (olympics_id) { query += ' WHERE me.olympics_id = ?'; params.push(olympics_id); }
          query += ' GROUP BY c.id HAVING total > 0 ORDER BY gold DESC, silver DESC, bronze DESC';
          const stmt = env.DB.prepare(query);
          const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const { medal_event_id, country_id, athlete_name, medal_type, record_type, result_value } = await request.json();
          if (!medal_event_id || !country_id || !athlete_name || !medal_type) {
            return errorResponse('medal_event_id, country_id, athlete_name, and medal_type are required');
          }
          await env.DB.prepare(
            'INSERT INTO medals (medal_event_id, country_id, athlete_name, medal_type, record_type, result_value) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(medal_event_id, country_id, athlete_name, medal_type, record_type || null, result_value || null).run();
          return jsonResponse({ success: true, message: 'Medal awarded' }, 201);
        }
      }

      if (path === '/api/medals/all') {
        const olympics_id = url.searchParams.get('olympics');
        let query = `
          SELECT m.*, c.name as country_name, c.code as country_code, c.flag_url as country_flag_url,
            me.name as event_name, me.gender, me.olympics_id, s.name as sport_name, s.icon_url as sport_icon_url
          FROM medals m
          LEFT JOIN countries c ON m.country_id = c.id
          LEFT JOIN medal_events me ON m.medal_event_id = me.id
          LEFT JOIN sports s ON me.sport_id = s.id
        `;
        const params = [];
        if (olympics_id) { query += ' WHERE me.olympics_id = ?'; params.push(olympics_id); }
        query += ' ORDER BY m.created_at DESC';
        const stmt = env.DB.prepare(query);
        const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
        return jsonResponse(results.results);
      }

      if (path.match(/^\/api\/medals\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM medals WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Medal removed' });
        }
      }

      // ============ SCHEDULE ============
      if (path === '/api/schedule') {
        const olympics_id = url.searchParams.get('olympics');
        const date = url.searchParams.get('date');
        const sport = url.searchParams.get('sport');
        const status = url.searchParams.get('status');

        let query = `
          SELECT
            r.id, r.round_type, r.round_number, r.round_name,
            r.start_time_utc, r.end_time_utc, r.venue as round_venue, r.status, r.notes,
            me.id as medal_event_id, me.name as medal_event_name, me.gender, me.venue as event_venue, me.olympics_id,
            s.id as sport_id, s.name as sport_name, s.icon_url as sport_icon_url
          FROM event_rounds r
          LEFT JOIN medal_events me ON r.medal_event_id = me.id
          LEFT JOIN sports s ON me.sport_id = s.id
          WHERE 1=1
        `;
        const params = [];
        if (olympics_id) { query += ' AND me.olympics_id = ?'; params.push(olympics_id); }
        if (date) { query += " AND date(r.start_time_utc) = ?"; params.push(date); }
        if (sport) { query += ' AND me.sport_id = ?'; params.push(sport); }
        if (status) { query += ' AND r.status = ?'; params.push(status); }
        query += ' ORDER BY r.start_time_utc, s.name, me.name';

        const stmt = env.DB.prepare(query);
        const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
        return jsonResponse(results.results);
      }

      // ============ STATS ============
      if (path === '/api/stats') {
        const olympics_id = url.searchParams.get('olympics');

        const settings = await env.DB.prepare('SELECT key, value FROM settings').all();
        const settingsObj = {};
        settings.results.forEach(row => { settingsObj[row.key] = row.value; });

        // Get active or specified olympics
        let activeOlympics = null;
        if (olympics_id) {
          activeOlympics = await env.DB.prepare('SELECT * FROM olympics WHERE id = ?').bind(olympics_id).first();
        } else if (settingsObj.active_olympics_id) {
          activeOlympics = await env.DB.prepare('SELECT * FROM olympics WHERE id = ?').bind(settingsObj.active_olympics_id).first();
        } else {
          activeOlympics = await env.DB.prepare('SELECT * FROM olympics WHERE is_active = 1').first();
        }

        const olympicsFilter = activeOlympics ? activeOlympics.id : null;

        // Global counts
        const [allOlympics, countries, sports] = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as count FROM olympics').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM countries').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM sports').first(),
        ]);

        // Olympics-specific counts
        let medalEvents = { count: 0 }, rounds = { count: 0 }, medals = { count: 0 }, liveRounds = { count: 0 };
        let topCountries = { results: [] }, upcomingRounds = { results: [] }, liveNow = { results: [] };

        if (olympicsFilter) {
          [medalEvents, rounds, medals, liveRounds] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as count FROM medal_events WHERE olympics_id = ?').bind(olympicsFilter).first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM event_rounds r JOIN medal_events me ON r.medal_event_id = me.id WHERE me.olympics_id = ?').bind(olympicsFilter).first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM medals m JOIN medal_events me ON m.medal_event_id = me.id WHERE me.olympics_id = ?').bind(olympicsFilter).first(),
            env.DB.prepare("SELECT COUNT(*) as count FROM event_rounds r JOIN medal_events me ON r.medal_event_id = me.id WHERE me.olympics_id = ? AND r.status = 'live'").bind(olympicsFilter).first(),
          ]);

          topCountries = await env.DB.prepare(`
            SELECT c.name, c.code, c.flag_url,
              COUNT(CASE WHEN m.medal_type = 'gold' THEN 1 END) as gold,
              COUNT(CASE WHEN m.medal_type = 'silver' THEN 1 END) as silver,
              COUNT(CASE WHEN m.medal_type = 'bronze' THEN 1 END) as bronze,
              COUNT(m.id) as total
            FROM countries c
            JOIN medals m ON c.id = m.country_id
            JOIN medal_events me ON m.medal_event_id = me.id
            WHERE me.olympics_id = ?
            GROUP BY c.id
            HAVING total > 0
            ORDER BY gold DESC, silver DESC, bronze DESC
            LIMIT 5
          `).bind(olympicsFilter).all();

          upcomingRounds = await env.DB.prepare(`
            SELECT r.*, me.name as medal_event_name, me.gender, s.name as sport_name
            FROM event_rounds r
            JOIN medal_events me ON r.medal_event_id = me.id
            LEFT JOIN sports s ON me.sport_id = s.id
            WHERE me.olympics_id = ? AND r.start_time_utc >= datetime('now')
            ORDER BY r.start_time_utc
            LIMIT 10
          `).bind(olympicsFilter).all();

          liveNow = await env.DB.prepare(`
            SELECT r.*, me.name as medal_event_name, me.gender, s.name as sport_name
            FROM event_rounds r
            JOIN medal_events me ON r.medal_event_id = me.id
            LEFT JOIN sports s ON me.sport_id = s.id
            WHERE me.olympics_id = ? AND r.status = 'live'
            ORDER BY r.start_time_utc
          `).bind(olympicsFilter).all();
        }

        return jsonResponse({
          settings: settingsObj,
          activeOlympics,
          counts: {
            olympics: allOlympics.count,
            countries: countries.count,
            sports: sports.count,
            medalEvents: medalEvents.count,
            rounds: rounds.count,
            medals: medals.count,
            liveRounds: liveRounds.count,
          },
          topCountries: topCountries.results || [],
          upcomingRounds: upcomingRounds.results || [],
          liveNow: liveNow.results || [],
        });
      }

      // ============ AUTH ============
      if (path === '/api/auth/check') {
        if (method === 'POST') {
          return jsonResponse({ authenticated: checkAuth(request, env) });
        }
      }

      return errorResponse('Not found', 404);
    } catch (error) {
      console.error('Error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  },
};
