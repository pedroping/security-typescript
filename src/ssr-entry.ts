import crypto from "crypto";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const UglifyJS = require("uglify-js");

const app = express();
const port = 3000;

app.get("/", async (_: Request, res: Response) => {
  const nonce = crypto.randomBytes(16).toString("base64");

  fs.readFile(path.join(__dirname, "/index.html"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading HTML file:", err);
      res.sendStatus(404);
    } else {
      let htmlString = data;

      htmlString = htmlString.replace("NONCE-SCRIPT", `nonce="${nonce}"`);
      const header = `
        default-src 'self';
        script-src 'self' https://cdn.jsdelivr.net sha384-j1CDi7MgGQ12Z7Qab0qlWQ/Qqz24Gc6BM0thvEMVjHnfYGF0rmFCozFSxQBxwHKO 'nonce-${nonce}';
        style-src 'self' https://cdn.jsdelivr.net sha384-4Q6Gf2aSP4eDXB8Miphtr37CMZZQ5oXLH2yaXMJ2w8e2ZtHTl7GptT4jmndRuHDT;
        img-src 'self' data:;
        font-src 'self';
        connect-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        block-all-mixed-content;
        upgrade-insecure-requests;
      `
        .replace(/\s+/g, " ")
        .trim();
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("Content-Security-Policy", header);
      res.send(htmlString);
    }
  });
});

app.get("/dist/:fileName", async (req: Request, res: Response) => {
  const fileName = req.params["fileName"];

  fs.readFile(
    path.join(__dirname, `../dist/${fileName}`),
    "utf8",
    (err, data) => {
      if (err) {
        console.error("Error reading HTML file:", err);
        res.sendStatus(404);
      } else {
        const header = `
          default-src 'self';
          script-src 'self';
          style-src 'self';
          img-src 'self' data:;
          font-src 'self';
          connect-src 'self';
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          frame-ancestors 'none';
          block-all-mixed-content;
          upgrade-insecure-requests;
        `
          .replace(/\s+/g, " ")
          .trim();

        const codeToMinify: { [key: string]: string } = {};
        codeToMinify[fileName] = data;

        const minifyedCode = UglifyJS.minify(codeToMinify, {
          toplevel: true,
          mangle: {
            properties: true,
          },
        }).code;

        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("Content-Security-Policy", header);

        res.send(minifyedCode);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
