export function listUpdates(query = {}, params = {}) {
  return this._get('updates', query, params);
}
