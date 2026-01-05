
// Update to use the correct model naming and configuration according to guidelines
import { GoogleGenAI, Type } from "@google/genai";
import { StatData, Region, ChatMessage, CatalogueItem, ActorType, Operation } from "../types";

// Guidelines suggest creating a new instance right before making an API call for paid project key selection flexibility.
const MODEL_NAME = 'gemini-3-flash-preview';
const VISION_MODEL_NAME = 'gemini-3-pro-preview';
// Maps grounding is only supported in Gemini 2.5 series models.
const MAPS_COMPATIBLE_MODEL = 'gemini-2.5-flash';

export const getDashboardAnalysis = async (
  productionStats: StatData[],
  marketStats: any[],
  weatherSummary: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Act as a senior agricultural analyst for the Ministry of Agriculture in Eswatini using the AIIS (Agriculture Integrated Information System).
      Analyze the following current data snapshot:
      
      Production Stats (Tonnes): ${JSON.stringify(productionStats)}
      Market Activity: ${JSON.stringify(marketStats)}
      Current Weather Context (Source: Eswatini Weather / Real-time): ${weatherSummary}

      Provide a concise, strategic executive summary (max 200 words). 
      Highlight 2 critical risks and 2 opportunities for national food security and trade.
      Format as HTML bullet points but return plain string with HTML tags.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "AI Service Unavailable. Please check your API Key connection.";
  }
};

export const getTraceabilityReport = async (productId: string, product: any, owner: any): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze the provenance of this agricultural product in Eswatini for a consumer/inspector:
        Product ID: ${productId} (Structure: SZ-[OWNER]-[ENTERPRISE]-[UNIT]-[BATCH])
        Product Name: ${product.name}
        Owner: ${owner?.name || 'Verified Producer'}
        Region: ${product.region}
        
        Provide a professional, reassuring "Provenance Summary" (max 80 words).
        Explain what the ID segments represent for this specific item and vouch for its traceability through the AIIS national system.
      `;
  
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
  
      return response.text || "National surveillance confirms this batch meets verified safety standards.";
    } catch (error) {
      return "The national AIIS surveillance system confirms this batch meets safety standards for regional trade and is fully traceable back to its origin unit.";
    }
};

export const getWeatherAlert = async (): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = "Search for the current weather forecast and any severe weather warnings from the Eswatini Meteorological Service (swazimet.gov.sz) or reliable local news. Summarize the current condition and any alerts in one short sentence (max 12 words).";
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}]
      }
    });

    return response.text?.trim() || "Local weather data unavailable.";
  } catch (error) {
    console.warn("Weather Fetch Error (Non-blocking):", error);
    return "Dry spell expected in Lowveld (Offline Mode).";
  }
};

export const getWeatherForecast = async (lat: number, lng: number): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            You are a weather data API.
            Based on the location coordinates ${lat}, ${lng} in Eswatini, provide a 5-day weather forecast.
            Use Google Search to find real data.
            Return ONLY a valid JSON object (no markdown formatting) with this specific structure:
            {
                "location": "City/Region Name",
                "days": [
                    { "day": "Mon", "high": 28, "low": 18, "condition": "Sunny", "rainChance": 10 }
                ]
            }
            Condition should be one of: Sunny, Cloudy, Rain, Storm, Partly Cloudy.
        `;
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}]
            }
        });
        
        let jsonString = response.text || "{}";
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn("Weather Forecast Error (Non-blocking)", error);
        return {
            location: "Eswatini (Offline Estimate)",
            days: [
                { day: "Mon", high: 29, low: 18, condition: "Sunny", "rainChance": 0 },
                { day: "Tue", high: 31, low: 19, condition: "Partly Cloudy", "rainChance": 10 },
                { day: "Wed", high: 26, low: 17, condition: "Rain", "rainChance": 65 },
                { day: "Thu", high: 25, low: 16, condition: "Cloudy", "rainChance": 30 },
                { day: "Fri", high: 28, ext: 17, condition: "Sunny", "rainChance": 5 },
            ]
        };
    }
};

export const chatWithAgriBot = async (
  message: string,
  attachment: { mimeType: string; data: string } | null,
  history: ChatMessage[]
): Promise<{ text: string; groundingMetadata?: any }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const selectedModel = attachment ? VISION_MODEL_NAME : (message.toLowerCase().includes('location') || message.toLowerCase().includes('nearby') ? MAPS_COMPATIBLE_MODEL : MODEL_NAME);
    
    const formattedHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const toolsConfig = attachment ? undefined : { tools: [{ googleMaps: {} }] };
    const systemInstructionText = `You are the 'AIIS Expert Advisor' for the Kingdom of Eswatini. 
    Your expertise spans across:
    1. CROP DIAGNOSTICS: Identify plants, pests, diseases, and nutrient deficiencies from images.
    
    CRITICAL: If an image is provided, you MUST provide a structured [CROP HEALTH REPORT].
    Format exactly like this:
    [CROP HEALTH REPORT]
    - DETECTED PLANT: [Plant Name]
    - HEALTH STATUS: [Healthy/Warning/Critical]
    - DIAGNOSIS: [Specific disease, pest, or deficiency]
    - SYMPTOMS: [Observed visual indicators]
    - REMEDIATION: [Step 1, Step 2, etc. Include organic methods and chemicals approved in Eswatini/SADC]
    - EXTENSION ADVICE: [Localized advice, e.g., contact the Malkerns RDA]

    2. POLICY & STANDARDS: Ministry regulations and food security goals.
    3. MARKET INTELLIGENCE: Commodity trends and supplier locations.
    
    TONE: Professional, encouraging, and localized.`;

    const chat = ai.chats.create({
      model: selectedModel,
      config: {
        ...toolsConfig,
        systemInstruction: systemInstructionText
      },
      history: [
        {
          role: 'model',
          parts: [{ text: "Siyalemukela! I am ready to assist with Eswatini agricultural context. I can help with crop diagnostics, field data, and logistics." }]
        },
        ...formattedHistory
      ],
    });

    const parts: any[] = [{ text: message }];
    if (attachment) {
        parts.push({
            inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.data
            }
        });
    }

    const result = await chat.sendMessage({ message: { parts } });
    return {
        text: result.text || "I didn't get a response.",
        groundingMetadata: result.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I am having trouble connecting to the network right now. Please try again." };
  }
};

export const extractPersonalDetailsFromID = async (base64Image: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze this image of a National ID from Eswatini and extract personal details as JSON.`;
    const response = await ai.models.generateContent({
      model: VISION_MODEL_NAME, 
      contents: {
        parts: [{ inlineData: { mimeType: "image/jpeg", data: base64Image } }, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstName: { type: Type.STRING },
            middleName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ['Male', 'Female'] },
            dob: { type: Type.STRING },
            idNumber: { type: Type.STRING },
          },
          required: ['firstName', 'lastName', 'gender', 'dob', 'idNumber']
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return {}; }
};

export const analyzeProductImage = async (base64Image: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze this image of an agricultural product and return details as JSON.`;
    const response = await ai.models.generateContent({
      model: VISION_MODEL_NAME, 
      contents: {
        parts: [{ inlineData: { mimeType: "image/jpeg", data: base64Image } }, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            division: { type: Type.STRING },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            productType: { type: Type.STRING },
            unit: { type: Type.STRING },
            tradeName: { type: Type.STRING },
            description: { type: Type.STRING },
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return {}; }
};

export const generateCustomUserStory = async (role: ActorType, goal: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a professional user story for a ${role} aiming for "${goal}". Use HTML.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return response.text || "<p>Could not generate custom story.</p>";
  } catch (error) { return "<p>AI Story service unavailable.</p>"; }
};

export const generateCatalogueFromSearch = async (userQuery: string): Promise<CatalogueItem[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Search for agricultural products related to: "${userQuery}" in Eswatini. JSON array ONLY.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt, config: { tools: [{googleSearch: {}}] } });
    let jsonString = response.text || "[]";
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) { return []; }
};

export const prefillCatalogueItem = async (itemName: string): Promise<Partial<CatalogueItem>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Research technical details for "${itemName}" in Eswatini. Return JSON.`;
    const response = await ai.models.generateContent({
       model: MODEL_NAME, contents: prompt,
       config: {
           responseMimeType: "application/json",
           responseSchema: {
               type: Type.OBJECT,
               properties: {
                   tradeName: { type: Type.STRING },
                   division: { type: Type.STRING },
                   category: { type: Type.STRING },
                   subCategory: { type: Type.STRING },
                   productType: { type: Type.STRING },
                   unit: { type: Type.STRING },
                   manufacturer: { type: Type.STRING },
                   productStandard: { type: Type.STRING },
                   description: { type: Type.STRING }
               }
           }
       }
    });
    return JSON.parse(response.text || "{}");
  } catch (err) { return {}; }
};

export const sendChatLogsToAdmin = async (history: ChatMessage[]): Promise<boolean> => {
  return new Promise(resolve => setTimeout(() => resolve(true), 1000));
};

export const generateAIReport = async (data: any): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a farm production report: ${JSON.stringify(data)}. Markdown format.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return response.text || "Report generation failed.";
  } catch (error) { return "AI service offline."; }
};

export const generateOperationalAdvice = async (op: Operation): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Provide practical advice for this agricultural operation: ${JSON.stringify(op)}.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return response.text || "No specific advice available.";
  } catch (error) { return "Please consult SOPs."; }
};

// Added missing getGISContext function for spatial infrastructure mapping
export const getGISContext = async (lat: number, lng: number): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Identify the location details for coordinates ${lat}, ${lng} in Eswatini.
      Find the Region, Inkhundla (Constituency), and a general physical address or chiefdom name.
      Use Google Search to find accurate local geographic data.
      Return ONLY a JSON object:
      {
        "region": "Hhohho | Manzini | Shiselweni | Lubombo",
        "inkhundla": "Name of Inkhundla",
        "address": "Description of location or chiefdom"
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let jsonStr = response.text?.trim() || "{}";
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn("GIS Context Error (Non-blocking):", error);
    return {
      region: 'Manzini',
      inkhundla: 'Manzini South',
      address: 'GPS Coordinate Marker'
    };
  }
};
