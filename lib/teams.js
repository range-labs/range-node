export function listTeams(opt_userId, params = {}) {
  if (opt_userId) return this._get(`users/${opt_userId}/teams`, null, params);
  else return this._get('teams', null, params);
}

export function readTeam(teamId, params = {}) {
  return this._get(`teams/${teamId}`, null, params);
}

export function createTeam(args, params = {}) {
  return this._post('teams', args, params);
}

export function updateTeamRelation(teamId, userId, args = {}, params = {}) {
  return this._put(`teams/${teamId}/relations/${userId}`, args, params);
}

export function deleteTeamRelation(teamId, userId, params = {}) {
  return this._delete(`teams/${teamId}/relations/${userId}`, params);
}
