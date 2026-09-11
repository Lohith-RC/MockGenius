/**
 * InterviewAI - OpenAPI 3.0.3 Specification
 * Comprehensive REST & SSE API documentation.
 * Ponytail coding: Pure TypeScript object definition, zero extra libraries.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'InterviewAI API',
    version: '1.0.0',
    description: 'Enterprise REST & SSE API for technical mock interviews, ATS resume scanning with JD matching, and real-time algorithmic code reviews.',
    contact: {
      name: 'InterviewAI Engineering Team'
    }
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment'
    }
  ],
  tags: [
    { name: 'Health', description: 'System health and uptime telemetry' },
    { name: 'Auth', description: 'Google OAuth, session management, and CSRF token issuance' },
    { name: 'Profile', description: 'Student placement target role and engineering skill profile' },
    { name: 'Resume', description: 'ATS resume analysis, keyword extraction, and templates' },
    { name: 'Interview', description: 'AI interview question generation, answers, and SSE streaming' },
    { name: 'CodeLab', description: 'Monaco editor live code execution and AI algorithmic reviews' },
    { name: 'Admin', description: 'Institutional placement metrics and student session management' }
  ],
  components: {
    securitySchemes: {
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
        description: 'HMAC SHA-256 signed session cookie'
      },
      CsrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-Token',
        description: 'CSRF double-submit token passed in request header'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number', example: 120.45 },
          environment: { type: 'string', example: 'development' },
          database: { type: 'string', example: 'connected (sqlite-wal)' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'demo-student-1' },
          email: { type: 'string', example: 'alex.chen@university.edu' },
          name: { type: 'string', example: 'Alex Chen' },
          role: { type: 'string', enum: ['student', 'admin'], example: 'student' },
          branch: { type: 'string', example: 'Computer Science' },
          skills: { type: 'array', items: { type: 'string' } },
          projects: { type: 'array', items: { type: 'string' } },
          targetRole: { type: 'string', example: 'Full Stack Engineer' },
          experienceLevel: { type: 'string', example: 'Entry Level' }
        }
      },
      AnswerEvaluation: {
        type: 'object',
        properties: {
          score: { type: 'integer', example: 8 },
          feedback: { type: 'string', example: 'Clear structure with strong technical examples.' },
          technicalScore: { type: 'integer', example: 8 },
          communicationScore: { type: 'integer', example: 9 },
          confidenceScore: { type: 'integer', example: 8 },
          grammar: { type: 'string', example: 'Well-formed sentences.' },
          clarity: { type: 'string', example: 'Fluent and articulate delivery.' },
          wordsPerMinute: { type: 'number', example: 135 },
          fillerWordCount: { type: 'integer', example: 2 },
          answerDurationSeconds: { type: 'integer', example: 45 }
        }
      },
      CodeReviewResult: {
        type: 'object',
        properties: {
          timeComplexity: { type: 'string', example: 'O(N)' },
          spaceComplexity: { type: 'string', example: 'O(1)' },
          correctness: { type: 'number', example: 90 },
          cleanCodeScore: { type: 'number', example: 85 },
          summary: { type: 'string', example: 'Optimal single-pass solution.' },
          suggestions: { type: 'array', items: { type: 'string' } },
          edgeCasesIdentified: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'System health check and diagnostic telemetry',
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user and CSRF token',
        responses: {
          '200': {
            description: 'Session active',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    authenticated: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                    csrfToken: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthenticated or expired session'
          }
        }
      }
    },
    '/api/auth/demo': {
      post: {
        tags: ['Auth'],
        summary: 'Instant demo login for development and testing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['student', 'admin'], example: 'student' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Demo login successful; session cookie issued'
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current user and clear session cookie',
        responses: {
          '200': {
            description: 'Logged out successfully'
          }
        }
      }
    },
    '/api/profile': {
      put: {
        tags: ['Profile'],
        summary: 'Update student placement profile',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  branch: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } },
                  projects: { type: 'array', items: { type: 'string' } },
                  targetRole: { type: 'string' },
                  experienceLevel: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'CSRF token missing or invalid' }
        }
      }
    },
    '/api/resume/upload': {
      post: {
        tags: ['Resume'],
        summary: 'Evaluate student resume with Gemini ATS scanner',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fileName: { type: 'string' },
                  resumeText: { type: 'string' }
                },
                required: ['resumeText']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Resume analyzed successfully' },
          '400': { description: 'Resume text is empty' }
        }
      }
    },
    '/api/resume/upload-with-jd': {
      post: {
        tags: ['Resume'],
        summary: 'Evaluate student resume against a Job Description (JD Matcher)',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fileName: { type: 'string' },
                  resumeText: { type: 'string' },
                  jobDescription: { type: 'string' }
                },
                required: ['resumeText', 'jobDescription']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Resume and JD analyzed with match breakdown' }
        }
      }
    },
    '/api/resume/my-analysis': {
      get: {
        tags: ['Resume'],
        summary: 'Fetch the active student resume evaluation analysis',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': { description: 'Resume analysis data' }
        }
      }
    },
    '/api/resume/templates': {
      get: {
        tags: ['Resume'],
        summary: 'List available ATS-friendly resume templates',
        responses: {
          '200': { description: 'List of templates' }
        }
      }
    },
    '/api/interview/generate': {
      post: {
        tags: ['Interview'],
        summary: 'Generate tailored 5-question mock interview session',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        responses: {
          '200': { description: 'Interview session generated and initialized' }
        }
      }
    },
    '/api/interview/history': {
      get: {
        tags: ['Interview'],
        summary: 'Get mock interview history for current student',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': { description: 'Array of past mock interview sessions' }
        }
      }
    },
    '/api/interview/{id}': {
      get: {
        tags: ['Interview'],
        summary: 'Get details of a specific interview session',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Interview session data' },
          '404': { description: 'Interview not found' }
        }
      }
    },
    '/api/interview/{id}/answer': {
      post: {
        tags: ['Interview'],
        summary: 'Submit candidate answer and receive evaluation (non-streaming)',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  answer: { type: 'string' },
                  wordsPerMinute: { type: 'number' },
                  fillerWordCount: { type: 'integer' },
                  answerDurationSeconds: { type: 'integer' }
                },
                required: ['answer']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Evaluation saved' }
        }
      }
    },
    '/api/interview/{id}/answer-stream': {
      post: {
        tags: ['Interview'],
        summary: 'Submit candidate answer and stream real-time evaluation tokens via SSE',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  answer: { type: 'string' },
                  wordsPerMinute: { type: 'number' },
                  fillerWordCount: { type: 'integer' },
                  answerDurationSeconds: { type: 'integer' }
                },
                required: ['answer']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Server-Sent Events text stream emitting token chunks and final AnswerEvaluation JSON',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  example: 'data: {"token":"Good ","done":false}\n\ndata: {"token":"structure.","done":false}\n\ndata: {"done":true,"evaluation":{...}}\n\n'
                }
              }
            }
          }
        }
      }
    },
    '/api/interview/code-review': {
      post: {
        tags: ['CodeLab'],
        summary: 'AI static analysis and algorithmic Big-O review for Code Lab',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  language: { type: 'string', example: 'javascript' },
                  problemStatement: { type: 'string' }
                },
                required: ['code']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Algorithmic code review results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CodeReviewResult' }
              }
            }
          }
        }
      }
    },
    '/api/feedback': {
      post: {
        tags: ['Profile'],
        summary: 'Submit student platform feedback and rating',
        security: [{ CookieAuth: [], CsrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['interview', 'resume', 'general'] },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  comment: { type: 'string' }
                },
                required: ['category', 'rating', 'comment']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Feedback stored' }
        }
      }
    },
    '/api/admin/metrics': {
      get: {
        tags: ['Admin'],
        summary: 'Get platform-wide placement and interview telemetry metrics',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': { description: 'Aggregated placement readiness metrics' },
          '403': { description: 'Forbidden: Admin access required' }
        }
      }
    },
    '/api/admin/students': {
      get: {
        tags: ['Admin'],
        summary: 'List student candidates with search, branch, and score filters',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': { description: 'Filtered list of student profiles' }
        }
      }
    }
  }
};
