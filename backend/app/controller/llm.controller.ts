import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateResponse = async (
    text: string,
    prompt: string
): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: prompt
         });

        const result = await model.generateContent(text);
        const response = result.response;
        const generatedText = response.text();

        return generatedText;
    } catch (error) {
        console.error("Error generating response:", error);
        throw new Error("Failed to generate response from Gemini");
    }
};

export const llmController = {
    generateResponse: async (req: any, res: any) => {
        try {
            const { text, prompt } = req.body;

            if (!text || !prompt) {
                return res.status(400).json({
                    error: "Both 'text' and 'prompt' are required",
                });
            }

            const response = await generateResponse(text, prompt);

            return res.status(200).json({
                success: true,
                response,
            });
        } catch (error) {
            return res.status(500).json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
};