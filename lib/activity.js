export function recordInteraction(args, params = {}) {
  return this._post('activity', args, params);
}

export function listActivity(query = {}, params = {}) {
  return this._get('activity', query, params);
}

export function readAttachment(attachmentId, params = {}) {
  return this._get(`attachments/${attachmentId}`, null, params);
}

export function dismissAttachment(attachmentId, params = {}) {
  return this._delete(`activity/${attachmentId}`, params);
}

export function eventAnalysis(userId, query = {}, params = {}) {
  return this._get(`users/${userId}/stats/events`, query, params);
}
