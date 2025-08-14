
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DailyTodo } from "../types";

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

/**
 * Refines a given text to be clearer and more action-oriented.
 * @param text - The text to refine.
 * @returns The refined text as a string.
 */
export const refineTextWithAI = async (text: string): Promise<string> => {
  const prompt = `You are a project management assistant. Refine the following task description to be clearer, more concise, and action-oriented. Break it down into key points if necessary. Here is the description: "${text}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        // Disable thinking for faster, more direct responses for this task
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error (refineTextWithAI):", error);
    throw new Error("Failed to get a response from the AI.");
  }
};

/**
 * Generates a markdown checklist of sub-tasks based on a task title and description.
 * @param title - The title of the card.
 * @param description - The description of the card.
 * @returns A promise that resolves to an array of markdown checklist item strings.
 */
export const generateChecklistWithAI = async (title: string, description?: string): Promise<string[]> => {
  const prompt = `You are a project management assistant. Based on the task title "${title}" ${description ? `and description "${description}"` : ''}, brainstorm a checklist of sub-tasks to complete it. Provide the response in the specified JSON format.`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
                task: {
                    type: Type.STRING,
                    description: "A single sub-task item."
                }
            },
            required: ["task"]
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const checklistObjects = JSON.parse(jsonString);
    
    if (Array.isArray(checklistObjects) && checklistObjects.every(item => typeof item.task === 'string')) {
        // Format as markdown checklist
        return checklistObjects.map(item => `- [ ] ${item.task}`);
    } else {
        throw new Error("AI response was not a valid array of task objects.");
    }

  } catch (error) {
    console.error("Gemini API Error (generateChecklistWithAI):", error);
    throw new Error("Failed to generate a checklist from the AI.");
  }
};

/**
 * Generates relevant tags for a note.
 * @param title - The title of the note.
 * @param content - The content of the note.
 * @returns A promise that resolves to an array of tag name strings.
 */
export const generateTagsWithAI = async (title: string, content: string): Promise<string[]> => {
  const prompt = `You are a productivity assistant. Based on the note title "${title}" and its content "${content}", suggest 3 to 5 relevant one-word or two-word tags. Provide the response in the specified JSON format.`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
                tag: {
                    type: Type.STRING,
                    description: "A single tag."
                }
            },
            required: ["tag"]
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const tagObjects = JSON.parse(jsonString);
    
    if (Array.isArray(tagObjects) && tagObjects.every(item => typeof item.tag === 'string')) {
        return tagObjects.map(item => item.tag.toLowerCase());
    } else {
        throw new Error("AI response was not a valid array of tag objects.");
    }

  } catch (error) {
    console.error("Gemini API Error (generateTagsWithAI):", error);
    throw new Error("Failed to generate tags from the AI.");
  }
};

/**
 * Prioritizes a list of tasks for a given day using AI.
 * @param tasks - The tasks for the day.
 * @returns A promise that resolves to an array of task IDs in the new optimal order.
 */
export const prioritizeTasksWithAI = async (tasks: DailyTodo[]): Promise<string[]> => {
    const simplifiedTasks = tasks.map(t => ({
        id: t.id,
        text: t.text,
        time: t.startTime ? new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'anytime'
    }));

    const prompt = `You are a productivity expert. Reorder this list of tasks for an optimal workflow. Consider urgency from specified times, logical dependencies (e.g., 'plan' before 'execute'), and group similar tasks. Return ONLY a JSON array of the task IDs in the newly suggested order. Do not include any other text or explanation.

Tasks:
${JSON.stringify(simplifiedTasks, null, 2)}`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An ordered array of task IDs.",
                    items: { type: Type.STRING }
                },
            },
        });

        const jsonString = response.text.trim();
        const orderedIds = JSON.parse(jsonString);

        if (Array.isArray(orderedIds) && orderedIds.every(id => typeof id === 'string')) {
            return orderedIds;
        } else {
            throw new Error("AI response was not a valid array of task IDs.");
        }
    } catch (error) {
        console.error("Gemini API Error (prioritizeTasksWithAI):", error);
        throw new Error("Failed to prioritize tasks with AI.");
    }
};


/**
 * Generates a list of sub-topics for a given parent topic.
 * @param parentTopic The topic to generate sub-ideas for.
 * @returns A promise that resolves to an array of sub-topic strings.
 */
export const generateSubtopics = async (parentTopic: string): Promise<string[]> => {
    const prompt = `You are a creative brainstorming assistant. For the topic "${parentTopic}", generate a list of 5 to 7 related sub-topics or ideas. Respond in the specified JSON format.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            subtopic: {
                                type: Type.STRING,
                                description: "A single sub-topic or idea."
                            }
                        },
                        required: ["subtopic"]
                    },
                },
            },
        });

        const jsonString = response.text.trim();
        const subtopicObjects = JSON.parse(jsonString);

        if (Array.isArray(subtopicObjects) && subtopicObjects.every(item => typeof item.subtopic === 'string')) {
            return subtopicObjects.map(item => item.subtopic);
        } else {
            throw new Error("AI response was not a valid array of subtopic objects.");
        }
    } catch (error) {
        console.error("Gemini API Error (generateSubtopics):", error);
        throw new Error("Failed to generate subtopics from the AI.");
    }
};

/**
 * Generates mind map ideas from a central topic.
 * @param topic - The central topic for the mind map.
 * @returns A promise that resolves to a structured mind map object.
 */
export const getMindMapIdeas = async (topic: string): Promise<{ centralTopic: string; branches: { topic: string; subTopics: string[] }[] }> => {
  const prompt = `You are a creative brainstorming assistant. For the central topic "${topic}", generate a mind map structure with a central topic, several main branches, and sub-topics for each branch. Respond in a strict JSON format. Example: {"centralTopic": "Renewable Energy", "branches": [{"topic": "Solar Power", "subTopics": ["Photovoltaic Cells", "Solar Thermal"]}, {"topic": "Wind Power", "subTopics": ["Onshore Wind Farms", "Offshore Wind Farms"]}]}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            centralTopic: { type: Type.STRING, description: "The main idea of the mind map." },
            branches: {
              type: Type.ARRAY,
              description: "The main branches stemming from the central topic.",
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING, description: "The title of a main branch." },
                  subTopics: {
                    type: Type.ARRAY,
                    description: "A list of sub-ideas for this branch.",
                    items: { type: Type.STRING }
                  }
                },
                 required: ["topic", "subTopics"],
              }
            }
          },
          required: ["centralTopic", "branches"],
        }
      }
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);
    if (parsed.centralTopic && Array.isArray(parsed.branches)) {
        return parsed;
    } else {
        throw new Error("Invalid JSON structure received from AI.");
    }

  } catch (error) {
    console.error("Gemini API Error (getMindMapIdeas):", error);
    throw new Error("Failed to generate mind map ideas from the AI.");
  }
};
