import type { AIConfig, Language } from '../types';
import type { DreamTag, UserCategory } from '../types/taxonomy';
import { buildTagId } from '../types/taxonomy';

interface AITagGenerationRequest {
  content: string;
  config: AIConfig;
  language: Language;
  categoryId?: string;
  categories?: UserCategory[];
}

interface AITagGenerationResponse {
  tags: DreamTag[];
  error?: string;
}

interface AITitleGenerationRequest {
  content: string;
  config: AIConfig;
  language: Language;
}

interface AITitleGenerationResponse {
  title: string;
  error?: string;
}

export class AIService {
  static async generateTags(request: AITagGenerationRequest): Promise<AITagGenerationResponse> {
    const { content, config } = request;

    if (!config.enabled) {
      return { tags: [], error: 'AI is disabled' };
    }

    // Provider-specific validation
    if (config.provider === 'gemini') {
      if (!config.apiKey || !config.modelName) {
        return { tags: [], error: 'Gemini requires API key and model name' };
      }
    } else if (config.provider === 'lmstudio') {
      if (!config.completionEndpoint || !config.modelName) {
        return { tags: [], error: 'LM Studio requires endpoint and model name' };
      }
    }

    try {
      switch (config.provider) {
        case 'gemini':
          return await this.generateTagsWithGemini(content, config, request.language, request.categoryId, request.categories || []);
        case 'lmstudio':
          return await this.generateTagsWithLMStudio(content, config, request.language, request.categoryId, request.categories || []);
        default:
          return { tags: [], error: 'Unsupported AI provider' };
      }
    } catch (error) {
      console.error('AI tag generation error:', error);
      return { tags: [], error: 'Failed to generate tags with AI' };
    }
  }

  static async generateTitle(request: AITitleGenerationRequest): Promise<AITitleGenerationResponse> {
    const { content, config } = request;

    if (!config.enabled) {
      return { title: '', error: 'AI is disabled' };
    }

    // Provider-specific validation
    if (config.provider === 'gemini') {
      if (!config.apiKey || !config.modelName) {
        return { title: '', error: 'Gemini requires API key and model name' };
      }
    } else if (config.provider === 'lmstudio') {
      if (!config.completionEndpoint || !config.modelName) {
        return { title: '', error: 'LM Studio requires endpoint and model name' };
      }
    }

    try {
      switch (config.provider) {
        case 'gemini':
          return await this.generateTitleWithGemini(content, config, request.language);
        case 'lmstudio':
          return await this.generateTitleWithLMStudio(content, config, request.language);
        default:
          return { title: '', error: 'Unsupported AI provider' };
      }
    } catch (error) {
      console.error('AI title generation error:', error);
      return { title: '', error: 'Failed to generate title with AI' };
    }
  }

  private static async generateTagsWithGemini(
    content: string,
    config: AIConfig,
    language: Language,
    categoryId?: string,
    categories: UserCategory[] = []
  ): Promise<AITagGenerationResponse> {
    const availableCategories = categories.map((category) => `${category.id}:${category.name}`).join(', ');
    const categoryLine = categoryId
      ? (language === 'pt-BR'
          ? `Use apenas a categoria ${categoryId} para todas as tags.\n`
          : `Use only category ${categoryId} for all tags.\n`)
      : '';

    const prompt = language === 'pt-BR'
      ? `
${categoryLine}Extraia 4-8 tags concisas (1-2 palavras) do texto do sonho abaixo.
Categorias disponíveis (id:nome): ${availableCategories || 'uncategorized:Sem categoria'}.
Retorne SOMENTE JSON válido como uma lista:
[{"label":"tag","categoryId":"id-da-categoria"}]
Se nenhuma categoria encaixar, use "uncategorized".

Conteúdo do sonho:
${content}
`
      : `
${categoryLine}Extract 4-8 concise (1-2 words) tags from the dream text below.
Available categories (id:name): ${availableCategories || 'uncategorized:Uncategorized'}.
Return ONLY valid JSON as an array:
[{"label":"tag","categoryId":"category-id"}]
If no category fits, use "uncategorized".

Dream content:
${content}
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 10000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!generatedText) {
        return { tags: [], error: 'No response from AI' };
      }

      const tags = this.parseGeneratedTags(generatedText, categories, categoryId);

      return { tags };
    } catch (error) {
      console.error('Gemini API error:', error);
      return { tags: [], error: 'Failed to connect to Gemini API' };
    }
  }

  private static async generateTagsWithLMStudio(
    content: string,
    config: AIConfig,
    language: Language,
    categoryId?: string,
    categories: UserCategory[] = []
  ): Promise<AITagGenerationResponse> {
    const availableCategories = categories.map((category) => `${category.id}:${category.name}`).join(', ');
    const categoryLine = categoryId
      ? (language === 'pt-BR'
          ? `Use apenas a categoria ${categoryId} para todas as tags.\n`
          : `Use only category ${categoryId} for all tags.\n`)
      : '';

    const prompt = language === 'pt-BR'
      ? `${categoryLine}Analise o conteúdo do sonho e gere 4-8 tags relevantes (1-2 palavras).
Categorias disponíveis (id:nome): ${availableCategories || 'uncategorized:Sem categoria'}.
Retorne SOMENTE JSON válido no formato:
[{"label":"tag","categoryId":"id-da-categoria"}]
Use "uncategorized" quando necessário.

Conteúdo do sonho:
${content}`
      : `${categoryLine}Analyze the dream content and generate 4-8 relevant (1-2 words) tags.
Available categories (id:name): ${availableCategories || 'uncategorized:Uncategorized'}.
Return ONLY valid JSON in this format:
[{"label":"tag","categoryId":"category-id"}]
Use "uncategorized" when needed.

Dream content:
${content}`;

    try {
      const isChat = /\/chat\/completions\b/.test(config.completionEndpoint);

      // Build request according to endpoint type
      const requestBody: Record<string, unknown> = isChat
        ? {
            model: config.modelName || 'local-model',
            messages: [
              { role: 'system', content: 'You are a helpful assistant that extracts tags.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 10000,
            stream: false,
          }
        : {
            model: config.modelName || 'local-model',
            prompt,
            temperature: 0.3,
            max_tokens: 10000,
            stream: false,
          };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // Some LM Studio setups accept an auth token; include if provided
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

      const response = await fetch(config.completionEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LM Studio API error response:', errorText);
        throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Parse response according to endpoint type
      const generatedText: string = isChat
        ? (data.choices?.[0]?.message?.content || '')
        : (data.choices?.[0]?.text || '');
      
      if (!generatedText) {
        return { tags: [], error: 'No response from AI' };
      }

      const tags = this.parseGeneratedTags(generatedText, categories, categoryId);

      return { tags };
    } catch (error) {
      console.error('LM Studio API error:', error);
      return { tags: [], error: (error as Error).message || 'Failed to connect to LM Studio API' };
    }
  }

  private static parseGeneratedTags(
    generatedText: string,
    categories: UserCategory[],
    forcedCategoryId?: string
  ): DreamTag[] {
    const validCategoryIds = new Set(categories.map((category) => category.id));
    validCategoryIds.add('uncategorized');

    const normalizeCategoryId = (input?: string): string => {
      if (forcedCategoryId) return forcedCategoryId;
      if (!input) return 'uncategorized';
      return validCategoryIds.has(input) ? input : 'uncategorized';
    };

    const tryParseJson = () => {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return null;
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) return null;
        return parsed
          .map((item) => ({
            label: String(item?.label || '').trim(),
            categoryId: normalizeCategoryId(String(item?.categoryId || '')),
          }))
          .filter((item) => item.label.length > 0)
          .slice(0, 8);
      } catch {
        return null;
      }
    };

    const parsedJson = tryParseJson();
    const parsedItems = parsedJson
      ? parsedJson
      : generatedText
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .slice(0, 8)
          .map((label) => ({
            label,
            categoryId: normalizeCategoryId(forcedCategoryId),
          }));

    const seen = new Set<string>();
    return parsedItems
      .map((item) => ({
        id: buildTagId(item.categoryId, item.label),
        label: item.label,
        categoryId: item.categoryId,
        isCustom: true,
      }))
      .filter((tag) => {
        if (seen.has(tag.id)) return false;
        seen.add(tag.id);
        return true;
      });
  }

  private static async generateTitleWithGemini(content: string, config: AIConfig, language: Language): Promise<AITitleGenerationResponse> {
    const prompt = language === 'pt-BR' ? `
    Crie um título conciso e evocativo (3-8 palavras) para este sonho baseado em seu conteúdo.
    O título deve capturar a essência, emoção ou tema principal do sonho.
    Retorne apenas o título sem texto adicional, aspas ou formatação.

    Conteúdo do sonho:
    ${content}

    Título:` : `
    Create a concise, evocative title (3-8 words) for this dream based on its content.
    The title should capture the essence, emotion, or key theme of the dream.
    Return only the title with no additional text, quotes, or formatting.

    Dream content:
    ${content}

    Title:`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 10000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedTitle = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!generatedTitle) {
        return { title: '', error: 'No response from AI' };
      }

      // Clean up the title
      const title = generatedTitle.trim().replace(/^["']|["']$/g, '');

      return { title };
    } catch (error) {
      console.error('Gemini API error:', error);
      return { title: '', error: 'Failed to connect to Gemini API' };
    }
  }

  private static async generateTitleWithLMStudio(content: string, config: AIConfig, language: Language): Promise<AITitleGenerationResponse> {
    const prompt = language === 'pt-BR' ? `Crie um título conciso e evocativo (3-8 palavras) para este sonho baseado em seu conteúdo. O título deve capturar a essência, emoção ou tema principal do sonho. Retorne apenas o título sem texto adicional, aspas ou formatação.

    Conteúdo do sonho:
    ${content}

    Título:` : `Create a concise, evocative title (3-8 words) for this dream based on its content. The title should capture the essence, emotion, or key theme of the dream. Return only the title with no additional text, quotes, or formatting.

    Dream content:
    ${content}

    Title:`;

    try {
      const isChat = /\/chat\/completions\b/.test(config.completionEndpoint);

      // Build request according to endpoint type
      const requestBody: Record<string, unknown> = isChat
        ? {
            model: config.modelName || 'local-model',
            messages: [
              { role: 'system', content: 'You are a helpful assistant that creates dream titles.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 10000,
            stream: false,
          }
        : {
            model: config.modelName || 'local-model',
            prompt,
            temperature: 0.7,
            max_tokens: 10000,
            stream: false,
          };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // Some LM Studio setups accept an auth token; include if provided
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

      const response = await fetch(config.completionEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LM Studio API error response:', errorText);
        throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Parse response according to endpoint type
      const generatedTitle: string = isChat
        ? (data.choices?.[0]?.message?.content || '')
        : (data.choices?.[0]?.text || '');
      
      if (!generatedTitle) {
        return { title: '', error: 'No response from AI' };
      }

      // Clean up the title
      const title = generatedTitle.trim().replace(/^["']|["']$/g, '');

      return { title };
    } catch (error) {
      console.error('LM Studio API error:', error);
      return { title: '', error: (error as Error).message || 'Failed to connect to LM Studio API' };
    }
  }
}
