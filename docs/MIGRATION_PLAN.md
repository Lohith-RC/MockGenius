# InterviewAI Database Migration Plan

## Current State
The application currently uses a JSON file-based storage system (`src/db/jsonStore.ts`) for all data persistence. This is suitable for development and small-scale deployments but has limitations for production use.

## Migration Strategy

### Phase 1: Database Abstraction Layer
1. Create a database interface that abstracts storage operations
2. Implement both JSON and PostgreSQL adapters
3. Use environment variable to switch between adapters
4. Maintain backward compatibility with existing data

### Phase 2: Data Migration
1. Create migration scripts to move data from JSON to PostgreSQL
2. Implement data validation and integrity checks
3. Create backup procedures before migration
4. Test migration with production data copy

### Phase 3: Production Deployment
1. Deploy database abstraction layer
2. Run migration on staging environment
3. Validate all functionality
4. Deploy to production with rollback plan

## Database Schema Design

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  picture TEXT,
  role VARCHAR(50) DEFAULT 'student',
  branch VARCHAR(100),
  skills JSONB,
  projects JSONB,
  target_role VARCHAR(100),
  experience_level VARCHAR(50),
  completed_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Resumes Table
```sql
CREATE TABLE resumes (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  file_name VARCHAR(255),
  ats_score INTEGER,
  skills JSONB,
  suggestions JSONB,
  raw_text TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Interviews Table
```sql
CREATE TABLE interviews (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  job_role VARCHAR(100),
  branch VARCHAR(100),
  skills JSONB,
  experience_level VARCHAR(50),
  status VARCHAR(50),
  questions JSONB,
  current_question_index INTEGER DEFAULT 0,
  answers JSONB,
  overall_score INTEGER,
  technical_score INTEGER,
  communication_score INTEGER,
  confidence_score INTEGER,
  feedback_text TEXT,
  suggestions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Feedback Table
```sql
CREATE TABLE feedback (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  user_name VARCHAR(255),
  category VARCHAR(100),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Templates Table
```sql
CREATE TABLE templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  download_count INTEGER DEFAULT 0,
  file_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migration Scripts

### Data Export Script
```javascript
// scripts/export-json-data.js
const fs = require('fs');
const path = require('path');

// Read JSON files and convert to SQL inserts
// Export to SQL migration files
```

### Data Import Script
```javascript
// scripts/import-to-postgres.js
const { Pool } = require('pg');

// Read SQL files and execute migrations
// Validate data integrity after import
```

## Rollback Plan
1. Keep JSON files as backup
2. Maintain ability to switch back to JSON adapter
3. Create database backup before migration
4. Test rollback procedure on staging

## Monitoring and Validation
1. Compare record counts between JSON and database
2. Validate data integrity with checksums
3. Monitor application performance post-migration
4. Set up alerts for database connection issues

## Timeline
- Week 1: Create database abstraction layer
- Week 2: Implement PostgreSQL adapter
- Week 3: Create migration scripts and test
- Week 4: Deploy to staging and validate
- Week 5: Production deployment with monitoring

## Success Criteria
- All data migrated successfully
- No data loss or corruption
- Application performance maintained or improved
- Rollback procedure tested and documented
- Monitoring and alerting in place