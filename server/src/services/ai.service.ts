import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
// Initialize if apiKey is present, otherwise fallback
let ai: any = null;
if (apiKey) {
  try {
    ai = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('Failed to initialize Google Gen AI:', err);
  }
}

export const explainConcept = async (concept: string): Promise<string> => {
  if (!ai) {
    return `**Fallback Concept Explanation (No API Key)**\n\n"${concept}" is an important academic topic. Study this using past papers or textbook modules. For fully functional AI, configure the \`GEMINI_API_KEY\` environment variable.`;
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(`Explain the concept "${concept}" clearly to a university student. Provide structured points and a brief code example if relevant.`);
    return response.text;
  } catch (error: any) {
    console.error('Gemini error:', error);
    return `Error generating response from Gemini: ${error.message}`;
  }
};

export const matchLostFound = async (lostDesc: string, foundDesc: string): Promise<number> => {
  if (!ai) {
    // Basic heuristics comparison fallback
    const lostWords = new Set(lostDesc.toLowerCase().split(/\s+/));
    const foundWords = new Set(foundDesc.toLowerCase().split(/\s+/));
    const intersection = [...lostWords].filter(x => foundWords.has(x));
    const matchRatio = intersection.length / Math.max(lostWords.size, foundWords.size);
    return Math.round(matchRatio * 100);
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Compare these two items and return ONLY a percentage match score (an integer between 0 and 100) based on how likely they are the exact same item.
Item A (Lost): "${lostDesc}"
Item B (Found): "${foundDesc}"`;
    const response = await model.generateContent(prompt);
    const scoreStr = response.text.trim().replace(/[^0-9]/g, '');
    const score = parseInt(scoreStr, 10);
    return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
  } catch (error) {
    return 30; // standard low fallback
  }
};

export const analyzeResume = async (resumeText: string): Promise<string> => {
  if (!ai) {
    return `**Fallback Resume Feedback (No API Key)**\n\n1. Ensure you quantify your results (e.g., "improved performance by 20%").\n2. Add keywords related to internships you want.\n3. Verify contact details are correct.`;
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this resume and provide structured, high-quality professional feedback on format, technical skills, impact statements, and key recommendations:\n\n${resumeText}`;
    const response = await model.generateContent(prompt);
    return response.text;
  } catch (error: any) {
    return `Error analyzing resume: ${error.message}`;
  }
};

export const generateQuiz = async (subject: string): Promise<any[]> => {
  const defaultQuiz = [
    { question: `What is a primary concept in ${subject}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Option A' },
    { question: `Which of the following describes ${subject}?`, options: ['Definition X', 'Definition Y', 'Definition Z', 'Definition W'], answer: 'Definition X' }
  ];
  if (!ai) return defaultQuiz;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Create a multiple-choice quiz of 3 questions on the subject "${subject}" in JSON format. Provide the response as a valid JSON array where each object has: "question", "options" (array of 4 strings), and "answer" (string matching exactly one of the options). Do not wrap the JSON in markdown blocks.`;
    const response = await model.generateContent(prompt);
    const text = response.text.trim().replace(/^```json\s*/, '').replace(/```$/, '');
    return JSON.parse(text);
  } catch (error) {
    return defaultQuiz;
  }
};

export const createStudyPlan = async (goal: string, hours: number): Promise<string> => {
  if (!ai) {
    return `**Fallback Study Plan (No API Key)**\n\n- Phase 1 (First 30% time): Overview & reading materials.\n- Phase 2 (Middle 50% time): Interactive exercises, assignments, and mock problems.\n- Phase 3 (Final 20% time): Recap, revision notes, mock quizzes.`;
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Create a custom, daily breakdown study plan to achieve the goal: "${goal}" assuming ${hours} study hours per week.`;
    const response = await model.generateContent(prompt);
    return response.text;
  } catch (error: any) {
    return `Error generating study plan: ${error.message}`;
  }
};

export const analyzeUploadedImage = async (buffer: Buffer, mimeType: string): Promise<string[]> => {
  if (!ai) {
    return ['Campus Item', 'Personal Belonging'];
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const imagePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
    const prompt = `Analyze this image of a lost or found campus item. Identify the main physical object(s) in the image and return a comma-separated list of tags. For example, if you see a black backpack, return "Black Backpack". Keep the tags short, precise, and comma-separated without any markdown or extra text. Output format: Tag1, Tag2, Tag3`;
    const response = await model.generateContent([prompt, imagePart]);
    const tagsText = response.text.trim();
    if (!tagsText) return ['Lost Item'];
    return tagsText.split(',').map((t: string) => t.trim()).filter(Boolean);
  } catch (error) {
    console.error('AI image analysis error:', error);
    return ['Lost Item'];
  }
};

