export function findUser(args, params = {}) {
  return this._get('users/find', args, params);
}

export function listUsers(query = {}, params = {}) {
  // TODO: At the moment listUsers requires an org_id, but we want to take it
  // from the auth user automatically in the future. The extra API request is
  // a tradeoff here.
  return this.authUser().then(session =>
    this._get(`orgs/${session.org.org_id}/users`, query, params)
  );
}

export function updateUserProfile(userId, profile, params = {}) {
  return this._put(`users/${userId}/profile`, { profile }, params);
}

export function updateUserState(userId, state, params = {}) {
  return this._put(`users/${userId}/state`, { state }, params);
}
