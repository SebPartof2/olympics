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
  if (!auth || auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
    return false;
  }
  return true;
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Countries routes
      if (path === '/api/countries') {
        if (method === 'GET') {
          const results = await env.DB.prepare('SELECT * FROM countries ORDER BY name').all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          const { name, code, flag_url } = body;
          if (!name || !code) return errorResponse('Name and code are required');
          await env.DB.prepare('INSERT INTO countries (name, code, flag_url) VALUES (?, ?, ?)')
            .bind(name, code.toUpperCase(), flag_url || null)
            .run();
          return jsonResponse({ success: true, message: 'Country added' }, 201);
        }
      }

      if (path.match(/^\/api\/countries\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM countries WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Country deleted' });
        }
      }

      // Sports routes
      if (path === '/api/sports') {
        if (method === 'GET') {
          const results = await env.DB.prepare('SELECT * FROM sports ORDER BY name').all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          const { name, icon } = body;
          if (!name) return errorResponse('Name is required');
          await env.DB.prepare('INSERT INTO sports (name, icon) VALUES (?, ?)')
            .bind(name, icon || null)
            .run();
          return jsonResponse({ success: true, message: 'Sport added' }, 201);
        }
      }

      if (path.match(/^\/api\/sports\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM sports WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Sport deleted' });
        }
      }

      // Events routes
      if (path === '/api/events') {
        if (method === 'GET') {
          const sport = url.searchParams.get('sport');
          const status = url.searchParams.get('status');
          let query = `
            SELECT e.*, s.name as sport_name
            FROM events e
            LEFT JOIN sports s ON e.sport_id = s.id
            WHERE 1=1
          `;
          const params = [];
          if (sport) {
            query += ' AND e.sport_id = ?';
            params.push(sport);
          }
          if (status) {
            query += ' AND e.status = ?';
            params.push(status);
          }
          query += ' ORDER BY e.event_date';
          const stmt = env.DB.prepare(query);
          const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          const { sport_id, name, event_date, venue, status } = body;
          if (!name) return errorResponse('Name is required');
          await env.DB.prepare(
            'INSERT INTO events (sport_id, name, event_date, venue, status) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(sport_id || null, name, event_date || null, venue || null, status || 'scheduled')
            .run();
          return jsonResponse({ success: true, message: 'Event added' }, 201);
        }
      }

      if (path.match(/^\/api\/events\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          const { sport_id, name, event_date, venue, status } = body;
          await env.DB.prepare(
            'UPDATE events SET sport_id = ?, name = ?, event_date = ?, venue = ?, status = ? WHERE id = ?'
          )
            .bind(sport_id || null, name, event_date || null, venue || null, status || 'scheduled', id)
            .run();
          return jsonResponse({ success: true, message: 'Event updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Event deleted' });
        }
      }

      // Medals routes
      if (path === '/api/medals') {
        if (method === 'GET') {
          // Get medal standings by country
          const results = await env.DB.prepare(`
            SELECT
              c.id,
              c.name,
              c.code,
              c.flag_url,
              COUNT(CASE WHEN m.medal_type = 'gold' THEN 1 END) as gold,
              COUNT(CASE WHEN m.medal_type = 'silver' THEN 1 END) as silver,
              COUNT(CASE WHEN m.medal_type = 'bronze' THEN 1 END) as bronze,
              COUNT(m.id) as total
            FROM countries c
            LEFT JOIN medals m ON c.id = m.country_id
            GROUP BY c.id
            HAVING total > 0
            ORDER BY gold DESC, silver DESC, bronze DESC
          `).all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          const { event_id, country_id, athlete_name, medal_type } = body;
          if (!event_id || !country_id || !athlete_name || !medal_type) {
            return errorResponse('event_id, country_id, athlete_name, and medal_type are required');
          }
          if (!['gold', 'silver', 'bronze'].includes(medal_type)) {
            return errorResponse('medal_type must be gold, silver, or bronze');
          }
          await env.DB.prepare(
            'INSERT INTO medals (event_id, country_id, athlete_name, medal_type) VALUES (?, ?, ?, ?)'
          )
            .bind(event_id, country_id, athlete_name, medal_type)
            .run();
          return jsonResponse({ success: true, message: 'Medal awarded' }, 201);
        }
      }

      if (path.match(/^\/api\/medals\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM medals WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Medal removed' });
        }
      }

      // Get all medals with details (for admin)
      if (path === '/api/medals/all') {
        if (method === 'GET') {
          const results = await env.DB.prepare(`
            SELECT
              m.*,
              c.name as country_name,
              c.code as country_code,
              e.name as event_name
            FROM medals m
            LEFT JOIN countries c ON m.country_id = c.id
            LEFT JOIN events e ON m.event_id = e.id
            ORDER BY m.created_at DESC
          `).all();
          return jsonResponse(results.results);
        }
      }

      // Results routes
      if (path === '/api/results') {
        if (method === 'GET') {
          const event_id = url.searchParams.get('event');
          let query = `
            SELECT
              r.*,
              c.name as country_name,
              c.code as country_code,
              c.flag_url,
              e.name as event_name,
              e.status as event_status
            FROM results r
            LEFT JOIN countries c ON r.country_id = c.id
            LEFT JOIN events e ON r.event_id = e.id
          `;
          if (event_id) {
            query += ' WHERE r.event_id = ?';
          }
          query += ' ORDER BY r.position ASC, r.updated_at DESC';
          const stmt = env.DB.prepare(query);
          const results = event_id ? await stmt.bind(event_id).all() : await stmt.all();
          return jsonResponse(results.results);
        }
        if (method === 'POST') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          const { event_id, country_id, athlete_name, score, position } = body;
          if (!event_id) return errorResponse('event_id is required');
          await env.DB.prepare(
            'INSERT INTO results (event_id, country_id, athlete_name, score, position) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(event_id, country_id || null, athlete_name || null, score || null, position || null)
            .run();
          return jsonResponse({ success: true, message: 'Result added' }, 201);
        }
      }

      if (path.match(/^\/api\/results\/\d+$/)) {
        const id = path.split('/').pop();
        if (method === 'PUT') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          const body = await request.json();
          const { score, position } = body;
          await env.DB.prepare(
            'UPDATE results SET score = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          )
            .bind(score || null, position || null, id)
            .run();
          return jsonResponse({ success: true, message: 'Result updated' });
        }
        if (method === 'DELETE') {
          if (!checkAuth(request, env)) return errorResponse('Unauthorized', 401);
          await env.DB.prepare('DELETE FROM results WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Result deleted' });
        }
      }

      // Stats route for dashboard
      if (path === '/api/stats') {
        const [countries, sports, events, medals, liveEvents] = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as count FROM countries').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM sports').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM events').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM medals').first(),
          env.DB.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'live'").first(),
        ]);

        // Top 5 countries by medals
        const topCountries = await env.DB.prepare(`
          SELECT
            c.name,
            c.code,
            c.flag_url,
            COUNT(CASE WHEN m.medal_type = 'gold' THEN 1 END) as gold,
            COUNT(CASE WHEN m.medal_type = 'silver' THEN 1 END) as silver,
            COUNT(CASE WHEN m.medal_type = 'bronze' THEN 1 END) as bronze,
            COUNT(m.id) as total
          FROM countries c
          LEFT JOIN medals m ON c.id = m.country_id
          GROUP BY c.id
          HAVING total > 0
          ORDER BY gold DESC, silver DESC, bronze DESC
          LIMIT 5
        `).all();

        // Today's events
        const todayEvents = await env.DB.prepare(`
          SELECT e.*, s.name as sport_name
          FROM events e
          LEFT JOIN sports s ON e.sport_id = s.id
          WHERE date(e.event_date) = date('now')
          ORDER BY e.event_date
          LIMIT 10
        `).all();

        return jsonResponse({
          counts: {
            countries: countries.count,
            sports: sports.count,
            events: events.count,
            medals: medals.count,
            liveEvents: liveEvents.count,
          },
          topCountries: topCountries.results,
          todayEvents: todayEvents.results,
        });
      }

      // Auth check endpoint
      if (path === '/api/auth/check') {
        if (method === 'POST') {
          const isValid = checkAuth(request, env);
          return jsonResponse({ authenticated: isValid });
        }
      }

      return errorResponse('Not found', 404);
    } catch (error) {
      console.error('Error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  },
};
