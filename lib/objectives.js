export function listObjectives(query = {}, params = {}) {
  return this.me().then(session =>
    this._get(`orgs/${session.org.org_id}/objectives`, query, params)
  );
}

export function listTeamObjectives(teamId, query = {}, params = {}) {
  return this._get(`teams/${teamId}/objectives`, query, params);
}

export function listUserObjectives(userId, query = {}, params = {}) {
  return this._get(`users/${userId}/objectives`, query, params);
}

export function readObjective(objectiveId, query = {}, params = {}) {
  return this._get(`objectives/${objectiveId}`, query, params);
}

export function updateObjective(objectiveId, args = {}, params = {}) {
  return this._put(`objectives/${objectiveId}`, query, params);
}

export function createObjectiveStatus(objectiveId, args = {}, params = {}) {
  return this._post(`objectives/${objectiveId}/status`, args, params);
}
