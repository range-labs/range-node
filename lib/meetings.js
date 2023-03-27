export function readMeeting(meetingId, query = {}, params = {}) {
  return this._get(`meetings/${meetingId}`, query, params)
}

export function readMeetingBySlug(meetingSlug, query = {}, params = {}) {
  return this.me().then(session =>
    this._get(`orgs/${session.org.org_id}/meetings/${meetingSlug}`, query, params)
  );
}

export function listMeetings(query = {}, params = {}) {
  return this._get(`meetings`, query, params)
}

export function readSession(meetingId, sessionNumber, query = {}, params = {}) {
  if (!sessionNumber) sessionNumber = 'latest';
  return this._get(`meetings/${meetingId}/sessions/${sessionNumber}`, query, params)
}

export function listSessions(meetingId, query = {}, params = {}) {
  return this._get(`meetings/${meetingId}/sessions`, query, params)
}

export function listAgendaItems(meetingId, sessionNumber, query = {}, params = {}) {
  return this._get(`meetings/${meetingId}/sessions/${sessionNumber}/agenda`, query, params)
}

// query should have one of the following:
//    - agendaItemId
//    - meetingId (and optional sessionNumber)
//    - targetId (with user id)
export function listActionItems(query = {}, params = {}) {
  return this._get(`action-items`, query, params)
}
