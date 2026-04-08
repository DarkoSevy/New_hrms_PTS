import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateExecutiveSummary = async (stats: any) => {
    try {
        const prompt = `
            As an AI Management Consultant for an HRMS system, analyze the following performance metrics and provide a concise (3-4 bullet points) executive summary for the Board of Directors. 
            Focus on trends, potential risks, and recommendations.

            Data:
            ${JSON.stringify(stats, null, 2)}

            Format the response as clear markdown bullet points. Avoid preamble.
        `;

        const result = await client.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
        });

        return result?.text || "No summary available.";
    } catch (error) {
        console.error('AI Summary Generation Error:', error);
        return "Unable to generate smart insights at this time. Please check your system configuration.";
    }
};
