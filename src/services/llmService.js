import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LLMService {
  constructor() {
    this.apiKey = process.env.ZAI_API_KEY;
    this.baseUrl = process.env.ZAI_BASE_URL;
    
    if (!this.apiKey || !this.baseUrl) {
      throw new Error('ZAI_API_KEY and ZAI_BASE_URL must be configured in environment variables');
    }
    
    this.systemPrompt = readFileSync(
      join(__dirname, '../../prompts/prompt_generation.md'), 
      'utf-8'
    );
  }

  async generateInstruction(location, sessionContext = {}) {
    try {
      const userPrompt = location;
      
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt + '\n\nIMPORTANT: You must respond with valid JSON only, no additional text or markdown formatting.'
        }
      ];

      if (sessionContext.previousInstructions?.length > 0) {
        messages.push({
          role: 'system',
          content: `Previous exploration context: ${JSON.stringify(sessionContext.previousInstructions.slice(-3))}`
        });
      }

      messages.push({
        role: 'user',
        content: userPrompt
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: process.env.ZAI_MODEL || 'glm-4.5-air',
          messages: messages,
          temperature: 0.8,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`ZhipuAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response from ZhipuAI API');
      }

      const content = data.choices[0].message.content;
      const instruction = JSON.parse(content);
      
      this.validateInstruction(instruction);
      
      return instruction;
    } catch (error) {
      console.error('Error generating instruction:', error);
      throw new Error(`Failed to generate instruction: ${error.message}`);
    }
  }

  validateInstruction(instruction) {
    if (!instruction.question || typeof instruction.question !== 'string') {
      throw new Error('Invalid instruction: missing or invalid question');
    }
    
    if (!Array.isArray(instruction.choices) || instruction.choices.length < 2) {
      throw new Error('Invalid instruction: choices must be an array with at least 2 options');
    }
    
    for (const choice of instruction.choices) {
      if (!choice.option || !choice.next_action) {
        throw new Error('Invalid instruction: each choice must have option and next_action');
      }
      
      if (typeof choice.option !== 'string' || typeof choice.next_action !== 'string') {
        throw new Error('Invalid instruction: option and next_action must be strings');
      }
    }
    
    if (instruction.question.split(' ').length > 25) {
      throw new Error('Invalid instruction: question exceeds 25 words');
    }
    
    for (const choice of instruction.choices) {
      if (choice.option.split(' ').length > 15) {
        throw new Error('Invalid instruction: option exceeds 15 words');
      }
      if (choice.next_action.split(' ').length > 30) {
        throw new Error('Invalid instruction: next_action exceeds 30 words');
      }
    }
  }
}

export default LLMService;