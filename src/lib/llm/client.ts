import OpenAI from 'openai';
import { SYSTEM_PROMPT, getUserPrompt, getRetryPrompt } from './prompts';
import { LLMResponseSchema, LLMResponse } from './schema';

const MAX_RETRIES = 2;

export async function generateCampaignSpec(
  naturalLanguageInput: string
): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const userPrompt = attempt === 0 
        ? getUserPrompt(naturalLanguageInput)
        : getRetryPrompt(lastError?.message || 'Unknown error', naturalLanguageInput);

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      // JSON 파싱
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError}`);
      }

      // Schema 검증
      const validated = LLMResponseSchema.parse(parsed);

      return validated;
    } catch (error: any) {
      lastError = error;
      
      // Zod 검증 에러의 경우 더 자세한 메시지
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        lastError = new Error(`Validation failed: ${issues}`);
      }

      // 마지막 시도가 아니면 재시도
      if (attempt < MAX_RETRIES) {
        console.warn(`LLM generation attempt ${attempt + 1} failed, retrying... Error: ${error?.message || 'Unknown error'}`);
        continue;
      }
    }
  }

  // 모든 시도 실패
  throw new Error(`Failed to generate campaign spec after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

