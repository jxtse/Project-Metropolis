# Project Metropolis API Documentation

## Overview
REST API for generating psychogeography exploration instructions using ZhipuAI (智谱AI) LLM technology.

## Base URL
```
http://localhost:3000
```

## Authentication
Currently no authentication required (add API key authentication as needed)

## Endpoints

### 1. Get Exploration Instruction
Generate AI-powered exploration instruction for a location.

**Endpoint:** `GET /explorations/{sessionId}/instruction`

**Parameters:**
- `sessionId` (path, required): UUID format session identifier
- `location` (query, optional): Location string (uses session location if not provided)

**Example Request:**
```bash
curl "http://localhost:3000/explorations/550e8400-e29b-41d4-a716-446655440000/instruction?location=Shanghai%20Bund"
```

**Success Response (200 OK):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "location": "Shanghai Bund",
  "instruction": {
    "question": "Face the Huangpu River then turn around. What shape is the rooftop of the historic building you're facing?",
    "choices": [
      {
        "option": "Pointed spire with clock tower",
        "next_action": "Walk left along the riverbank until you see the second public trash bin, then stop."
      },
      {
        "option": "Greek temple-style triangular or dome roof",
        "next_action": "Find a couple taking photos and walk 100 steps in the opposite direction from where they're heading."
      }
    ]
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

> TODO: 目前使用的是glm-4.5-air模型，响应时间在12-19秒之间，还有很大的优化空间。前端可以考虑使用异步调用，在用户做上一个任务的时候就开始请求下一个任务，减少用户等待时间

### 2. Create Session
Create a new exploration session.

**Endpoint:** `POST /explorations/sessions`

**Request Body:**
```json
{
  "location": "Times Square NYC",
  "metadata": {
    "userId": "user123",
    "deviceType": "mobile"
  }
}
```

**Success Response (201 Created):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-20T10:00:00.000Z",
  "location": "Times Square NYC"
}
```

### 3. Get Session Details
Retrieve session information and history.

**Endpoint:** `GET /explorations/{sessionId}`

**Success Response (200 OK):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "location": "Shanghai Bund",
  "createdAt": "2024-01-20T10:00:00.000Z",
  "lastAccessed": "2024-01-20T10:30:00.000Z",
  "instructionCount": 3,
  "previousInstructions": [...]
}
```

### 4. Delete Session
Remove a session and its history.

**Endpoint:** `DELETE /explorations/{sessionId}`

**Success Response:** `204 No Content`

### 5. List All Sessions
Get all active sessions.

**Endpoint:** `GET /explorations`

**Success Response (200 OK):**
```json
{
  "sessions": [...],
  "total": 5
}
```

### 6. Health Check
Check API service status.

**Endpoint:** `GET /health`

**Success Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Location is required",
  "code": "MISSING_LOCATION"
}
```

### 404 Not Found
```json
{
  "error": "Session not found",
  "code": "SESSION_NOT_FOUND"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Generated instruction failed validation",
  "code": "INVALID_INSTRUCTION",
  "details": "Invalid instruction: question exceeds 25 words"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

### 503 Service Unavailable
```json
{
  "error": "LLM service temporarily unavailable",
  "code": "LLM_SERVICE_ERROR",
  "details": "Failed to generate instruction: Connection timeout"
}
```

## Rate Limiting
- Default: 10 requests per minute per IP
- Configurable via environment variables

## Session Management
- Sessions expire after 1 hour of inactivity
- Maximum 10 instructions stored per session
- Automatic cleanup of expired sessions

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your ZhipuAI API key
```

3. Start server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## Testing the API

Example test with curl:
```bash
# Create session and get instruction
SESSION_ID=$(curl -s -X POST http://localhost:3000/explorations/sessions \
  -H "Content-Type: application/json" \
  -d '{"location":"Central Park NYC"}' | jq -r '.sessionId')

# Get instruction
curl "http://localhost:3000/explorations/$SESSION_ID/instruction"
```