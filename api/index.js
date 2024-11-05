import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerDocs from "./swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.text({ type: "text/plain" }));

/**
 * @openapi
 * /oca-bundles:
 *   post:
 *     tags: [Public API]
 *     summary: Creates an OCA Bundle from an OCAfile
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: |
 *               Please provide the OCA file content as plain text to create the OCA Bundle.
 *           example: |
 *             ADD ATTRIBUTE d=Text i=Text passed=Boolean
 *
 *             ADD META en PROPS name="Entrance credential" description="Entrance credential"
 *
 *             ADD CHARACTER_ENCODING ATTRS d=utf-8 i=utf-8 passed=utf-8
 *             ADD CONFORMANCE ATTRS d=M i=M passed=M
 *             ADD LABEL en ATTRS d="Schema digest" i="Credential Issuee" passed="Passed"
 *             ADD INFORMATION en ATTRS d="Schema digest" i="Credential Issuee" passed="Enables or disables passing"
 *       name: ocafile
 *     responses:
 *       200:
 *         description: Successfully created the OCA Bundle
 */

app.post("/oca-bundles", (req, res) => {
  const ocafileContent = req.body;

  // Save the ocafile content to a temporary file
  const currentTime = new Date().toISOString().replace(/[:.]/g, "-");
  const tempFilePath = path.resolve(
    __dirname,
    `temp/temp-${currentTime}.ocafile`
  );
  fs.writeFileSync(tempFilePath, ocafileContent);

  // Path to the Rust CLI application
  const binaryPath = path.resolve(
    __dirname,
    "../target/release/ocafile-parser"
  );
  const command = `${binaryPath} --ocafile ${tempFilePath}`;

  // Call the Rust CLI application
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error: ${error.message}`);
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send(`Error: ${stderr}`);
    }

    try {
      const jsonResponse = JSON.parse(stdout);
      res.json({ bundle: jsonResponse });
    } catch (parseError) {
      console.error(`JSON parse error: ${parseError}`);
      res.status(500).send(`Error parsing JSON: ${parseError.message}`);
    }
  });
});

app.listen(port, () => {
  swaggerDocs(app, port);
  console.log(`Server is running on http://localhost:${port}`);
});
