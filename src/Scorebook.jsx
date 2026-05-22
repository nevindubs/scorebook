import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, Check, Star, Edit3, X, Lock, Circle, AlertCircle, RefreshCw } from 'lucide-react';

// All game data, lineups, and play-by-play now come from /api/mlb (our serverless function).
// The function lives in /api/mlb.js and proxies the free MLB Stats API.

const PLAY_TYPES = [
  { code: '1B', label: 'Single', notation: '1B', fillBases: 1, isHit: true, isOut: false },
  { code: '2B', label: 'Double', notation: '2B', fillBases: 2, isHit: true, isOut: false },
  { code: '3B', label: 'Triple', notation: '3B', fillBases: 3, isHit: true, isOut: false },
  { code: 'HR', label: 'Home Run', notation: 'HR', fillBases: 4, isHit: true, isOut: false },
  { code: 'BB', label: 'Walk', notation: 'BB', fillBases: 1, isHit: false, isOut: false },
  { code: 'K', label: 'K Swinging', notation: 'K', fillBases: 0, isHit: false, isOut: true },
  { code: 'KL', label: 'K Looking', notation: 'ꓘ', fillBases: 0, isHit: false, isOut: true },
  { code: 'GO', label: 'Groundout', notation: '6-3', fillBases: 0, isHit: false, isOut: true },
  { code: 'FO', label: 'Flyout', notation: 'F8', fillBases: 0, isHit: false, isOut: true },
];

// Rough 2026 rosters — primary position players for each MLB club. Used to power
// the quick-select dropdown in the lineup editor. Users can also type a custom
// name (callups, subs, players I missed) — this list is just to speed things up.
const ROSTERS = {
  HOU: ['Jose Altuve', 'Yordan Alvarez', 'Alex Bregman', 'Kyle Tucker', 'Yainer Diaz', 'Jeremy Peña', 'Chas McCormick', 'Jake Meyers', 'Mauricio Dubón', 'Jon Singleton', 'Cam Smith', 'Victor Caratini', 'Zach Dezenzo'],
  CHC: ['Ian Happ', 'Cody Bellinger', 'Seiya Suzuki', 'Michael Busch', 'Nico Hoerner', 'Mike Tauchman', 'Christopher Morel', 'Nick Madrigal', 'Miguel Amaya', 'Pete Crow-Armstrong', 'Dansby Swanson', 'Matt Shaw', 'Carson Kelly'],
  STL: ['Masyn Winn', 'Lars Nootbaar', 'Willson Contreras', 'Nolan Arenado', 'Alec Burleson', 'Brendan Donovan', 'Iván Herrera', 'Jordan Walker', 'Thomas Saggese', 'Pedro Pagés', 'Victor Scott II', 'Nolan Gorman', 'Michael Siani'],
  CIN: ['Elly De La Cruz', 'Matt McLain', 'TJ Friedl', 'Spencer Steer', 'Jeimer Candelario', 'Tyler Stephenson', 'Christian Encarnacion-Strand', 'Jonathan India', 'Will Benson', 'Noelvi Marte', 'Stuart Fairchild', 'Santiago Espinal', 'Luke Maile'],
  CLE: ['Steven Kwan', 'José Ramírez', 'Josh Naylor', 'Lane Thomas', 'Bo Naylor', 'Andrés Giménez', 'Brayan Rocchio', 'Will Brennan', 'David Fry', 'Kyle Manzardo', 'Daniel Schneemann', 'Tyler Freeman', 'Austin Hedges'],
  PHI: ['Kyle Schwarber', 'Trea Turner', 'Bryce Harper', 'Nick Castellanos', 'Alec Bohm', 'J.T. Realmuto', 'Bryson Stott', 'Brandon Marsh', 'Johan Rojas', 'Edmundo Sosa', 'Garrett Stubbs', 'Weston Wilson', 'Cal Stevenson'],
  TB: ['Yandy Díaz', 'Brandon Lowe', 'Josh Lowe', 'Isaac Paredes', 'Junior Caminero', 'Christopher Morel', 'José Caballero', 'Jonny DeLuca', 'Ben Rortvedt', 'Curtis Mead', 'Richie Palacios', 'Jonathan Aranda', 'Taylor Walls'],
  NYY: ['Aaron Judge', 'Juan Soto', 'Anthony Volpe', 'Giancarlo Stanton', 'Anthony Rizzo', 'Gleyber Torres', 'Alex Verdugo', 'Austin Wells', 'DJ LeMahieu', 'Jose Trevino', 'Trent Grisham', 'Oswaldo Cabrera', 'Jasson Domínguez'],
  PIT: ['Oneil Cruz', 'Bryan Reynolds', 'Andrew McCutchen', 'Ke\'Bryan Hayes', 'Joey Bart', 'Jared Triolo', 'Isiah Kiner-Falefa', 'Jack Suwinski', 'Connor Joe', 'Nick Gonzales', 'Henry Davis', 'Edward Olivares', 'Michael A. Taylor'],
  TOR: ['George Springer', 'Bo Bichette', 'Vladimir Guerrero Jr.', 'Daulton Varsho', 'Justin Turner', 'Alejandro Kirk', 'Ernie Clement', 'Davis Schneider', 'Spencer Horwitz', 'Will Wagner', 'Addison Barger', 'Leo Jiménez', 'Tyler Heineman'],
  MIN: ['Carlos Correa', 'Royce Lewis', 'Byron Buxton', 'Willi Castro', 'Ryan Jeffers', 'Manuel Margot', 'Edouard Julien', 'Brooks Lee', 'Trevor Larnach', 'Matt Wallner', 'Christian Vázquez', 'Jose Miranda', 'Austin Martin'],
  BOS: ['Jarren Duran', 'Rafael Devers', 'Tyler O\'Neill', 'Masataka Yoshida', 'Triston Casas', 'Wilyer Abreu', 'Rob Refsnyder', 'Connor Wong', 'David Hamilton', 'Ceddanne Rafaela', 'Romy Gonzalez', 'Reese McGuire', 'Vaughn Grissom'],
  NYM: ['Francisco Lindor', 'Brandon Nimmo', 'Pete Alonso', 'Mark Vientos', 'Starling Marte', 'Jeff McNeil', 'Francisco Alvarez', 'Tyrone Taylor', 'Luisangel Acuña', 'Jesse Winker', 'Harrison Bader', 'Brett Baty', 'Luis Torrens'],
  MIA: ['Jazz Chisholm Jr.', 'Jesús Sánchez', 'Otto Lopez', 'Jake Burger', 'Connor Norby', 'Xavier Edwards', 'Nick Fortes', 'Derek Hill', 'Vidal Bruján', 'Jonah Bride', 'Dane Myers', 'Griffin Conine', 'Kyle Stowers'],
  DET: ['Riley Greene', 'Spencer Torkelson', 'Kerry Carpenter', 'Colt Keith', 'Matt Vierling', 'Parker Meadows', 'Jake Rogers', 'Andy Ibáñez', 'Trey Sweeney', 'Zach McKinstry', 'Wenceel Pérez', 'Justyn-Henry Malloy', 'Dillon Dingler'],
  BAL: ['Gunnar Henderson', 'Adley Rutschman', 'Jordan Westburg', 'Anthony Santander', 'Ryan Mountcastle', 'Cedric Mullins', 'Colton Cowser', 'Ryan O\'Hearn', 'Jackson Holliday', 'Heston Kjerstad', 'Ramón Urías', 'James McCann', 'Tyler O\'Neill'],
  WSH: ['CJ Abrams', 'Luis García Jr.', 'James Wood', 'Keibert Ruiz', 'Joey Gallo', 'Dylan Crews', 'Jacob Young', 'Nathaniel Lowe', 'Alex Call', 'José Tena', 'Riley Adams', 'Andrés Chaparro', 'Jose Tena'],
  ATL: ['Ronald Acuña Jr.', 'Ozzie Albies', 'Matt Olson', 'Marcell Ozuna', 'Austin Riley', 'Sean Murphy', 'Michael Harris II', 'Orlando Arcia', 'Jarred Kelenic', 'Travis d\'Arnaud', 'Ramón Laureano', 'Whit Merrifield', 'Gio Urshela'],
  SEA: ['Julio Rodríguez', 'Cal Raleigh', 'Randy Arozarena', 'Mitch Garver', 'Mitch Haniger', 'J.P. Crawford', 'Dylan Moore', 'Luke Raley', 'Victor Robles', 'Jorge Polanco', 'Justin Turner', 'Cade Marlowe', 'Leo Rivas'],
  KC: ['Bobby Witt Jr.', 'Salvador Perez', 'Vinnie Pasquantino', 'Maikel Garcia', 'MJ Melendez', 'Hunter Renfroe', 'Michael Massey', 'Kyle Isbel', 'Tommy Pham', 'Garrett Hampson', 'Adam Frazier', 'Freddy Fermin', 'Yuli Gurriel'],
  LAD: ['Mookie Betts', 'Shohei Ohtani', 'Freddie Freeman', 'Will Smith', 'Teoscar Hernández', 'Max Muncy', 'Tommy Edman', 'Andy Pages', 'Gavin Lux', 'Chris Taylor', 'Miguel Rojas', 'Enrique Hernández', 'James Outman'],
  MIL: ['Christian Yelich', 'William Contreras', 'Willy Adames', 'Sal Frelick', 'Jackson Chourio', 'Garrett Mitchell', 'Brice Turang', 'Joey Ortiz', 'Rhys Hoskins', 'Gary Sánchez', 'Blake Perkins', 'Andruw Monasterio', 'Jake Bauers'],
  TEX: ['Marcus Semien', 'Corey Seager', 'Adolis García', 'Nathaniel Lowe', 'Jonah Heim', 'Josh Jung', 'Evan Carter', 'Leody Taveras', 'Wyatt Langford', 'Jared Walsh', 'Ezequiel Duran', 'Travis Jankowski', 'Sam Huff'],
  LAA: ['Mike Trout', 'Taylor Ward', 'Anthony Rendon', 'Logan O\'Hoppe', 'Jo Adell', 'Zach Neto', 'Luis Rengifo', 'Mickey Moniak', 'Brandon Drury', 'Nolan Schanuel', 'Kevin Pillar', 'Matt Thaiss', 'Kyren Paris'],
  COL: ['Brenton Doyle', 'Ezequiel Tovar', 'Ryan McMahon', 'Charlie Blackmon', 'Kris Bryant', 'Elias Díaz', 'Michael Toglia', 'Sam Hilliard', 'Jacob Stallings', 'Hunter Goodman', 'Nolan Jones', 'Jordan Beck', 'Brendan Rodgers'],
  AZ: ['Ketel Marte', 'Corbin Carroll', 'Christian Walker', 'Lourdes Gurriel Jr.', 'Eugenio Suárez', 'Joc Pederson', 'Jake McCarthy', 'Geraldo Perdomo', 'Gabriel Moreno', 'Alek Thomas', 'Pavin Smith', 'Tucker Barnhart', 'Blaze Alexander'],
  ATH: ['Brent Rooker', 'JJ Bleday', 'Lawrence Butler', 'Zack Gelof', 'Tyler Soderstrom', 'Shea Langeliers', 'Seth Brown', 'Miguel Andujar', 'Max Schuemann', 'Esteury Ruiz', 'Daz Cameron', 'Jacob Wilson', 'Nick Allen'],
  SD: ['Fernando Tatis Jr.', 'Manny Machado', 'Xander Bogaerts', 'Jackson Merrill', 'Jake Cronenworth', 'Luis Arraez', 'Jurickson Profar', 'Kyle Higashioka', 'Donovan Solano', 'Tyler Wade', 'David Peralta', 'Bryce Johnson', 'Brett Sullivan'],
  CWS: ['Andrew Vaughn', 'Luis Robert Jr.', 'Yoán Moncada', 'Andrew Benintendi', 'Eloy Jiménez', 'Korey Lee', 'Lenyn Sosa', 'Gavin Sheets', 'Paul DeJong', 'Brooks Baldwin', 'Nicky Lopez', 'Bryan Ramos', 'Martín Maldonado'],
  SF: ['Jung Hoo Lee', 'Matt Chapman', 'Jorge Soler', 'Michael Conforto', 'Heliot Ramos', 'LaMonte Wade Jr.', 'Patrick Bailey', 'Tyler Fitzgerald', 'Casey Schmitt', 'Mike Yastrzemski', 'Curt Casali', 'Brett Wisely', 'Wilmer Flores'],
};

const STORAGE_KEY = 'mlb_scorebook_v3';
const NUM_INNINGS = 9;
const LINEUP_SIZE = 9;

export default function Scorebook() {
  const [screen, setScreen] = useState('home');
  const [selectedGame, setSelectedGame] = useState(null);
  const [lineups, setLineups] = useState({ away: [], home: [] });
  const [activeTeam, setActiveTeam] = useState('away');
  const [grid, setGrid] = useState({ away: {}, home: {} });
  const [currentBatter, setCurrentBatter] = useState({ away: 0, home: 0 });
  const [currentInning, setCurrentInning] = useState(1);
  const [outs, setOuts] = useState(0);
  const [stats, setStats] = useState({ totalPoints: 0, streak: 0, lastPlayDate: null, gamesCompleted: 0, badges: [] });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [summary, setSummary] = useState(null);
  const [editingLineup, setEditingLineup] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  // Live data state
  const [games, setGames] = useState([]); // today's schedule (fetched)
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState(null);
  const [officialPlays, setOfficialPlays] = useState([]); // for the currently-selected game
  const [lineupsPosted, setLineupsPosted] = useState(false);

  // Fetch today's schedule on mount, then refresh every 90 seconds so live statuses
  // (Upcoming → Live → Final) update without a manual reload.
  const loadGames = async () => {
    try {
      setGamesError(null);
      const r = await fetch('/api/mlb?type=schedule');
      if (!r.ok) throw new Error('Schedule fetch failed');
      const data = await r.json();
      setGames(data.games || []);
    } catch (e) {
      setGamesError(e.message);
    } finally {
      setGamesLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
    const t = setInterval(loadGames, 90000);
    return () => clearInterval(t);
  }, []);

  // While a game is selected, poll for new plays every 20 seconds so accuracy
  // grading reflects the live play-by-play feed.
  useEffect(() => {
    if (!selectedGame || screen !== 'game') return;
    let cancelled = false;
    const fetchPlays = async () => {
      try {
        const r = await fetch(`/api/mlb?type=plays&gamePk=${selectedGame.gamePk}`);
        if (!r.ok || cancelled) return;
        const data = await r.json();
        setOfficialPlays(data.plays || []);
      } catch (e) { /* ignore transient errors */ }
    };
    fetchPlays();
    const t = setInterval(fetchPlays, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, [selectedGame, screen]);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setStats(JSON.parse(raw));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const saveStats = async (next) => {
    setStats(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const selectGame = async (game) => {
    if (game.status === 'FINAL' || game.status === 'OFF') return;
    setSelectedGame(game);
    setGrid({ away: {}, home: {} });
    setCurrentBatter({ away: 0, home: 0 });
    setCurrentInning(1);
    setOuts(0);
    setActiveTeam('away');
    setOfficialPlays([]);
    setScreen('game');

    // Try to fetch the official lineups; if they're not posted yet, fall back to empty
    try {
      const r = await fetch(`/api/mlb?type=lineups&gamePk=${game.gamePk}`);
      if (r.ok) {
        const data = await r.json();
        const away = (data.away && data.away.length === 9) ? data.away : Array(LINEUP_SIZE).fill('');
        const home = (data.home && data.home.length === 9) ? data.home : Array(LINEUP_SIZE).fill('');
        setLineups({ away, home });
        setLineupsPosted(data.posted && away[0] && home[0]);
        // Only auto-open the lineup editor if MLB hasn't posted lineups yet
        if (!away[0] || !home[0]) setEditingLineup('away');
      } else {
        setLineups({ away: Array(LINEUP_SIZE).fill(''), home: Array(LINEUP_SIZE).fill('') });
        setLineupsPosted(false);
        setEditingLineup('away');
      }
    } catch (e) {
      setLineups({ away: Array(LINEUP_SIZE).fill(''), home: Array(LINEUP_SIZE).fill('') });
      setLineupsPosted(false);
      setEditingLineup('away');
    }
  };

  const totalPlaysLogged = () => {
    let c = 0;
    ['away', 'home'].forEach(t => {
      Object.values(grid[t]).forEach(inn => { c += Object.keys(inn).length; });
    });
    return c;
  };

  // A cell is locked if it's a past inning, the away half of a finished half-inning, or any batter who isn't the current one
  const isCellLocked = (team, batterIdx, inning) => {
    if (inning > currentInning) return false;
    if (inning < currentInning) return true;
    if (team !== activeTeam) {
      return team === 'away';
    }
    return batterIdx !== currentBatter[team];
  };

  const logPlay = (playCode) => {
    if (!selectedCell) return;
    const { team, batterIdx, inning } = selectedCell;
    if (isCellLocked(team, batterIdx, inning)) return;

    const playType = PLAY_TYPES.find(p => p.code === playCode);
    const officialIdx = totalPlaysLogged();
    const officialPlay = officialPlays[officialIdx];
    const official = officialPlay?.code || null;
    // Only grade as "correct" if we have a real official play to compare against.
    // If MLB hasn't logged it yet (live game, ahead of feed), award participation points.
    const correct = official ? official === playCode : false;
    const points = official ? (correct ? 10 : 2) : 5;

    const newGrid = {
      ...grid,
      [team]: {
        ...grid[team],
        [batterIdx]: {
          ...(grid[team][batterIdx] || {}),
          [inning]: { code: playCode, notation: playType.notation, correct, points, official },
        },
      },
    };
    setGrid(newGrid);
    setFlash({ correct, points, code: playCode });
    setTimeout(() => setFlash(null), 1400);

    const newOuts = playType.isOut ? outs + 1 : outs;
    let nextBatterIdx = (batterIdx + 1) % LINEUP_SIZE;
    let nextInning = inning;
    let nextTeam = team;
    let nextOuts = newOuts;

    if (newOuts >= 3) {
      nextOuts = 0;
      if (team === 'away') {
        nextTeam = 'home';
        nextBatterIdx = currentBatter.home;
      } else {
        nextTeam = 'away';
        nextBatterIdx = currentBatter.away;
        nextInning = inning + 1;
      }
    }

    setOuts(nextOuts);
    setCurrentBatter(prev => ({ ...prev, [team]: (batterIdx + 1) % LINEUP_SIZE }));
    setActiveTeam(nextTeam);
    setCurrentInning(nextInning);
    setSelectedCell({ team: nextTeam, batterIdx: nextBatterIdx, inning: nextInning });

    if (nextInning > NUM_INNINGS) {
      setTimeout(() => finishGame(newGrid), 500);
    }
  };

  const finishGame = (finalGrid) => {
    let earned = 0, accurate = 0, total = 0;
    ['away', 'home'].forEach(team => {
      Object.values(finalGrid[team]).forEach(inn => {
        Object.values(inn).forEach(cell => {
          earned += cell.points;
          total += 1;
          if (cell.correct) accurate += 1;
        });
      });
    });
    const accuracy = total > 0 ? Math.round((accurate / total) * 100) : 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = stats.streak;
    if (stats.lastPlayDate === today) {}
    else if (stats.lastPlayDate === yesterday) newStreak = stats.streak + 1;
    else newStreak = 1;

    const newBadges = [...stats.badges];
    if (accuracy === 100 && !newBadges.includes('perfect')) newBadges.push('perfect');
    if (accuracy >= 80 && !newBadges.includes('sharp')) newBadges.push('sharp');
    if (newStreak >= 3 && !newBadges.includes('hot')) newBadges.push('hot');
    if (stats.gamesCompleted + 1 >= 5 && !newBadges.includes('veteran')) newBadges.push('veteran');

    const streakBonus = newStreak * 5;
    const totalEarned = earned + streakBonus;

    saveStats({
      totalPoints: stats.totalPoints + totalEarned,
      streak: newStreak,
      lastPlayDate: today,
      gamesCompleted: stats.gamesCompleted + 1,
      badges: newBadges,
    });

    setSummary({
      earned: totalEarned, basePoints: earned, streakBonus,
      accurate, total, accuracy,
      newBadges: newBadges.filter(b => !stats.badges.includes(b)),
      streak: newStreak,
    });
    setScreen('summary');
  };

  if (loading) return <div style={S.loading}><div style={S.loadingDot}/></div>;

  return (
    <div style={S.app}>
      <style>{globalCSS}</style>
      {screen === 'home' && (
        <HomeScreen
          stats={stats}
          onSelectGame={selectGame}
          games={games}
          gamesLoading={gamesLoading}
          gamesError={gamesError}
          onRefresh={loadGames}
        />
      )}
      {screen === 'game' && selectedGame && (
        <GameScreen
          game={selectedGame} lineups={lineups} grid={grid}
          currentBatter={currentBatter} currentInning={currentInning}
          activeTeam={activeTeam} outs={outs} flash={flash}
          selectedCell={selectedCell} setSelectedCell={setSelectedCell}
          isCellLocked={isCellLocked}
          onLogPlay={logPlay} onBack={() => setScreen('home')}
          onEditLineup={(team) => setEditingLineup(team)}
          onFinish={() => finishGame(grid)}
        />
      )}
      {screen === 'summary' && summary && (
        <SummaryScreen summary={summary} game={selectedGame} onHome={() => { setScreen('home'); setSummary(null); }} />
      )}
      {editingLineup && (
        <LineupEditor
          team={editingLineup}
          teamName={editingLineup === 'away' ? selectedGame.away : selectedGame.home}
          teamAbbr={editingLineup === 'away' ? selectedGame.awayAbbr : selectedGame.homeAbbr}
          lineup={lineups[editingLineup]}
          onSave={(newLineup) => {
            const updated = { ...lineups, [editingLineup]: newLineup };
            setLineups(updated);
            if (editingLineup === 'away' && updated.home.every(n => !n)) {
              setEditingLineup('home');
            } else {
              setEditingLineup(null);
            }
          }}
          onClose={() => setEditingLineup(null)}
        />
      )}
    </div>
  );
}

function HomeScreen({ stats, onSelectGame, games, gamesLoading, gamesError, onRefresh }) {
  const liveGames = games.filter(g => g.status === 'LIVE');
  const upcoming = games.filter(g => g.status === 'UPCOMING');
  const finished = games.filter(g => g.status === 'FINAL');
  const off = games.filter(g => g.status === 'OFF');

  return (
    <div style={S.screen}>
      <header style={S.header}>
        <div style={S.brandRow}>
          <h1 style={S.brandTitle}>Scorebook</h1>
          <div style={S.brandDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      <div style={S.statRow}>
        <StatCard icon={<Trophy size={16}/>} label="Points" value={stats.totalPoints} accent="#dc2626"/>
        <StatCard icon={<Flame size={16}/>} label="Streak" value={`${stats.streak}d`} accent="#ea580c"/>
        <StatCard icon={<Award size={16}/>} label="Games" value={stats.gamesCompleted} accent="#16a34a"/>
      </div>

      {stats.badges.length > 0 && (
        <div style={S.badgeRow}>{stats.badges.map(b => <Badge key={b} type={b}/>)}</div>
      )}

      {gamesLoading && games.length === 0 && (
        <div style={S.scheduleStatus}>Loading today's schedule...</div>
      )}

      {gamesError && (
        <div style={S.scheduleError}>
          <span>Couldn't load schedule: {gamesError}</span>
          <button onClick={onRefresh} style={S.refreshBtn}><RefreshCw size={13}/> Retry</button>
        </div>
      )}

      {!gamesLoading && !gamesError && games.length === 0 && (
        <div style={S.scheduleStatus}>No games scheduled today.</div>
      )}

      {liveGames.length > 0 && (
        <>
          <SectionLabel>Live Now · {liveGames.length}</SectionLabel>
          <div style={S.gameList}>
            {liveGames.map(g => <GameCard key={g.id} game={g} onSelect={onSelectGame} />)}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <SectionLabel>Upcoming · {upcoming.length}</SectionLabel>
          <div style={S.gameList}>
            {upcoming.map(g => <GameCard key={g.id} game={g} onSelect={onSelectGame} />)}
          </div>
        </>
      )}

      {finished.length > 0 && (
        <>
          <SectionLabel>Final · {finished.length}</SectionLabel>
          <div style={S.gameList}>
            {finished.map(g => <GameCard key={g.id} game={g} onSelect={onSelectGame} />)}
          </div>
        </>
      )}

      {off.length > 0 && (
        <>
          <SectionLabel>Postponed</SectionLabel>
          <div style={S.gameList}>
            {off.map(g => <GameCard key={g.id} game={g} onSelect={onSelectGame} />)}
          </div>
        </>
      )}

      <div style={S.footnote}>
        Pick a live or upcoming game to score. Match the official play-by-play for accuracy points and build a streak by scoring daily.
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={S.sectionLabel}>{children}</div>;
}

function StatusPill({ status }) {
  const map = {
    LIVE: { bg: '#dc2626', fg: '#fff', label: 'LIVE', dot: true },
    UPCOMING: { bg: '#e5e7eb', fg: '#374151', label: 'UPCOMING' },
    FINAL: { bg: '#9ca3af', fg: '#fff', label: 'FINAL' },
    OFF: { bg: '#fef3c7', fg: '#92400e', label: 'POSTPONED' },
  };
  const cfg = map[status] || map.UPCOMING;
  return (
    <span style={{ ...S.pill, background: cfg.bg, color: cfg.fg }}>
      {cfg.dot && <span style={S.liveDot}/>}
      {cfg.label}
    </span>
  );
}

function GameCard({ game, onSelect }) {
  const isFinal = game.status === 'FINAL';
  const isOff = game.status === 'OFF';
  const disabled = isFinal || isOff;
  const showScore = game.status === 'LIVE' || isFinal;

  return (
    <button
      onClick={() => onSelect(game)}
      disabled={disabled}
      style={{ ...S.gameCard, ...(disabled ? S.gameCardDisabled : {}) }}
    >
      <div style={S.gameTopRow}>
        <StatusPill status={game.status} />
        <span style={S.gameTime}>
          {game.status === 'LIVE' && game.currentInning
            ? `${game.inningHalf === 'Top' ? '▲' : '▼'} ${game.currentInning}`
            : game.timeET}
        </span>
      </div>
      <div style={S.matchupRow}>
        <div style={S.teamRow}>
          <div style={{ ...S.teamDot, background: disabled ? '#9ca3af' : game.awayColor }}/>
          <span style={S.teamAbbr}>{game.awayAbbr}</span>
          <span style={S.teamFullName}>{game.away}</span>
          {showScore && <span style={S.teamScore}>{game.awayScore ?? 0}</span>}
        </div>
        <div style={S.teamRow}>
          <div style={{ ...S.teamDot, background: disabled ? '#9ca3af' : game.homeColor }}/>
          <span style={S.teamAbbr}>{game.homeAbbr}</span>
          <span style={S.teamFullName}>{game.home}</span>
          {showScore && <span style={S.teamScore}>{game.homeScore ?? 0}</span>}
        </div>
      </div>
      <div style={S.gameVenue}>{game.venue}</div>
    </button>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statIcon, color: accent }}>{icon}</div>
      <div style={S.statValue}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function Badge({ type }) {
  const config = {
    perfect: { label: 'Perfect', color: '#dc2626' },
    sharp: { label: 'Sharp Eye', color: '#2563eb' },
    hot: { label: 'On Fire', color: '#ea580c' },
    veteran: { label: 'Veteran', color: '#16a34a' },
  }[type];
  if (!config) return null;
  return (
    <div style={{ ...S.badge, borderColor: config.color, color: config.color }}>
      <Star size={10} fill={config.color}/>
      <span>{config.label}</span>
    </div>
  );
}

function GameScreen({ game, lineups, grid, currentBatter, currentInning, activeTeam, outs, flash, selectedCell, setSelectedCell, isCellLocked, onLogPlay, onBack, onEditLineup, onFinish }) {
  const [viewingTeam, setViewingTeam] = useState(activeTeam);

  useEffect(() => { setViewingTeam(activeTeam); }, [activeTeam]);

  useEffect(() => {
    if (!selectedCell || selectedCell.team !== activeTeam || selectedCell.inning !== currentInning || selectedCell.batterIdx !== currentBatter[activeTeam]) {
      setSelectedCell({ team: activeTeam, batterIdx: currentBatter[activeTeam], inning: currentInning });
    }
  }, [activeTeam, currentInning, currentBatter]);

  const computeLine = (team) => {
    const innings = Array(NUM_INNINGS).fill(0);
    let hits = 0;
    Object.entries(grid[team]).forEach(([_, inn]) => {
      Object.entries(inn).forEach(([innNum, cell]) => {
        const pt = PLAY_TYPES.find(p => p.code === cell.code);
        if (pt?.isHit) hits += 1;
        if (pt?.code === 'HR') innings[parseInt(innNum) - 1] += 1;
      });
    });
    return { innings, hits, runs: innings.reduce((a, b) => a + b, 0) };
  };

  const awayLine = computeLine('away');
  const homeLine = computeLine('home');
  const viewingLineup = lineups[viewingTeam];
  const canLog = selectedCell && !isCellLocked(selectedCell.team, selectedCell.batterIdx, selectedCell.inning);
  const selectedIsLocked = selectedCell && isCellLocked(selectedCell.team, selectedCell.batterIdx, selectedCell.inning);

  return (
    <div style={S.gameScreen}>
      <div style={S.gameTopBar}>
        <button onClick={onBack} style={S.iconBtn} aria-label="Back">←</button>
        <div style={S.gameTitleWrap}>
          <div style={S.gameTitle}>
            <span style={{ color: game.awayColor }}>{game.awayAbbr}</span>
            <span style={S.gameTitleAt}>@</span>
            <span style={{ color: game.homeColor }}>{game.homeAbbr}</span>
          </div>
          <div style={S.gameSubtitle}>{game.venue}</div>
        </div>
        <button onClick={onFinish} style={S.endBtn}>End</button>
      </div>

      <div style={S.linescoreWrap}>
        <table style={S.linescore}>
          <thead>
            <tr>
              <th style={S.lsTeamHead}></th>
              {Array.from({length: NUM_INNINGS}, (_, i) => (
                <th key={i} style={{ ...S.lsHead, ...(currentInning === i+1 ? S.lsHeadActive : {}) }}>{i+1}</th>
              ))}
              <th style={S.lsTotal}>R</th>
              <th style={S.lsTotal}>H</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...S.lsTeamCell, color: game.awayColor }}>{game.awayAbbr}</td>
              {awayLine.innings.map((v, i) => (
                <td key={i} style={S.lsCell}>{i < currentInning - 1 || (i === currentInning - 1 && activeTeam === 'home') ? v : ''}</td>
              ))}
              <td style={{ ...S.lsCell, ...S.lsTotalCell }}>{awayLine.runs}</td>
              <td style={{ ...S.lsCell, ...S.lsTotalCell }}>{awayLine.hits}</td>
            </tr>
            <tr>
              <td style={{ ...S.lsTeamCell, color: game.homeColor }}>{game.homeAbbr}</td>
              {homeLine.innings.map((v, i) => (
                <td key={i} style={S.lsCell}>{i < currentInning - 1 ? v : ''}</td>
              ))}
              <td style={{ ...S.lsCell, ...S.lsTotalCell }}>{homeLine.runs}</td>
              <td style={{ ...S.lsCell, ...S.lsTotalCell }}>{homeLine.hits}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={S.statusBar}>
        <div style={S.statusBlock}>
          <div style={S.statusLabel}>Inning</div>
          <div style={S.statusValue}>{activeTeam === 'away' ? '▲' : '▼'} {currentInning}</div>
        </div>
        <div style={S.statusBlock}>
          <div style={S.statusLabel}>Outs</div>
          <div style={S.outsDots}>
            {[0,1,2].map(i => (
              <div key={i} style={{ ...S.outDot, background: i < outs ? '#fff' : 'transparent' }}/>
            ))}
          </div>
        </div>
        <div style={{ ...S.statusBlock, alignItems: 'flex-end' }}>
          <div style={S.statusLabel}>At Bat</div>
          <div style={S.statusValue}>
            {lineups[activeTeam][currentBatter[activeTeam]] || <span style={{ opacity: 0.5 }}>—</span>}
          </div>
        </div>
      </div>

      <div style={S.teamToggle}>
        <button
          onClick={() => setViewingTeam('away')}
          style={{ ...S.teamToggleBtn, ...(viewingTeam === 'away' ? { ...S.teamToggleActive, background: game.awayColor } : {}) }}
        >
          {game.awayAbbr} {activeTeam === 'away' && <span style={S.activeIndicator}>●</span>}
        </button>
        <button
          onClick={() => setViewingTeam('home')}
          style={{ ...S.teamToggleBtn, ...(viewingTeam === 'home' ? { ...S.teamToggleActive, background: game.homeColor } : {}) }}
        >
          {game.homeAbbr} {activeTeam === 'home' && <span style={S.activeIndicator}>●</span>}
        </button>
        <button onClick={() => onEditLineup(viewingTeam)} style={S.lineupBtn} aria-label="Edit lineup">
          <Edit3 size={13}/>
        </button>
      </div>

      <div style={S.scorebookWrap}>
        {viewingLineup.every(n => !n) ? (
          <div style={S.emptyLineup}>
            <AlertCircle size={20} style={{ color: '#9ca3af', marginBottom: 8 }}/>
            <div style={S.emptyLineupTitle}>No lineup entered</div>
            <div style={S.emptyLineupText}>
              Tap the edit icon above to enter the starting nine for the {viewingTeam === 'away' ? game.away : game.home}.
            </div>
          </div>
        ) : (
          <table style={S.scorebook}>
            <thead>
              <tr>
                <th style={S.gridHeadNo}>#</th>
                <th style={S.gridHeadName}>Batter</th>
                {Array.from({length: NUM_INNINGS}, (_, i) => (
                  <th key={i} style={{ ...S.gridHeadInn, ...(currentInning === i+1 && viewingTeam === activeTeam ? S.gridHeadInnActive : {}) }}>{i+1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viewingLineup.map((player, batterIdx) => (
                <tr key={batterIdx}>
                  <td style={S.gridNo}>{batterIdx + 1}</td>
                  <td style={{ ...S.gridName, ...(currentBatter[viewingTeam] === batterIdx && activeTeam === viewingTeam ? S.gridNameActive : {}) }}>
                    {player || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  {Array.from({length: NUM_INNINGS}, (_, innIdx) => {
                    const inning = innIdx + 1;
                    const cell = grid[viewingTeam][batterIdx]?.[inning];
                    const isSelected = selectedCell?.team === viewingTeam && selectedCell?.batterIdx === batterIdx && selectedCell?.inning === inning;
                    const isCurrent = viewingTeam === activeTeam && batterIdx === currentBatter[activeTeam] && inning === currentInning;
                    const locked = isCellLocked(viewingTeam, batterIdx, inning);
                    return (
                      <td
                        key={innIdx}
                        onClick={() => !locked && setSelectedCell({ team: viewingTeam, batterIdx, inning })}
                        style={{
                          ...S.gridCell,
                          ...(isCurrent ? S.gridCellCurrent : {}),
                          ...(isSelected && !cell && !locked ? S.gridCellSelected : {}),
                          ...(locked && !cell ? S.gridCellLocked : {}),
                          cursor: locked ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {cell ? <ScoreCell cell={cell} /> : (isCurrent ? <span className="pulse-dot" style={S.cellPulse}>●</span> : '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {flash && (
        <div style={{ ...S.flashCard, background: flash.correct ? '#16a34a' : '#64748b' }}>
          {flash.correct ? <Check size={16}/> : <Circle size={10} fill="#fff"/>}
          <span>{flash.correct ? 'Nailed it' : 'Logged'} · +{flash.points}</span>
        </div>
      )}

      <div style={S.playInputWrap}>
        <div style={S.playInputLabel}>
          {selectedIsLocked ? (
            <span style={S.lockedLabel}><Lock size={11}/> Past at-bats are locked</span>
          ) : canLog ? (
            <>Log play for <strong style={S.atBatName}>{lineups[selectedCell.team][selectedCell.batterIdx] || 'this batter'}</strong></>
          ) : (
            'Tap the current at-bat to log a play'
          )}
        </div>
        <div style={S.playGrid}>
          {PLAY_TYPES.map(play => (
            <button
              key={play.code}
              onClick={() => onLogPlay(play.code)}
              disabled={!canLog}
              style={{ ...S.playBtn, ...(!canLog ? S.playBtnDisabled : {}) }}
            >
              <div style={S.playBtnGlyph}>
                <GlyphPreview code={play.code} />
              </div>
              <span style={S.playBtnLabel}>{play.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mini preview of the scorebook glyph shown on each play button
function GlyphPreview({ code }) {
  // Same SVG language as the full ScoreCell, but stripped of selected/correct state
  return (
    <svg viewBox="0 0 40 40" style={{ width: 30, height: 30 }}>
      <GlyphMarks code={code} />
    </svg>
  );
}

// The actual pencil marks for each play type — drawn at viewBox 0 0 40 40
function GlyphMarks({ code }) {
  const ink = '#0f172a';
  const inkLight = '#475569';

  if (code === '1B') {
    // Single: short horizontal hash in lower-right (toward 1B)
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <line x1="26" y1="30" x2="34" y2="30" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
      </>
    );
  }
  if (code === '2B') {
    // Double: two horizontal hashes, upper-right corner (toward 2B)
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <line x1="26" y1="9" x2="34" y2="9" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="26" y1="14" x2="34" y2="14" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
      </>
    );
  }
  if (code === '3B') {
    // Triple: three horizontal hashes, upper-left (toward 3B)
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <line x1="6" y1="9" x2="14" y2="9" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="6" y1="14" x2="14" y2="14" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="6" y1="19" x2="14" y2="19" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
      </>
    );
  }
  if (code === 'HR') {
    // Home run: filled diamond (runner came all the way home)
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="#dc2626" stroke="#dc2626" strokeWidth="1"/>
        <text x="20" y="25" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="-apple-system, sans-serif">HR</text>
      </>
    );
  }
  if (code === 'BB') {
    // Walk: "BB" in lower-right of diamond
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <text x="28" y="32" textAnchor="middle" fill={ink} fontSize="9" fontWeight="700" fontFamily="-apple-system, sans-serif">BB</text>
      </>
    );
  }
  if (code === 'K') {
    // Strikeout swinging: big K centered
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <text x="20" y="26" textAnchor="middle" fill={ink} fontSize="18" fontWeight="800" fontFamily="-apple-system, sans-serif">K</text>
      </>
    );
  }
  if (code === 'KL') {
    // Strikeout looking: backwards K (mirrored horizontally)
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <g transform="translate(40, 0) scale(-1, 1)">
          <text x="20" y="26" textAnchor="middle" fill={ink} fontSize="18" fontWeight="800" fontFamily="-apple-system, sans-serif">K</text>
        </g>
      </>
    );
  }
  if (code === 'GO') {
    // Groundout 6-3
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <text x="20" y="24" textAnchor="middle" fill={inkLight} fontSize="11" fontWeight="700" fontFamily="-apple-system, sans-serif">6-3</text>
      </>
    );
  }
  if (code === 'FO') {
    // Flyout F8
    return (
      <>
        <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        <text x="20" y="24" textAnchor="middle" fill={inkLight} fontSize="11" fontWeight="700" fontFamily="-apple-system, sans-serif">F8</text>
      </>
    );
  }
  return null;
}

function ScoreCell({ cell }) {
  const isCorrect = cell.correct;
  // Hint background — green for accurate, amber for off-call
  const bgColor = isCorrect ? 'rgba(22, 163, 74, 0.06)' : 'rgba(234, 88, 12, 0.06)';

  return (
    <div style={{ ...S.scoreCell, background: bgColor }}>
      <svg viewBox="0 0 40 40" style={S.diamond}>
        <GlyphMarks code={cell.code} />
      </svg>
      {!cell.correct && cell.official && (
        <span style={S.cellOfficial}>{PLAY_TYPES.find(p => p.code === cell.official)?.notation}</span>
      )}
    </div>
  );
}

function LineupEditor({ team, teamName, teamAbbr, lineup, onSave, onClose }) {
  const [editLineup, setEditLineup] = useState([...lineup]);
  const [openPickerIdx, setOpenPickerIdx] = useState(null);
  const roster = ROSTERS[teamAbbr] || [];

  const updateSlot = (i, name) => {
    const next = [...editLineup];
    next[i] = name;
    setEditLineup(next);
  };

  // Players already used elsewhere in the lineup (so they get hidden from other dropdowns)
  const usedElsewhere = (idx) => new Set(editLineup.filter((n, i) => i !== idx && n));

  return (
    <div style={S.modalBackdrop} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div>
            <div style={S.modalTitle}>Lineup Card</div>
            <div style={S.modalSub}>{teamName}</div>
          </div>
          <button onClick={onClose} style={S.iconBtnSm}><X size={18}/></button>
        </div>
        <div style={S.modalHint}>
          Tap a slot to pick from the {teamName} roster, or type a name for callups and subs.
        </div>
        <div style={S.modalBody}>
          {editLineup.map((name, i) => (
            <div key={i} style={S.lineupRow}>
              <div style={S.lineupNum}>{i+1}</div>
              <PlayerPicker
                value={name}
                onChange={(v) => updateSlot(i, v)}
                roster={roster}
                excluded={usedElsewhere(i)}
                isOpen={openPickerIdx === i}
                onOpen={() => setOpenPickerIdx(i)}
                onClose={() => setOpenPickerIdx(null)}
                slotIndex={i}
              />
            </div>
          ))}
        </div>
        <div style={S.modalFooter}>
          <button onClick={onClose} style={S.modalCancel}>Cancel</button>
          <button onClick={() => onSave(editLineup)} style={S.modalSave}>Save Lineup</button>
        </div>
      </div>
    </div>
  );
}

function PlayerPicker({ value, onChange, roster, excluded, isOpen, onOpen, onClose, slotIndex }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('list'); // 'list' | 'type'

  useEffect(() => {
    if (isOpen) { setQuery(''); setMode('list'); }
  }, [isOpen]);

  const available = roster.filter(p => !excluded.has(p));
  const filtered = query
    ? available.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : available;

  const pick = (name) => {
    onChange(name);
    onClose();
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  if (!isOpen) {
    return (
      <button type="button" onClick={onOpen} style={{ ...S.pickerBtn, ...(value ? {} : S.pickerBtnEmpty) }}>
        <span style={S.pickerValue}>
          {value || <span style={S.pickerPlaceholder}>Select batter {slotIndex + 1}</span>}
        </span>
        {value ? (
          <span onClick={clear} style={S.pickerClear} role="button" aria-label="Clear">
            <X size={13}/>
          </span>
        ) : (
          <span style={S.pickerCaret}>▾</span>
        )}
      </button>
    );
  }

  return (
    <div style={S.pickerOpen}>
      <div style={S.pickerSearchRow}>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={mode === 'type' ? 'Type any name' : 'Search roster'}
          style={S.pickerSearch}
        />
        <button onClick={onClose} style={S.pickerCloseBtn}><X size={14}/></button>
      </div>
      {mode === 'list' ? (
        <div style={S.pickerList}>
          {filtered.length === 0 ? (
            <button onClick={() => { setMode('type'); }} style={S.pickerEmpty}>
              No matches — tap to type a custom name
            </button>
          ) : (
            <>
              {filtered.map(p => (
                <button key={p} onClick={() => pick(p)} style={S.pickerItem}>
                  {p}
                </button>
              ))}
              {query && (
                <button onClick={() => pick(query)} style={S.pickerItemCustom}>
                  Use "{query}" as custom name
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={S.pickerList}>
          <button onClick={() => pick(query)} disabled={!query} style={{ ...S.pickerItem, ...(query ? {} : { opacity: 0.4 }) }}>
            {query ? `Use "${query}"` : 'Type a name above'}
          </button>
          <button onClick={() => setMode('list')} style={S.pickerItemCustom}>
            ← Back to roster
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryScreen({ summary, game, onHome }) {
  return (
    <div style={S.screen}>
      <div style={S.summaryHero}>
        <div style={S.summaryStamp}>Final</div>
        <div style={S.summaryGame}>{game.awayAbbr} @ {game.homeAbbr}</div>
        <div style={S.summaryBig}>+{summary.earned}</div>
        <div style={S.summarySub}>Points Earned</div>
      </div>

      <div style={S.summaryRow}>
        <div style={S.summaryStat}>
          <div style={S.summaryStatVal}>{summary.accuracy}%</div>
          <div style={S.summaryStatLabel}>Accuracy</div>
        </div>
        <div style={S.summaryStat}>
          <div style={S.summaryStatVal}>{summary.accurate}/{summary.total}</div>
          <div style={S.summaryStatLabel}>Correct</div>
        </div>
        <div style={S.summaryStat}>
          <div style={S.summaryStatVal}>{summary.streak}d</div>
          <div style={S.summaryStatLabel}>Streak</div>
        </div>
      </div>

      <div style={S.breakdown}>
        <div style={S.breakdownRow}><span>Base scoring</span><span>+{summary.basePoints}</span></div>
        <div style={S.breakdownRow}><span>Streak bonus ({summary.streak} days)</span><span>+{summary.streakBonus}</span></div>
        <div style={{ ...S.breakdownRow, ...S.breakdownTotal }}><span>Total</span><span>+{summary.earned}</span></div>
      </div>

      {summary.newBadges.length > 0 && (
        <div style={S.newBadges}>
          <div style={S.newBadgesTitle}>New Badges Unlocked</div>
          <div style={S.badgeRow}>{summary.newBadges.map(b => <Badge key={b} type={b}/>)}</div>
        </div>
      )}

      <button onClick={onHome} style={S.homeBtn}>Back to Today's Slate</button>
    </div>
  );
}

const globalCSS = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  button { font-family: inherit; cursor: pointer; }
  button:active:not(:disabled) { transform: scale(0.98); }
  button:disabled { cursor: not-allowed; }
  input { font-family: inherit; }
  @keyframes flash { 0% { opacity: 0; transform: translateY(-6px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; } 100% { opacity: 0; transform: translateY(-6px); } }
  @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes liveBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .pulse-dot { animation: blink 1.2s ease-in-out infinite; }
`;

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FONT_NUM = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';

const S = {
  app: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: FONT,
    color: '#0f172a',
    WebkitFontSmoothing: 'antialiased',
  },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  loadingDot: { width: 12, height: 12, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.2s ease-in-out infinite' },

  screen: { maxWidth: 500, margin: '0 auto', padding: '20px 16px 40px' },
  gameScreen: { maxWidth: 720, margin: '0 auto', padding: '14px 12px 24px' },

  header: { marginBottom: 20 },
  brandRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  brandTitle: { fontFamily: FONT_NUM, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: '#0f172a', margin: 0, lineHeight: 1 },
  brandDate: { fontSize: 13, color: '#64748b', fontWeight: 500 },

  statRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 10px', textAlign: 'center' },
  statIcon: { display: 'flex', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontFamily: FONT_NUM, fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.3px' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 500 },

  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 999, border: '1px solid', background: '#fff', fontSize: 11, fontWeight: 600 },

  sectionLabel: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 20, marginBottom: 10 },

  gameList: { display: 'flex', flexDirection: 'column', gap: 10 },
  gameCard: { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, textAlign: 'left', transition: 'border-color 0.15s', width: '100%' },
  gameCardDisabled: { opacity: 0.55, background: '#f1f5f9', cursor: 'not-allowed' },
  gameTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'liveBlink 1.4s ease-in-out infinite' },
  gameTime: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  matchupRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  teamRow: { display: 'flex', alignItems: 'center', gap: 8 },
  teamDot: { width: 8, height: 8, borderRadius: '50%' },
  teamAbbr: { fontFamily: FONT_NUM, fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 32 },
  teamFullName: { fontSize: 14, color: '#334155', fontWeight: 500, flex: 1 },
  teamScore: { fontFamily: FONT_NUM, fontSize: 15, fontWeight: 700, color: '#0f172a', minWidth: 20, textAlign: 'right' },
  scheduleStatus: { padding: '20px 12px', textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 10 },
  scheduleError: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 12, color: '#991b1b', marginBottom: 10 },
  refreshBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, color: '#991b1b', fontWeight: 600, cursor: 'pointer' },
  gameVenue: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  footnote: { marginTop: 20, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, color: '#64748b', lineHeight: 1.5 },

  gameTopBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  iconBtn: { width: 36, height: 36, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 18, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnSm: { width: 30, height: 30, background: 'transparent', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gameTitleWrap: { flex: 1, textAlign: 'center' },
  gameTitle: { fontFamily: FONT_NUM, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 },
  gameTitleAt: { color: '#94a3b8', fontWeight: 500 },
  gameSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  endBtn: { padding: '8px 14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 },

  linescoreWrap: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 6, marginBottom: 10, overflowX: 'auto' },
  linescore: { width: '100%', borderCollapse: 'collapse', fontFamily: FONT_NUM, fontSize: 13 },
  lsTeamHead: { width: 36 },
  lsHead: { color: '#94a3b8', fontWeight: 600, fontSize: 11, padding: '3px 0', textAlign: 'center', minWidth: 22 },
  lsHeadActive: { background: '#fef2f2', color: '#dc2626', borderRadius: 4 },
  lsTotal: { color: '#475569', fontWeight: 700, fontSize: 11, padding: '3px 0', textAlign: 'center', minWidth: 22, background: '#f8fafc' },
  lsTeamCell: { fontWeight: 700, fontSize: 12, padding: '4px 8px', textAlign: 'left' },
  lsCell: { textAlign: 'center', padding: '4px 0', color: '#334155' },
  lsTotalCell: { fontWeight: 700, background: '#f8fafc', color: '#0f172a' },

  statusBar: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#0f172a', color: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 10, gap: 12 },
  statusBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  statusLabel: { fontSize: 10, opacity: 0.65, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 },
  statusValue: { fontFamily: FONT_NUM, fontSize: 15, fontWeight: 600 },
  outsDots: { display: 'flex', gap: 5, alignItems: 'center', height: 18 },
  outDot: { width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #fff' },

  teamToggle: { display: 'flex', gap: 6, marginBottom: 10 },
  teamToggleBtn: { flex: 1, padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: FONT_NUM, fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  teamToggleActive: { color: '#fff', borderColor: 'transparent' },
  activeIndicator: { fontSize: 10, animation: 'liveBlink 1.4s ease-in-out infinite' },
  lineupBtn: { width: 38, padding: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  scorebookWrap: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, marginBottom: 12, overflowX: 'auto' },
  emptyLineup: { padding: '40px 20px', textAlign: 'center' },
  emptyLineupTitle: { fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 },
  emptyLineupText: { fontSize: 12, color: '#64748b', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' },

  scorebook: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  gridHeadNo: { width: 26, fontSize: 10, color: '#94a3b8', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontWeight: 600, textTransform: 'uppercase' },
  gridHeadName: { width: 90, fontSize: 10, color: '#94a3b8', textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, textTransform: 'uppercase' },
  gridHeadInn: { fontFamily: FONT_NUM, fontSize: 11, color: '#94a3b8', padding: '6px 0', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #f1f5f9', fontWeight: 600 },
  gridHeadInnActive: { color: '#dc2626', background: '#fef2f2' },
  gridNo: { fontFamily: FONT_NUM, fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' },
  gridName: { fontSize: 12, fontWeight: 500, padding: '6px 8px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' },
  gridNameActive: { background: '#fef2f2', color: '#dc2626', fontWeight: 600 },
  gridCell: { height: 52, borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', textAlign: 'center', verticalAlign: 'middle', position: 'relative', padding: 0 },
  gridCellCurrent: { background: '#fef2f2', borderLeft: '2px solid #dc2626', borderRight: '2px solid #dc2626' },
  gridCellSelected: { background: '#eff6ff' },
  gridCellLocked: { background: '#f8fafc' },
  cellPulse: { color: '#dc2626', fontSize: 9 },

  flashCard: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', color: '#fff', borderRadius: 8, marginBottom: 10, animation: 'flash 1.4s ease-out forwards', fontSize: 13, fontWeight: 600 },

  playInputWrap: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 },
  playInputLabel: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 10, minHeight: 18 },
  atBatName: { color: '#0f172a', fontWeight: 600 },
  lockedLabel: { display: 'inline-flex', alignItems: 'center', gap: 5, color: '#94a3b8' },
  playGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 },
  playBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px 6px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, transition: 'background 0.1s' },
  playBtnDisabled: { opacity: 0.4 },
  playBtnGlyph: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32 },
  playBtnLabel: { fontSize: 10, color: '#475569', fontWeight: 600 },

  scoreCell: { width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  diamond: { width: '85%', height: '85%' },
  cellOfficial: { position: 'absolute', bottom: 1, right: 2, fontFamily: FONT_NUM, fontSize: 8, color: '#dc2626', opacity: 0.85, fontWeight: 700 },

  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100, backdropFilter: 'blur(2px)' },
  modal: { background: '#fff', borderRadius: 14, maxWidth: 400, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  modalSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
  modalHint: { padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', lineHeight: 1.5 },
  modalBody: { padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  lineupRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  lineupNum: { width: 24, height: 36, background: '#0f172a', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_NUM, fontSize: 11, fontWeight: 700, flexShrink: 0 },

  // Player picker
  pickerBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', fontSize: 14, color: '#0f172a', textAlign: 'left', minHeight: 36 },
  pickerBtnEmpty: { background: '#f8fafc' },
  pickerValue: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pickerPlaceholder: { color: '#94a3b8' },
  pickerCaret: { color: '#94a3b8', fontSize: 11, marginLeft: 6 },
  pickerClear: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, color: '#94a3b8', marginLeft: 6, cursor: 'pointer' },

  pickerOpen: { flex: 1, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', overflow: 'hidden', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' },
  pickerSearchRow: { display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
  pickerSearch: { flex: 1, border: 'none', background: 'transparent', padding: '8px 12px', fontSize: 13, outline: 'none', color: '#0f172a' },
  pickerCloseBtn: { width: 30, height: 30, background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pickerList: { maxHeight: 200, overflowY: 'auto' },
  pickerItem: { display: 'block', width: '100%', padding: '8px 12px', background: '#fff', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: 13, color: '#0f172a' },
  pickerItemCustom: { display: 'block', width: '100%', padding: '8px 12px', background: '#f8fafc', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: 12, color: '#2563eb', fontWeight: 500 },
  pickerEmpty: { display: 'block', width: '100%', padding: '12px', background: '#f8fafc', border: 'none', textAlign: 'center', fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  modalFooter: { display: 'flex', gap: 8, padding: 14, borderTop: '1px solid #e2e8f0' },
  modalCancel: { flex: 1, padding: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569' },
  modalSave: { flex: 2, padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 },

  summaryHero: { textAlign: 'center', padding: '32px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: 14 },
  summaryStamp: { display: 'inline-block', padding: '3px 10px', background: '#dc2626', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 },
  summaryGame: { fontFamily: FONT_NUM, fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 14 },
  summaryBig: { fontFamily: FONT_NUM, fontSize: 64, fontWeight: 800, color: '#dc2626', lineHeight: 1, letterSpacing: '-2px' },
  summarySub: { fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  summaryRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 },
  summaryStat: { textAlign: 'center', padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10 },
  summaryStatVal: { fontFamily: FONT_NUM, fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' },
  summaryStatLabel: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 500 },
  breakdown: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 14 },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 14, color: '#334155' },
  breakdownTotal: { borderTop: '1px solid #e2e8f0', marginTop: 4, paddingTop: 11, fontSize: 16, fontWeight: 700, color: '#0f172a' },
  newBadges: { padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 14, textAlign: 'center' },
  newBadgesTitle: { fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 10, letterSpacing: '0.3px' },
  homeBtn: { width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600 },
};
