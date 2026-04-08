// Squad roster + aggregation helpers.
// Captains do not have their own sheet — their stats are aggregated from members.

export const SQUADS = [
  {
    id: 'alpha',
    name: 'ALPHA SQUAD',
    colorPrimary: '#6b8e23',
    colorAccent: '#a8c256',
    captain: 'Sunny',
    members: ['Joseph', 'Leo', 'Ian', 'Alien', 'Vincent'],
  },
  {
    id: 'bravo',
    name: 'BRAVO SQUAD',
    colorPrimary: '#8b6914',
    colorAccent: '#d4a24c',
    captain: 'Ali',
    members: ['Allen', 'Wallace', 'Daniel', 'Carlos'],
  },
];

const ALERT_RANK = { NORMAL: 0, WARNING: 1, CRITICAL: 2 };

export function aggregateSquad(engineersByName, squad) {
  let all = 0, active = 0, pending = 0, done = 0;
  let worst = 'NORMAL';
  let maxDaysSinceUpdate = 0;
  for (const memberName of squad.members) {
    const e = engineersByName.get(memberName);
    if (!e) continue;
    all += e.all || 0;
    active += e.active || 0;
    pending += e.pending || 0;
    done += e.done || 0;
    if (e.maxDaysSinceUpdate > maxDaysSinceUpdate) {
      maxDaysSinceUpdate = e.maxDaysSinceUpdate;
    }
    if (ALERT_RANK[e.alertLevel] > ALERT_RANK[worst]) worst = e.alertLevel;
  }
  return {
    id: squad.captain,
    name: squad.captain,
    role: 'CAPTAIN',
    all,
    active,
    pending,
    done,
    maxDaysSinceUpdate,
    alertLevel: worst,
  };
}

export function buildSquadRoster(engineers) {
  const byName = new Map(engineers.map((e) => [e.name, e]));
  return SQUADS.map((squad) => ({
    ...squad,
    captainStats: aggregateSquad(byName, squad),
    memberStats: squad.members
      .map((m) => byName.get(m))
      .filter(Boolean)
      .map((e) => ({ ...e, role: 'MEMBER' })),
  }));
}
