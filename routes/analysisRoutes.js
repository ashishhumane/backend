const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const axios = require('axios')
require('dotenv').config()
const API_KEY = process.env.API_KEY


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // save to uploads folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname); // unique name
    }
});

const upload = multer({ storage });

router.post("/", upload.single("file"), async (req, res) => {
    console.log("Received file:", req.file);

    // TODO: Run your plant analysis logic here
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const imagePath = req.file.path;

    try {
        // Step 1: Convert image to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString("base64");

        // Step 2: Detect MIME type dynamically
        const mimeType =
            req.file.mimetype && req.file.mimetype.startsWith("image/")
                ? req.file.mimetype
                : "image/png";

        // Step 3: Prompt for structured JSON (Ayurvedic Plant)
        const prompt = `
    You are an expert Ayurvedic botanist.
    Analyze the uploaded plant image and return your response in STRICT JSON format only.
    Do not include explanations outside JSON. 
    Use this exact schema:

    {
  "image": string,                // URL or base64 of the plant image
  "commonName": string,
  "scientificName": string,
  "ayurvedicName": string,
  "family": string,
  "confidence": number,           // AI's confidence in identification
  "properties": [string],
  "uses": [string],
  "sideEffects": [string],
  "dosage": {                     // optional if applicable
    "tea": string,
    "powder": string,
    "extract": string,
    "fresh": string
  }
}

Example response:
{
  "image": "/uploads/1759062470314-aloevera.jpg",
  "commonName": "Aloe Vera",
  "scientificName": "Aloe barbadensis miller",
  "ayurvedicName": "Ghritkumari",
  "family": "Asphodelaceae",
  "confidence": 95,
  "properties": ["Anti-inflammatory", "Antimicrobial", "Antioxidant", "Immunomodulatory"],
  "uses": ["Heals skin conditions", "Supports digestion", "Detoxifies liver and blood", "Boosts immunity"],
  "sideEffects": ["May lower blood sugar levels", "Yellow latex acts as a strong laxative"],
  "dosage": {
    "tea": "1-2 cups daily of fresh leaf tea",
    "powder": "1/4 to 1/2 teaspoon twice daily",
    "extract": "Follow manufacturer's recommendations",
    "fresh": "5-10 fresh leaves chewed daily"
  }
}
  `;

        // Step 4: Call Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ]
            },
            { headers: { "Content-Type": "application/json" } }
        );

        // Step 5: Extract AI JSON output
        let rawText =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        let analysis;
        try {
            analysis = JSON.parse(rawText);
        } catch (e) {
            console.error("Failed to parse Gemini response:", rawText);
            analysis = { error: "Invalid JSON returned from Gemini", rawText };
        }

        // Step 6: Delete file to save space
        fs.unlinkSync(imagePath);

        // Step 7: Send JSON to frontend
        res.json({
            message: "Ayurvedic plant analysis complete",
            analysis
        });

    } catch (err) {
        console.error("Gemini analysis error:", err.response?.data || err.message);
        res.status(500).json({ error: "Error analyzing plant", details: err.response?.data });
    }
});

module.exports = router;