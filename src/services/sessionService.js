import { v4 as uuidv4 } from 'uuid';

class SessionService {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 3600000; // 1 hour in milliseconds
  }

  createSession(initialData = {}) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      createdAt: new Date(),
      lastAccessed: new Date(),
      location: initialData.location || null,
      previousInstructions: [],
      metadata: initialData.metadata || {}
    };
    
    this.sessions.set(sessionId, session);
    this.scheduleCleanup(sessionId);
    
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    session.lastAccessed = new Date();
    return session;
  }

  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    Object.assign(session, updates);
    session.lastAccessed = new Date();
    
    return session;
  }

  addInstruction(sessionId, instruction) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    session.previousInstructions.push({
      timestamp: new Date(),
      instruction: instruction
    });
    
    if (session.previousInstructions.length > 10) {
      session.previousInstructions.shift();
    }
    
    return session;
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  scheduleCleanup(sessionId) {
    setTimeout(() => {
      const session = this.sessions.get(sessionId);
      if (session) {
        const now = new Date();
        const timeSinceLastAccess = now - session.lastAccessed;
        
        if (timeSinceLastAccess >= this.sessionTimeout) {
          this.deleteSession(sessionId);
          console.log(`Session ${sessionId} expired and removed`);
        } else {
          this.scheduleCleanup(sessionId);
        }
      }
    }, this.sessionTimeout);
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastAccess = now - session.lastAccessed;
      if (timeSinceLastAccess >= this.sessionTimeout) {
        this.deleteSession(sessionId);
        console.log(`Cleaned up expired session: ${sessionId}`);
      }
    }
  }
}

export default SessionService;