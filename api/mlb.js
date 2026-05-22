// /api/mlb.js — Vercel serverless function that proxies the MLB Stats API.
//
// Vercel runs this on the server (not in the browser), so it bypasses the CORS
// restrictions that would block a direct fetch from the React app.
//
// The function supports three queries via the `type` URL parameter:
//   /api/mlb?type=schedule              → today's games
//   /api/mlb?type=lineups&gamePk=12345  → starting lineups for a specific game
//   /api/mlb?type=plays&gamePk=12345    → live play-by-play for a specific game

// Team color and abbreviation lookup — MLB's API returns team IDs, not pretty data
const TEAM_META = {
  108: { abbr: 'LAA', color: '#BA0021' },
  109: { abbr: 'AZ',  color: '#A71930' },
  110: { abbr: 'BAL', color: '#DF4601' },
  111: { abbr: 'BOS', color: '#BD3039' },
  112: { abbr: 'CHC', color: '#0E3386' },
  113: { abbr: 'CIN', color: '#C6011F' },
  114: { abbr: 'CLE', color: '#00385D' },
  115: { abbr: 'COL', color: '#33006F' },
  116: { abbr: 'DET', color: '#0C2340' },
  117: { abbr: 'HOU', color: '#EB6E1F' },
  118: { abbr: 'KC',  color: '#004687' },
  119: { abbr: 'LAD', color: '#005A9C' },
  120: { abbr: 'WSH', color: '#AB0003' },
  121: { abbr: 'NYM', color: '#FF5910' },
  133: { abbr: 'ATH', color: '#003831' },
  134: { abbr: 'PIT', color: '#FDB827' },
  135: { abbr: 'SD',  color: '#2F241D' },
  136: { abbr: 'SEA', color: '#0C2C56' },
  137: { abbr: 'SF',  color: '#FD5A1E' },
  138: { abbr: 'STL', color: '#C41E3A' },
  139: { abbr: 'TB',  color: '#092C5C' },
  140: { abbr: 'TEX', color: '#003278' },
  141: { abbr: 'TOR', color: '#134A8E' },
  142: { abbr: 'MIN', color: '#002B5C' },
  143: { abbr: 'PHI', color: '#E81828' },
  144: { abbr: 'ATL', color: '#CE1141' },
  145: { abbr: 'CWS', color: '#27251F' },
  146: { abbr: 'MIA', color: '#00A3E0' },
  147: { abbr: 'NYY', color: '#003087' },
  158: { abbr: 'MIL', color: '#12284B' },
};

// Map MLB's verbose play descriptions to our short codes
const mapPlayEvent = (event) => {
  if (!event) return null;
  const e = event.toLowerCase();
  if (e.includes('home run')) return 'HR';
  if (e.includes('triple')) return '3B';
  if (e.includes('double')) return '2B';
  if (e.includes('single')) return '1B';
  if (e.includes('walk') || e.includes('hit by pitch')) return 'BB';
  if (e.includes('strikeout') && (e.includes('looking') || e.includes('called'))) return 'KL';
  if (e.includes('strikeout')) return 'K';
  if (e.includes('groundout') || e.includes('grounded into') || e.includes('forceout')) return 'GO';
  if (e.includes('flyout') || e.includes('pop out') || e.includes('lineout') || e.includes('flyball')) return 'FO';
  return null; // Plays we don't have a button for (errors, fielder's choice, etc.) get skipped
};

export default async function handler(req, res) {
  // Allow our frontend to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const { type, gamePk } = req.query;

  try {
    if (type === 'schedule') {
      return await handleSchedule(res);
    }
    if (type === 'lineups' && gamePk) {
      return await handleLineups(res, gamePk);
    }
    if (type === 'plays' && gamePk) {
      return await handlePlays(res, gamePk);
    }
    return res.status(400).json({ error: 'Missing or invalid type parameter' });
  } catch (err) {
    console.error('MLB API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function handleSchedule(res) {
  // Build today's date in YYYY-MM-DD format, in US Eastern time (where MLB schedules its day)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`;
  const data = await fetchJSON(url);

  const games = (data.dates?.[0]?.games || []).map(g => {
    const awayId = g.teams.away.team.id;
    const homeId = g.teams.home.team.id;
    const awayMeta = TEAM_META[awayId] || { abbr: '???', color: '#666' };
    const homeMeta = TEAM_META[homeId] || { abbr: '???', color: '#666' };

    // MLB statuses we care about
    const status = g.status.abstractGameState; // 'Preview' | 'Live' | 'Final'
    const detailed = g.status.detailedState; // more granular ("In Progress", "Postponed", etc.)
    const friendlyStatus =
      status === 'Final' ? 'FINAL' :
      status === 'Live' ? 'LIVE' :
      detailed === 'Postponed' || detailed === 'Cancelled' ? 'OFF' :
      'UPCOMING';

    return {
      id: String(g.gamePk),
      gamePk: g.gamePk,
      away: g.teams.away.team.teamName,
      home: g.teams.home.team.teamName,
      awayAbbr: awayMeta.abbr,
      homeAbbr: homeMeta.abbr,
      awayColor: awayMeta.color,
      homeColor: homeMeta.color,
      awayScore: g.teams.away.score ?? null,
      homeScore: g.teams.home.score ?? null,
      timeET: new Date(g.gameDate).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
      }),
      venue: g.venue?.name || '',
      status: friendlyStatus,
      currentInning: g.linescore?.currentInning ?? null,
      inningHalf: g.linescore?.inningHalf ?? null,
    };
  });

  return res.status(200).json({ date: today, games });
}

async function handleLineups(res, gamePk) {
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
  const data = await fetchJSON(url);

  const extract = (sideKey) => {
    const side = data.liveData?.boxscore?.teams?.[sideKey];
    if (!side) return [];
    // battingOrder is an array of player IDs in batting order (first 9 are the starters)
    const order = side.battingOrder || [];
    return order.slice(0, 9).map(pid => {
      const player = side.players?.[`ID${pid}`];
      return player?.person?.fullName || '';
    });
  };

  return res.status(200).json({
    away: extract('away'),
    home: extract('home'),
    posted: (data.liveData?.boxscore?.teams?.away?.battingOrder?.length || 0) > 0,
  });
}

async function handlePlays(res, gamePk) {
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
  const data = await fetchJSON(url);

  const allPlays = data.liveData?.plays?.allPlays || [];

  // Reduce MLB's verbose play list into our simple code sequence (in batting order)
  const plays = allPlays
    .filter(p => p.result?.event) // skip in-progress at-bats
    .map(p => ({
      code: mapPlayEvent(p.result.event),
      raw: p.result.event,
      inning: p.about?.inning,
      halfInning: p.about?.halfInning, // 'top' or 'bottom'
      batter: p.matchup?.batter?.fullName,
    }))
    .filter(p => p.code); // skip plays we don't model (errors, FC, etc.)

  return res.status(200).json({ plays });
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`MLB API returned ${r.status}`);
  return r.json();
}
