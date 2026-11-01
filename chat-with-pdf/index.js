import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import "dotenv/config";
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })


const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: './uploads' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


async function createEmbeddings(text) {
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
    });
    console.log("embedding responce", response.embeddings[0].values)
    return response.embeddings[0].values
}

app.post("/upload", upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const dataBuffer = fs.readFileSync(req.file.path);

        // 1. Instantiate with an options object: { data: buffer }
        const parser = new PDFParse({ data: dataBuffer });

        // 2. Await the getText() method
        const result = await parser.getText();

        // 3. Access the text property from the result
        const text = result.text;
        // console.log(text)
        // Clean up: destroy parser and remove temp file

        await parser.destroy();
        fs.unlinkSync(req.file.path);
        const chunks = text.split('\n');
        // console.log("chunks", chunks)

        const embedding = await createEmbeddings(chunks[0])

        console.log("embedding", embedding)

        const question = req.body.question
        const matchedChunks = chunks.find((chunk) => chunk.toLocaleLowerCase().includes(question))
        console.log("matchedChunks", matchedChunks);

        const responce = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: `Answer the questions using the context: ${matchedChunks} and Question is: ${question}`,
        });

        res.json({
            matchedChunks,
            data: responce.text
        })
    } catch (error) {
        console.error("Error parsing PDF:", error);
        res.status(500).send("Error parsing PDF");
    }
});


app.get('/', (req, res) => {
    res.send(`<h1>Welcome to new learning</h1>`)
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})