import crypto from "crypto";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

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

app.get("/dist/bundle.js", async (_: Request, res: Response) => {
  fs.readFile(
    path.join(__dirname, "../dist/bundle.js"),
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
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("Content-Security-Policy", header);
        res.send(data);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
