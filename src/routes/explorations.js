import express from 'express';
import LLMService from '../services/llmService.js';
import SessionService from '../services/sessionService.js';

const router = express.Router();
const llmService = new LLMService();
const sessionService = new SessionService();

router.post('/explorations/sessions', async (req, res, next) => {
  try {
    const { location, metadata } = req.body;
    
    if (!location) {
      return res.status(400).json({
        error: 'Location is required',
        code: 'MISSING_LOCATION'
      });
    }
    
    const session = sessionService.createSession({
      location,
      metadata
    });
    
    res.status(201).json({
      sessionId: session.id,
      createdAt: session.createdAt,
      location: session.location
    });
  } catch (error) {
    next(error);
  }
});

router.get('/explorations/:sessionId/instruction', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { location } = req.query;
    
    let session = sessionService.getSession(sessionId);
    
    if (!session) {
      session = sessionService.createSession({ location });
      console.log(`Created new session: ${session.id}`);
    }
    
    const currentLocation = location || session.location;
    
    if (!currentLocation) {
      return res.status(400).json({
        error: 'Location is required either in query parameter or session',
        code: 'MISSING_LOCATION'
      });
    }
    
    if (location && location !== session.location) {
      sessionService.updateSession(session.id, { location });
    }
    
    const instruction = await llmService.generateInstruction(
      currentLocation,
      {
        previousInstructions: session.previousInstructions
      }
    );
    
    sessionService.addInstruction(session.id, instruction);
    
    res.json({
      sessionId: session.id,
      location: currentLocation,
      instruction: instruction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.get('/explorations/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    res.json({
      sessionId: session.id,
      location: session.location,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
      instructionCount: session.previousInstructions.length,
      previousInstructions: session.previousInstructions
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/explorations/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleted = sessionService.deleteSession(sessionId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/explorations', async (req, res, next) => {
  try {
    const sessions = sessionService.getAllSessions();
    
    res.json({
      sessions: sessions.map(session => ({
        sessionId: session.id,
        location: session.location,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed,
        instructionCount: session.previousInstructions.length
      })),
      total: sessions.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;