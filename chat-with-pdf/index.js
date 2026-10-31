import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';


const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: './uploads' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

        // Clean up: destroy parser and remove temp file
        await parser.destroy();
        fs.unlinkSync(req.file.path);

        res.send(text);

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