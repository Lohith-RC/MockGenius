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
   * Evaluates a resume and predicts an ATS score
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
   * Generates tailored interview questions
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
   * Evaluates a single mock interview answer
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
   * Generates a comprehensive feedback report at the end of the mock interview
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
  }
};
