// Session management utility
let sessionId: string | null = null;

export const sessionManager = {
  setSession(id: string) {
    sessionId = id;
    localStorage.setItem('sessionId', id);
  },

  getSession(): string | null {
    if (!sessionId) {
      sessionId = localStorage.getItem('sessionId');
    }
    return sessionId;
  },

  clearSession() {
    sessionId = null;
    localStorage.removeItem('sessionId');
  },

  getHeaders(): HeadersInit {
    const session = this.getSession();
    return session ? { 'x-session-id': session } : {};
  }
};
