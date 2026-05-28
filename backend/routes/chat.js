const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const HeritageSite = require('../models/HeritageSite');
require('dotenv').config();

// Helper function to call Sarvam AI
async function callSarvamAI(message, context) {
    const apiKey = process.env.SARVAM_API_KEY;
    const urls = [
        'https://api.sarvam.ai/v1/chat/completions',
        'https://api.sarvam.ai/chat/completions'
    ];
    
    const models = ["indus-1.0", "sarvam-105b"];
    let lastError = '';

    for (const url of urls) {
        for (const model of models) {
            try {
                console.log(`Trying Sarvam AI: ${url} with ${model}`);
                const body = {
                    model: model,
                    messages: [
                        { 
                            role: "system", 
                            content: `You are a helpful assistant for "Swa Desh", a platform for Indian Heritage and Artisans. 
                            Context: ${context}. Answer concisely.` 
                        },
                        { role: "user", content: message }
                    ]
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-subscription-key': apiKey
                    },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.choices[0].message.content;
                } else {
                    const error = await response.text();
                    lastError = `${url} (${model}) failed: ${response.status} - ${error}`;
                    console.warn(lastError);
                }
            } catch (e) {
                lastError = e.message;
                console.error(`Fetch error for ${url}:`, e);
            }
        }
    }

    throw new Error(`All Sarvam attempts failed. Last error: ${lastError}`);
}

router.post('/ai', async (req, res) => {
    console.log('AI Request received:', req.body.message);
    try {
        const { message } = req.body;

        if (!process.env.SARVAM_API_KEY || process.env.SARVAM_API_KEY === "YOUR_SARVAM_API_KEY_HERE") {
            console.log('API Key missing or placeholder');
            return res.json({ 
                reply: "AI feature is almost ready! Please ensure your Sarvam AI API key is correctly set in the backend .env file." 
            });
        }

        // Fetch context from DB to make it "exact"
        const products = await Product.find().limit(10);
        const heritageSites = await HeritageSite.find().limit(10);

        const context = `
            Products: ${JSON.stringify(products.map(p => ({ name: p.name, price: p.price, description: p.description })))}
            Heritage Sites: ${JSON.stringify(heritageSites.map(h => ({ name: h.name, location: h.location, description: h.description })))}
            
            Instructions: 
            1. You are an expert for "Swa Desh".
            2. Use the data above to provide EXACT answers.
            3. Support Marathi, Hindi, and English. Respond in the SAME language as the user's question.
            4. If the data is not available, be honest but helpful.
        `;

        console.log('Calling Sarvam AI...');
        const reply = await callSarvamAI(message, context);
        console.log('Sarvam AI Reply received');
        res.json({ reply });

    } catch (err) {
        console.error('AI Error Details:', err);
        res.status(500).json({ reply: "Namaste! I'm having trouble connecting to my Sarvam AI brain right now." });
    }
});

module.exports = router;
