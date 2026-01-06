
import { GoogleGenAI, Type } from "@google/genai";
import { StatData, Region, ChatMessage, CatalogueItem, ActorType, Operation, SalesProduct, UserProfile } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';
const VISION_MODEL_NAME = 'gemini-3-pro-image-preview';
const MAPS_COMPATIBLE_MODEL = 'gemini-2.5-flash';

// Analysis of production and market data for dashboard summary
export const getDashboardAnalysis = async (
  productionStats: StatData[],
  marketStats: any[],
  weatherSummary: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Act as a senior agricultural analyst for Eswatini. 
      Analyze: Production: ${JSON.stringify(productionStats)}, Market: ${JSON.stringify(marketStats)}, Weather: ${weatherSummary}.
      Provide a concise strategic summary (max 150 words) with HTML bold tags for key metrics.
    `;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return response.text || "Analysis unavailable.";
  } catch (error) { return "AI Service offline."; }
};

// Quick weather alert using Google Search grounding
export const getWeatherAlert = async (): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Current weather alert for Eswatini. 10 words max.",
      config: { tools: [{googleSearch: {}}] }
    });
    return response.text?.trim() || "Clear skies.";
  } catch (error) { return "No active alerts."; }
};

// Conversational interface for agricultural assistance
export const chatWithAgriBot = async (
  message: string,
  attachment: { mimeType: string; data: string } | null,
  history: ChatMessage[]
): Promise<{ text: string; groundingMetadata?: any }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const selectedModel = attachment ? VISION_MODEL_NAME : MODEL_NAME;
    const chat = ai.chats.create({
      model: selectedModel,
      config: { systemInstruction: "You are the AIIS Eswatini Expert. Localized, professional, and technical." }
    });
    const parts: any[] = [{ text: message }];
    if (attachment) parts.push({ inlineData: attachment });
    const result = await chat.sendMessage({ message: { parts } });
    return { text: result.text || "...", groundingMetadata: result.candidates?.[0]?.groundingMetadata };
  } catch (error) { return { text: "Connection issues." }; }
};

// AI Vision to extract details from National ID cards
export const extractPersonalDetailsFromID = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `EXTRACT DATA FROM ESWATINI ID:
    Find: First Name, Last Name, ID Number (PIN), Date of Birth, Gender.
    Ignore background artifacts. Return strictly valid JSON.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [{ inlineData: { mimeType: mimeType, data: base64Image } }, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            gender: { type: Type.STRING },
            dob: { type: Type.STRING },
            idNumber: { type: Type.STRING },
          },
          required: ['firstName', 'lastName', 'idNumber']
        }
      }
    });
    const text = response.text || "{}";
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) { 
    console.error("Extraction error:", error);
    return null; 
  }
};

// Generate a narrative user story based on role and goal
export const generateCustomUserStory = async (role: ActorType, goal: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({ 
    model: MODEL_NAME, 
    contents: `Write a technical user story for a ${role} doing ${goal} using AIIS. Use HTML tags.` 
  });
  return response.text || "";
};

// Generate a summary report for product traceability
export const getTraceabilityReport = async (id: string, product: SalesProduct, owner: UserProfile | undefined): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Analyze the traceability of this agricultural product in Eswatini:
      ID: ${id}
      Product Details: ${JSON.stringify(product)}
      Owner Information: ${JSON.stringify(owner)}
      
      Provide a professional provenance summary (max 100 words) confirming the digital thread from field to market.
    `;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });
    return response.text || "Traceability data verified.";
  } catch (error) { return "Provenance verification incomplete."; }
};

// Placeholder for weather forecast retrieval
export const getWeatherForecast = async (lat: number, lng: number): Promise<any> => {
    return { location: "Eswatini", days: [{ day: "Today", high: 28, low: 18, condition: "Sunny", rainChance: 0 }] };
};
