import type { ComboboxOption } from "@/components/ui/combobox";

export const LITELLM_MODELS: ComboboxOption[] = [
  // OpenAI
  { value: "openai/gpt-4o", label: "GPT-4o", group: "OpenAI" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", group: "OpenAI" },
  { value: "openai/gpt-4-turbo", label: "GPT-4 Turbo", group: "OpenAI" },
  { value: "openai/gpt-4", label: "GPT-4", group: "OpenAI" },
  { value: "openai/gpt-3.5-turbo", label: "GPT-3.5 Turbo", group: "OpenAI" },
  { value: "openai/o1", label: "o1", group: "OpenAI" },
  { value: "openai/o1-mini", label: "o1 Mini", group: "OpenAI" },
  { value: "openai/o1-pro", label: "o1 Pro", group: "OpenAI" },
  { value: "openai/o3", label: "o3", group: "OpenAI" },
  { value: "openai/o3-mini", label: "o3 Mini", group: "OpenAI" },
  { value: "openai/o4-mini", label: "o4 Mini", group: "OpenAI" },

  // Anthropic
  { value: "anthropic/claude-opus-4-20250514", label: "Claude Opus 4", group: "Anthropic" },
  { value: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4", group: "Anthropic" },
  { value: "anthropic/claude-sonnet-4-6-20250620", label: "Claude Sonnet 4.6", group: "Anthropic" },
  { value: "anthropic/claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", group: "Anthropic" },
  { value: "anthropic/claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", group: "Anthropic" },
  { value: "anthropic/claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", group: "Anthropic" },

  // Google
  { value: "vertex_ai/gemini-2.5-pro", label: "Gemini 2.5 Pro", group: "Google" },
  { value: "vertex_ai/gemini-2.5-flash", label: "Gemini 2.5 Flash", group: "Google" },
  { value: "vertex_ai/gemini-2.0-flash", label: "Gemini 2.0 Flash", group: "Google" },
  { value: "gemini/gemini-2.5-pro", label: "Gemini 2.5 Pro (AI Studio)", group: "Google" },
  { value: "gemini/gemini-2.5-flash", label: "Gemini 2.5 Flash (AI Studio)", group: "Google" },

  // Mistral
  { value: "mistral/mistral-large-latest", label: "Mistral Large", group: "Mistral" },
  { value: "mistral/mistral-medium-latest", label: "Mistral Medium", group: "Mistral" },
  { value: "mistral/mistral-small-latest", label: "Mistral Small", group: "Mistral" },
  { value: "mistral/codestral-latest", label: "Codestral", group: "Mistral" },

  // Cohere
  { value: "cohere/command-r-plus", label: "Command R+", group: "Cohere" },
  { value: "cohere/command-r", label: "Command R", group: "Cohere" },

  // AWS Bedrock
  { value: "bedrock/anthropic.claude-opus-4-20250514-v1:0", label: "Claude Opus 4 (Bedrock)", group: "AWS Bedrock" },
  { value: "bedrock/anthropic.claude-sonnet-4-20250514-v1:0", label: "Claude Sonnet 4 (Bedrock)", group: "AWS Bedrock" },
  { value: "bedrock/amazon.nova-pro-v1:0", label: "Amazon Nova Pro", group: "AWS Bedrock" },
  { value: "bedrock/amazon.nova-lite-v1:0", label: "Amazon Nova Lite", group: "AWS Bedrock" },

  // Azure OpenAI
  { value: "azure/gpt-4o", label: "GPT-4o (Azure)", group: "Azure OpenAI" },
  { value: "azure/gpt-4", label: "GPT-4 (Azure)", group: "Azure OpenAI" },
  { value: "azure/gpt-35-turbo", label: "GPT-3.5 Turbo (Azure)", group: "Azure OpenAI" },

  // Ollama (local)
  { value: "ollama/llama4", label: "Llama 4", group: "Ollama (Local)" },
  { value: "ollama/llama3.3", label: "Llama 3.3", group: "Ollama (Local)" },
  { value: "ollama/deepseek-r1", label: "DeepSeek R1", group: "Ollama (Local)" },
  { value: "ollama/deepseek-v3", label: "DeepSeek V3", group: "Ollama (Local)" },
  { value: "ollama/qwen3", label: "Qwen 3", group: "Ollama (Local)" },
  { value: "ollama/codellama", label: "Code Llama", group: "Ollama (Local)" },
  { value: "ollama/mistral", label: "Mistral (Local)", group: "Ollama (Local)" },
  { value: "ollama/phi4", label: "Phi-4", group: "Ollama (Local)" },

  // Groq
  { value: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B", group: "Groq" },
  { value: "groq/llama-3.1-8b-instant", label: "Llama 3.1 8B", group: "Groq" },
  { value: "groq/mixtral-8x7b-32768", label: "Mixtral 8x7B", group: "Groq" },

  // DeepSeek
  { value: "deepseek/deepseek-chat", label: "DeepSeek Chat", group: "DeepSeek" },
  { value: "deepseek/deepseek-reasoner", label: "DeepSeek Reasoner", group: "DeepSeek" },

  // Together AI
  { value: "together_ai/meta-llama/Llama-4-Maverick-17B-128E-Instruct-Turbo", label: "Llama 4 Maverick", group: "Together AI" },
  { value: "together_ai/deepseek-ai/DeepSeek-R1", label: "DeepSeek R1", group: "Together AI" },

  // OpenRouter
  { value: "openrouter/openai/gpt-4o", label: "GPT-4o (OpenRouter)", group: "OpenRouter" },
  { value: "openrouter/anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (OpenRouter)", group: "OpenRouter" },
  { value: "openrouter/google/gemini-2.5-pro", label: "Gemini 2.5 Pro (OpenRouter)", group: "OpenRouter" },
];
