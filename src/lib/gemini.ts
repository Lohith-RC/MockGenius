import { GoogleGenAI, Type } from '@google/genai';
import { ResumeAnalysis, AnswerEvaluation } from '../types.js';

// Lazy-initialize Gemini client to prevent crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

export const aiService = {
  /**
   * Evaluates an engineering student resume and predicts an ATS score (40-100).
   * Extracts core technical skills, identifies missing sections, points out grammar/formatting issues,
   * and recommends concrete keywords to add/remove.
   *
   * Fallback: If GEMINI_API_KEY is not configured or the API request fails,
   * executes a local heuristic simulation based on keyword density and section detection.
   *
   * @param resumeText - Raw text extracted from the candidate's uploaded resume
   * @param fileName - Original filename of the uploaded document
   * @returns Detailed ATS analysis object including scores, extracted skills, and suggestions
   */
  async analyzeResume(resumeText: string, fileName: string): Promise<ResumeAnalysis & { simulated?: boolean }> {
    const client = getGeminiClient();

    if (!client) {
      console.warn('GEMINI_API_KEY is not configured. Running in simulation mode.');
      return this.simulateResumeAnalysis(resumeText, fileName);
    }

    try {
      const prompt = `Analyze this student resume for engineering placements.
Resume Text:
${resumeText}

Analyze the skills, projects, certifications, and experience. Detect missing sections. Highlight grammar/formatting issues. Predict an ATS score between 40 and 100. Recommend keywords to add/remove. Return details structured in JSON format.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a professional ATS resume scanner and recruiter. Your goal is to give highly detailed, concrete, and rigorous engineering-specific feedback to help students pass resume screening filters.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              atsScore: { type: Type.INTEGER, description: 'The predicted ATS score from 40 to 100.' },
              skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Extracted skills found in the resume.' },
              missingSections: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Key sections missing from the resume (e.g. Summary, Certifications, Contact details).' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Concrete suggestions for improvement.' },
              grammarIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Grammar, punctuation, or formatting inconsistencies identified.' },
              keywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    match: { type: Type.BOOLEAN, description: 'Whether the keyword exists in the resume.' }
                  },
                  required: ['keyword', 'match']
                },
                description: 'Crucial technical keywords for engineering roles and their match status.'
              },
              improvementsToAdd: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific technologies, words, or sections to ADD.' },
              improvementsToRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Vague, outdated, or redundant sections/words to REMOVE.' }
            },
            required: ['atsScore', 'skills', 'missingSections', 'suggestions', 'grammarIssues', 'keywords', 'improvementsToAdd', 'improvementsToRemove']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `res-${Math.random().toString(36).substr(2, 9)}`,
        userId: '', // set by endpoint
        fileName,
        uploadedAt: new Date().toISOString(),
        ...parsed
      };
    } catch (err) {
      console.error('Gemini Resume Analysis failed:', err);
      return this.simulateResumeAnalysis(resumeText, fileName);
    }
  },

  /**
   * Evaluates a resume directly against a target Job Description (JD Matcher).
   * Computes ATS quality score, JD match percentage (0-100), matched/missing keywords,
   * and tailored improvement recommendations.
   *
   * Fallback: If GEMINI_API_KEY is not configured or the API request fails,
   * executes a local heuristic keyword extraction and comparison algorithm.
   *
   * @param resumeText - Raw text extracted from the candidate's resume
   * @param jobDescription - The job description text to match against
   * @param fileName - Original filename of the candidate's resume
   * @returns Detailed ATS analysis object with jdMatchScore and keyword diffs
   */
  async analyzeResumeWithJD(
    resumeText: string,
    jobDescription: string,
    fileName: string
  ): Promise<ResumeAnalysis & { simulated?: boolean }> {
    const client = getGeminiClient();

    if (!client) {
      console.warn('GEMINI_API_KEY is not configured. Running JD analysis in simulation mode.');
      return this.simulateResumeWithJD(resumeText, jobDescription, fileName);
    }

    try {
      const prompt = `Analyze this student resume directly against the provided Job Description for an engineering placement.
Resume Text:
${resumeText.substring(0, 15000)}

Job Description:
${jobDescription.substring(0, 8000)}

Evaluate:
1. Overall ATS resume quality score (40-100).
2. Direct Job Description Match Score (jdMatchScore: 0-100) based on alignment with required technologies, experience, and responsibilities.
3. Extracted skills found in the resume.
4. matchedJDKeywords: array of key skills/technologies mentioned in the JD that the candidate possesses.
5. missingJDKeywords: array of critical skills/technologies mentioned in the JD that are absent from the resume.
6. Missing resume sections, concrete improvement suggestions, grammar issues, keywords to add/remove.

Return details structured in JSON format.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite corporate technical recruiter and ATS specialist. Provide objective, razor-sharp feedback comparing a candidate resume with the target job description.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              atsScore: { type: Type.INTEGER, description: 'The predicted general ATS score from 40 to 100.' },
              jdMatchScore: { type: Type.INTEGER, description: 'The target job description match score from 0 to 100.' },
              skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Extracted skills found in the resume.' },
              matchedJDKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Keywords and skills from the JD that matched the resume.' },
              missingJDKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Crucial keywords/skills requested by the JD that are absent from the resume.' },
              missingSections: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Key sections missing from the resume.' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Concrete suggestions for improvement.' },
              grammarIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Grammar or formatting inconsistencies.' },
              keywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    match: { type: Type.BOOLEAN }
                  },
                  required: ['keyword', 'match']
                }
              },
              improvementsToAdd: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Items to add to align with this JD.' },
              improvementsToRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Items to remove or de-emphasize.' }
            },
            required: ['atsScore', 'jdMatchScore', 'skills', 'matchedJDKeywords', 'missingJDKeywords', 'missingSections', 'suggestions', 'grammarIssues', 'keywords', 'improvementsToAdd', 'improvementsToRemove']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `res-${Math.random().toString(36).substr(2, 9)}`,
        userId: '',
        fileName,
        uploadedAt: new Date().toISOString(),
        jobDescription,
        ...parsed
      };
    } catch (err) {
      console.error('Gemini JD Resume Analysis failed:', err);
      return this.simulateResumeWithJD(resumeText, jobDescription, fileName);
    }
  },

  /**
   * Generates 5 tailored technical, coding, project, behavioral, and analytical interview questions.
   *
   * Fallback: If GEMINI_API_KEY is not configured or the API request fails,
   * generates standard placement interview questions tailored to the candidate's target role and primary skill.
   *
   * @param resumeText - Excerpt of candidate resume for context
   * @param branch - Engineering branch (e.g., Computer Science, Mechanical)
   * @param skills - Array of candidate's core technical competencies
   * @param projects - Array of student's completed academic and personal projects
   * @param targetRole - Target engineering job role (e.g., Full Stack Engineer)
   * @param experienceLevel - Experience tier (e.g., Entry Level, Intern)
   * @returns Array of exactly 5 interview question strings
   */
  async generateQuestions(
    resumeText: string,
    branch: string,
    skills: string[],
    projects: string[],
    targetRole: string,
    experienceLevel: string
  ): Promise<string[]> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateQuestions(skills, targetRole);
    }

    try {
      const prompt = `Generate exactly 5 targeted interview questions for an engineering interview.
Candidate Context:
- Target Job Role: ${targetRole}
- Engineering Branch: ${branch}
- Experience Level: ${experienceLevel}
- Core Skills: ${skills.join(', ')}
- Projects: ${projects.join(', ')}
- Resume Excerpt: ${resumeText.substring(0, 2000)}

Generate questions from the following categories:
1. Technical/Core Engineering Question (specifically on skills like ${skills[0] || 'programming'})
2. Technical Coding/System Design Question
3. Resume/Project-Based Question (specifically on ${projects[0] || 'core projects'})
4. Behavioral/HR Scenario Question
5. Aptitude/Analytical Problem Solving Question

Return exactly 5 questions as a JSON array of strings.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite technical interviewer from a top-tier tech firm. Generate highly realistic, specific, and standard interview questions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (err) {
      console.error('Gemini Question Generation failed:', err);
      return this.simulateQuestions(skills, targetRole);
    }
  },

  /**
   * Evaluates a single mock interview answer, providing discrete scores (0-10) for technical accuracy,
   * communication, confidence, grammar, and delivery clarity.
   *
   * Fallback: If GEMINI_API_KEY is not configured, analyzes length and provides constructive feedback.
   *
   * @param question - The interview question presented to the candidate
   * @param answer - The candidate's spoken or typed answer transcript
   * @returns Structured AnswerEvaluation with category scores and written assessor feedback
   */
  async evaluateAnswer(question: string, answer: string): Promise<AnswerEvaluation> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateAnswerEvaluation(question, answer);
    }

    try {
      const prompt = `Evaluate the candidate's answer to the interview question.
Question: "${question}"
Candidate Answer: "${answer}"

Evaluate based on:
1. Technical Accuracy (Is the answer technically correct and detailed?)
2. Communication (Is the answer structured, fluent, and professional?)
3. Confidence & Clarity (Is the delivery confident and easy to understand?)
4. Grammar (Is there good sentence structure and grammatical correctness?)

Return the scores and qualitative feedback in JSON format.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective technical assessor. Give realistic, constructive, and precise feedback with discrete scores out of 10.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Overall score for this answer out of 10.' },
              feedback: { type: Type.STRING, description: 'Constructive analysis of the answer, including what went well and what is missing.' },
              technicalScore: { type: Type.INTEGER, description: 'Technical score out of 10.' },
              communicationScore: { type: Type.INTEGER, description: 'Communication structure score out of 10.' },
              confidenceScore: { type: Type.INTEGER, description: 'Confidence / clarity score out of 10.' },
              grammar: { type: Type.STRING, description: 'Feedback about grammatical correctness and wording.' },
              clarity: { type: Type.STRING, description: 'Feedback about delivery clarity and vocabulary.' }
            },
            required: ['score', 'feedback', 'technicalScore', 'communicationScore', 'confidenceScore', 'grammar', 'clarity']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Gemini Answer Evaluation failed:', err);
      return this.simulateAnswerEvaluation(question, answer);
    }
  },

  /**
   * Streams token chunks for evaluating an answer in real-time over Server-Sent Events (SSE).
   *
   * Fallback: If GEMINI_API_KEY is absent, yields simulated feedback words with a 30ms delay.
   *
   * @param question - The interview question
   * @param answer - The candidate's answer
   * @yields String token chunks as generated by Gemini stream or simulated typewriter
   */
  async *evaluateAnswerStream(question: string, answer: string): AsyncGenerator<string> {
    const client = getGeminiClient();

    if (!client) {
      const sim = this.simulateAnswerEvaluation(question, answer);
      const words = sim.feedback.split(/(\s+)/);
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 30));
        yield word;
      }
      return;
    }

    try {
      const prompt = `Evaluate the candidate's answer to the interview question.
Question: "${question}"
Candidate Answer: "${answer}"

Provide constructive, razor-sharp technical and communication analysis of the answer. Highlight what went well and what is missing.`;

      const responseStream = await client.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective technical assessor. Give constructive, precise, real-time feedback.',
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (err) {
      console.error('Gemini Answer Evaluation streaming failed, using simulation:', err);
      const sim = this.simulateAnswerEvaluation(question, answer);
      const words = sim.feedback.split(/(\s+)/);
      for (const word of words) {
        yield word;
      }
    }
  },

  /**
   * Generates a conversational follow-up question based on the candidate's previous response.
   *
   * Fallback: Generates role-based conversational probes when API key is unconfigured.
   *
   * @param originalQuestion - The initial question asked
   * @param candidateAnswer - The candidate's response
   * @param evaluation - Prior answer evaluation
   * @returns Probing follow-up question string
   */
  async generateFollowUp(
    originalQuestion: string,
    candidateAnswer: string,
    evaluation: AnswerEvaluation
  ): Promise<string> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateFollowUp(originalQuestion, candidateAnswer);
    }

    try {
      const prompt = `You are a senior technical interviewer conducting an engineering placement interview.
Original Question: "${originalQuestion}"
Candidate Answer: "${candidateAnswer.substring(0, 3000)}"
Answer Assessment Score: ${evaluation.score}/10
Assessor Feedback: "${evaluation.feedback}"

Based directly on what the candidate explained in their answer, generate exactly ONE probing follow-up question that tests deeper technical understanding, architectural implications, edge cases, or trade-offs. The question must specifically refer to something mentioned in their answer. Return only the question text without greetings or preambles.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an exacting senior software engineer interviewer. Ask one sharp, direct, technical follow-up question.',
          responseMimeType: 'text/plain'
        }
      });

      const text = (response.text || '').trim();
      return text || this.simulateFollowUp(originalQuestion, candidateAnswer);
    } catch (err) {
      console.error('Gemini Follow-Up generation failed:', err);
      return this.simulateFollowUp(originalQuestion, candidateAnswer);
    }
  },

  /**
   * Generates a comprehensive feedback report at the end of the mock interview session.
   *
   * Fallback: Synthesizes aggregate scores and checklist from local QA logs.
   *
   * @param jobRole - Target job title
   * @param qaList - List of all questions, answers, and evaluations in the completed interview
   * @returns Placement readiness report with category percentages and actionable suggestions
   */
  async generateOverallReport(
    jobRole: string,
    qaList: { question: string; answer: string; evaluation?: AnswerEvaluation }[]
  ): Promise<{
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    feedbackText: string;
    suggestions: string[];
  }> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateOverallReport(qaList);
    }

    try {
      const qasFormatted = qaList.map(q => `Q: ${q.question}\nA: ${q.answer}\nScore: ${q.evaluation?.score || 0}/10\nFeedback: ${q.evaluation?.feedback || ''}`).join('\n\n');
      const prompt = `Synthesize these individual question answers and evaluations into a final Placement Readiness Report.
Job Role: ${jobRole}
Question-Answer Logs:
${qasFormatted}

Evaluate student placement readiness, identify global areas of strength, weaknesses, and a structured checklist for improvement. Return scores as percentages (out of 100).`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a career development expert and senior engineering manager. Deliver a highly supportive, practical, yet professional placement readiness assessment.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER, description: 'Aggregate placement readiness score (0-100).' },
              technicalScore: { type: Type.INTEGER, description: 'Combined technical competency score (0-100).' },
              communicationScore: { type: Type.INTEGER, description: 'Combined communication skill score (0-100).' },
              confidenceScore: { type: Type.INTEGER, description: 'Combined confidence/clarity score (0-100).' },
              feedbackText: { type: Type.STRING, description: 'A detailed executive summary feedback paragraph addressing placement readiness.' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Actionable bullet-point suggestions to help the student improve before real placement drives.' }
            },
            required: ['overallScore', 'technicalScore', 'communicationScore', 'confidenceScore', 'feedbackText', 'suggestions']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Gemini Overall Report failed:', err);
      return this.simulateOverallReport(qaList);
    }
  },

  /**
   * Evaluates live code submission from Monaco Code Lab.
   * Analyzes algorithmic time and space complexity (Big-O), correctness, and code style.
   *
   * Fallback: Analyzes loop nesting patterns (e.g. single loop O(N), nested loops O(N^2)).
   *
   * @param code - Source code string
   * @param language - Programming language (e.g., javascript, python, cpp)
   * @param problemStatement - Problem requirements and description
   * @returns Code review analysis with Big-O complexity, correctness score, and suggestions
   */
  async reviewCode(
    code: string,
    language: string,
    problemStatement: string
  ): Promise<{
    correctness: number;
    timeComplexity: string;
    spaceComplexity: string;
    feedback: string;
    suggestions: string[];
  }> {
    const client = getGeminiClient();

    if (!client) {
      return this.simulateCodeReview(code, language);
    }

    try {
      const prompt = `Review this candidate's code submission for an engineering technical interview round.
Problem Statement:
${problemStatement}

Language: ${language}
Submitted Code:
\`\`\`${language}
${code.substring(0, 10000)}
\`\`\`

Evaluate:
1. Correctness score (0-100) — does it solve the problem without fatal errors or edge case failures?
2. Big-O Time Complexity (e.g. O(N), O(N log N), O(N^2)).
3. Big-O Space Complexity (e.g. O(1), O(N)).
4. Detailed feedback addressing clean architecture, idiomatic language patterns, and readability.
5. Actionable suggestions for optimization or handling missing edge cases.

Return JSON.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a principal software engineer conducting an elite coding interview. Give rigorous, precise algorithmic and stylistic feedback.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctness: { type: Type.INTEGER, description: 'Correctness rating from 0 to 100.' },
              timeComplexity: { type: Type.STRING, description: 'Estimated Big-O time complexity.' },
              spaceComplexity: { type: Type.STRING, description: 'Estimated Big-O auxiliary space complexity.' },
              feedback: { type: Type.STRING, description: 'Detailed technical critique.' },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific suggestions for improvement.' }
            },
            required: ['correctness', 'timeComplexity', 'spaceComplexity', 'feedback', 'suggestions']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Gemini Code Review failed:', err);
      return this.simulateCodeReview(code, language);
    }
  },

  // --- SIMULATION FALLBACKS ---

  simulateResumeAnalysis(resumeText: string, fileName: string): ResumeAnalysis & { simulated: boolean } {
    const textLower = resumeText.toLowerCase();
    const hasReact = textLower.includes('react') || textLower.includes('frontend') || textLower.includes('web');
    const hasBackend = textLower.includes('spring') || textLower.includes('node') || textLower.includes('sql') || textLower.includes('express');

    const skills = ['HTML/CSS', 'JavaScript'];
    if (hasReact) skills.push('React', 'TypeScript', 'Tailwind CSS');
    if (hasBackend) skills.push('Node.js', 'Express', 'SQL', 'Git');

    const score = Math.min(95, Math.max(55, 65 + skills.length * 4));

    return {
      id: `sim-res-${Math.random().toString(36).substr(2, 9)}`,
      userId: '',
      fileName,
      uploadedAt: new Date().toISOString(),
      simulated: true,
      atsScore: score,
      skills,
      missingSections: ['Professional Summary', 'Industry Certifications', 'Contact Address'],
      suggestions: [
        'Add a brief Professional Summary section right at the top of your resume stating your engineering discipline and career alignment.',
        'Improve bullet point structure by using the action-verb-first rule (e.g., replace "Was responsible for coding" with "Engineered and refactored core interfaces").',
        'Incorporate specific metrics and business results into project bullet points (e.g., "reducing database call latency by 12%").',
        'Add a dedicated Certifications or Coursera/Udemy section if you have external technical credentials.'
      ],
      grammarIssues: [
        'Inconsistent formatting detected for dates (some sections use "Jan 2026" while others use "01/2026").',
        'Ensure proper title case is utilized for all technical headers.'
      ],
      keywords: [
        { keyword: 'React.js', match: hasReact },
        { keyword: 'Node.js / Express', match: hasBackend },
        { keyword: 'RESTful API Engineering', match: hasBackend },
        { keyword: 'CI/CD Pipelines (Docker, Git)', match: textLower.includes('git') },
        { keyword: 'Relational Database (SQL/Postgres)', match: textLower.includes('sql') }
      ],
      improvementsToAdd: [
        'Cloud deployment context (AWS / Google Cloud / Vercel)',
        'TypeScript declaration files and type safety practices',
        'Relational schema design or Object Relational Mapping (ORM) mentions'
      ],
      improvementsToRemove: [
        'Outdated high-school accomplishments and grade cards',
        'Extraneous hobbies that do not relate to engineering competencies'
      ]
    };
  },

  simulateQuestions(skills: string[], targetRole: string): string[] {
    const mainSkill = skills[0] || 'programming';
    return [
      `How does ${targetRole} benefit from the key features of ${mainSkill}? Explain with a real-world architectural example.`,
      `Explain your core project's software structure. How did you design database tables/schema and structure API endpoints for optimal payload transfer?`,
      `Describe a technical bug you encountered in one of your projects. What systematic steps did you execute to debug and resolve it?`,
      `If a team member strongly disagrees with your technical design approach for a critical placement assignment, how do you handle the conflict?`,
      `What is horizontal vs vertical scaling in server architecture? Which would you recommend for hosting a high-traffic e-commerce database, and why?`
    ];
  },

  simulateAnswerEvaluation(question: string, answer: string): AnswerEvaluation {
    const answerLen = answer.trim().length;
    let score = 5;
    let feedback = '';

    if (answerLen < 15) {
      score = 4;
      feedback = 'The answer is too brief. In a technical interview, you need to expand considerably, provide definitions, use cases, and outline your experience.';
    } else if (answerLen < 60) {
      score = 6;
      feedback = 'A decent start, but the answer lacks technical depth. Mention architectural implications, specific keywords, or libraries/technologies to demonstrate mastery.';
    } else {
      score = 8;
      feedback = 'Good detail. You explained the concepts clearly, structured your sentences logically, and demonstrated a practical understanding of the core subject.';
    }

    return {
      score,
      feedback,
      technicalScore: Math.min(10, score + (answerLen > 100 ? 1 : 0)),
      communicationScore: Math.min(10, score + 1),
      confidenceScore: Math.min(10, score),
      grammar: 'Grammatically sound. Good professional phrasing.',
      clarity: 'Highly clear and understandable delivery.'
    };
  },

  simulateOverallReport(qaList: { question: string; answer: string; evaluation?: AnswerEvaluation }[]): {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    feedbackText: string;
    suggestions: string[];
  } {
    const total = qaList.reduce((sum, qa) => sum + (qa.evaluation?.score || 5), 0);
    const count = qaList.length || 1;
    const avgScoreOutOf10 = total / count;
    const overallPct = Math.round(avgScoreOutOf10 * 10);

    return {
      overallScore: overallPct,
      technicalScore: Math.min(100, Math.round(avgScoreOutOf10 * 10 + 2)),
      communicationScore: Math.min(100, Math.round(avgScoreOutOf10 * 10 - 2)),
      confidenceScore: Math.min(100, Math.round(avgScoreOutOf10 * 10)),
      feedbackText: `You have completed the mock interview with an overall rating of ${overallPct}%. You demonstrated consistent familiarity with core engineering competencies and communicated your points reasonably well. To stand out in competitive placement drives, strive to inject more structured technical detail and back your project descriptions with objective performance metrics.`,
      suggestions: [
        'Utilize the structured STAR (Situation, Task, Action, Result) template for all project-based and behavioral questions.',
        'Introduce concrete engineering metrics when explaining your contributions (e.g., "improved performance by 15%").',
        'Deepen your command of system architecture principles (scalability, database normalization, and caching).',
        'Slow down slightly during communication to sound more composed and improve articulation clarity.'
      ]
    };
  },

  simulateFollowUp(originalQuestion: string, candidateAnswer: string): string {
    const textLower = candidateAnswer.toLowerCase();

    if (textLower.includes('scale') || textLower.includes('postgres') || textLower.includes('database') || textLower.includes('sql')) {
      return 'You mentioned database scaling techniques. How would you specifically handle cache invalidation and replication lag between the write master and read replicas in high-throughput operations?';
    }
    if (textLower.includes('react') || textLower.includes('state') || textLower.includes('frontend') || textLower.includes('redux')) {
      return 'Regarding your frontend architecture, what specific profiling strategies or React memoization patterns would you apply to prevent unnecessary re-renders when broadcasting updates across complex component trees?';
    }
    if (textLower.includes('node') || textLower.includes('api') || textLower.includes('microservice') || textLower.includes('express')) {
      return 'Building on your API discussion, how would you design idempotent mutation endpoints and rate limiting to prevent duplicate transaction executions during distributed network retries?';
    }
    if (textLower.includes('test') || textLower.includes('docker') || textLower.includes('deploy') || textLower.includes('ci/cd')) {
      return 'You touched on deployment and testing workflows. How do you structure integration tests in your CI/CD pipeline to balance exhaustive test coverage against deployment build times?';
    }

    return 'Building on the architecture you just described, what is the single largest performance bottleneck in that design, and how would you re-architect it to gracefully handle a 10x traffic spike?';
  },

  simulateResumeWithJD(
    resumeText: string,
    jobDescription: string,
    fileName: string
  ): ResumeAnalysis & { simulated: boolean; jdMatchScore: number; missingJDKeywords: string[]; matchedJDKeywords: string[] } {
    const base = this.simulateResumeAnalysis(resumeText, fileName);
    const resumeLower = resumeText.toLowerCase();
    const jdLower = jobDescription.toLowerCase();

    // Key technical keywords to scan
    const potentialKeywords = [
      'react', 'typescript', 'javascript', 'node.js', 'express', 'python',
      'docker', 'kubernetes', 'aws', 'gcp', 'sql', 'postgresql', 'mongodb',
      'redis', 'graphql', 'ci/cd', 'git', 'microservices', 'rest api', 'agile'
    ];

    const matchedJDKeywords: string[] = [];
    const missingJDKeywords: string[] = [];

    potentialKeywords.forEach((kw) => {
      const inJD = jdLower.includes(kw);
      const inResume = resumeLower.includes(kw);

      if (inJD && inResume) {
        matchedJDKeywords.push(kw.toUpperCase());
      } else if (inJD && !inResume) {
        missingJDKeywords.push(kw.toUpperCase());
      }
    });

    const totalJDReqs = matchedJDKeywords.length + missingJDKeywords.length;
    const jdMatchScore = totalJDReqs > 0
      ? Math.round((matchedJDKeywords.length / totalJDReqs) * 100)
      : 75;

    return {
      ...base,
      jdMatchScore,
      jobDescription,
      matchedJDKeywords: matchedJDKeywords.length > 0 ? matchedJDKeywords : ['JAVASCRIPT', 'HTML/CSS', 'GIT'],
      missingJDKeywords: missingJDKeywords.length > 0 ? missingJDKeywords : ['DOCKER', 'REDIS', 'CI/CD PIPELINES'],
      suggestions: [
        `Align your resume keywords with the target JD: specifically add mentions of ${missingJDKeywords.slice(0, 3).join(', ') || 'Docker and Cloud platforms'}.`,
        ...base.suggestions
      ]
    };
  },

  simulateCodeReview(code: string, language: string): {
    correctness: number;
    timeComplexity: string;
    spaceComplexity: string;
    feedback: string;
    suggestions: string[];
  } {
    const codeLen = code.trim().length;
    const hasLoops = code.includes('for') || code.includes('while') || code.includes('forEach');
    const hasNestedLoops = /for.*for|while.*while|for.*while/s.test(code);
    const hasHashMap = code.includes('Map') || code.includes('Set') || code.includes('{}') || code.includes('dict');

    const timeComplexity = hasNestedLoops ? 'O(N^2)' : hasLoops ? 'O(N)' : 'O(1)';
    const spaceComplexity = hasHashMap ? 'O(N)' : 'O(1)';
    const correctness = Math.min(95, Math.max(60, 70 + (codeLen > 50 ? 15 : 0)));

    return {
      correctness,
      timeComplexity,
      spaceComplexity,
      feedback: `Solid implementation in ${language}. Your algorithmic approach demonstrates good control flow and clean syntax conventions. The logic successfully handles standard inputs.`,
      suggestions: [
        'Consider guarding against null, empty collections, or boundary edge conditions at the beginning of the function.',
        hasNestedLoops ? 'You can optimize this from O(N^2) to O(N) by using a Hash Map or Frequency Array.' : 'Current time complexity is optimal for this problem class.',
        'Add descriptive inline variable names and TypeScript interface contracts for improved production maintainability.'
      ]
    };
  }
};

