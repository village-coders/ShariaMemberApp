import { apiClient } from './client';

/**
 * Checks if a given signature item in the database matches the authenticated user.
 */
export const isUserSignatureMatch = (sig, user) => {
  if (!sig || !sig.signature_url || !user) return false;

  const userId = String(user.id || user._id || '').trim();
  const username = String(user.username || '').trim().toLowerCase();
  const email = String(user.email || '').trim().toLowerCase();
  const fullName = String(user.full_name || user.name || '').trim().toLowerCase();

  const sigUserId = sig.user_id
    ? String(typeof sig.user_id === 'object' ? (sig.user_id._id || sig.user_id.id || '') : sig.user_id).trim()
    : '';
  const sigUsername = String(sig.username || '').trim().toLowerCase();
  const sigName = String(sig.name || '').trim().toLowerCase();

  // 1. Direct user_id match
  if (userId && sigUserId && userId === sigUserId) return true;

  // 2. Exact username match
  if (username && sigUsername && username === sigUsername) return true;

  // 3. Email match with signature username or name
  if (email && sigUsername && email === sigUsername) return true;
  if (email && sigName && email === sigName) return true;

  // 4. Username match with user's email prefix (e.g. "mufti" from "mufti@hfa.com")
  if (email && email.includes('@') && sigUsername) {
    const emailPrefix = email.split('@')[0].trim().toLowerCase();
    if (emailPrefix && emailPrefix === sigUsername) return true;
  }

  // 5. Full name match
  if (fullName && sigName && fullName === sigName) return true;
  if (fullName && sigUsername && fullName === sigUsername) return true;

  // 6. Name match with user's username
  if (username && sigName && username === sigName) return true;

  return false;
};

/**
 * Finds the signature belonging to the given user from a list of signatures.
 */
export const findUserSignature = (signatures, user) => {
  if (!Array.isArray(signatures) || !user) return null;
  return signatures.find(s => isUserSignatureMatch(s, user)) || null;
};

/**
 * Gets the signature for the authenticated user using the backend GET /api/signatures endpoint
 * (with optional search query and client-side user verification).
 */
export const getMySignature = async (user) => {
  let currentUser = user;
  if (!currentUser || typeof currentUser !== 'object') {
    try {
      currentUser = JSON.parse(localStorage.getItem('user'));
    } catch {
      // ignore
    }
  }

  if (!currentUser) return null;

  try {
    // 1. First attempt: search specifically by the user's username or email or full_name
    const searchTerm = currentUser.username || currentUser.email || currentUser.full_name;
    if (searchTerm) {
      const searchRes = await apiClient(`/signatures?search=${encodeURIComponent(searchTerm)}`);
      const searchList = Array.isArray(searchRes?.data) ? searchRes.data : (Array.isArray(searchRes) ? searchRes : []);
      const matched = findUserSignature(searchList, currentUser);
      if (matched) return matched;
    }

    // 2. Second attempt: fetch full list from /signatures and find the matching signature
    const allRes = await apiClient('/signatures');
    const allList = Array.isArray(allRes?.data) ? allRes.data : (Array.isArray(allRes) ? allRes : []);
    return findUserSignature(allList, currentUser);
  } catch (err) {
    console.warn('Error fetching signatures from /api/signatures:', err);
    return null;
  }
};

export const createSignature = (formData) => apiClient('/signatures', {
  method: 'POST',
  body: formData // multipart/form-data
});

export const updateSignature = (id, formData) => apiClient(`/signatures/${id}`, {
  method: 'PUT',
  body: formData // multipart/form-data
});