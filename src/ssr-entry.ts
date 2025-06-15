import crypto from "crypto";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const UglifyJS = require("uglify-js");

const corsOptions = {
  origin: "http://localhost",
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};

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
        script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net sha384-j1CDi7MgGQ12Z7Qab0qlWQ/Qqz24Gc6BM0thvEMVjHnfYGF0rmFCozFSxQBxwHKO;
        style-src 'self' https://cdn.jsdelivr.net sha384-4Q6Gf2aSP4eDXB8Miphtr37CMZZQ5oXLH2yaXMJ2w8e2ZtHTl7GptT4jmndRuHDT;
        img-src 'self' data:;
        font-src 'self';
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
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Content-Security-Policy", header);
      res.setHeader("x-content-type-options", "nosniff");
      res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

      res.send(htmlString);
    }
  });
});

app.get(
  "/dist/:fileName",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    const fileName = req.params["fileName"];

    fs.readFile(
      path.join(__dirname, `../dist/${fileName}`),
      "utf8",
      (err, data) => {
        if (err) {
          console.error("Error reading HTML file:", err);
          res.sendStatus(404);
          return;
        } else {
          const header = `
          script-src 'self';
          style-src 'self';
          img-src 'self' data:;
          font-src 'self';
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

          const fileExtension = fileName.split(".");

          if (
            fileExtension[1] != "js" &&
            fileExtension[1] != "mjs" &&
            fileExtension[2] != "js" &&
            fileExtension[2] != "mjs"
          ) {
            res.send(data);
            return;
          }

          const codeToMinify: { [key: string]: string } = {};
          codeToMinify[fileName] = data;

          const minifyedCode = UglifyJS.minify(codeToMinify, {
            toplevel: true,
            mangle: {
              properties: true,
            },
          }).code;

          res.setHeader("Content-Type", "text/javascript; charset=utf-8");
          res.send(minifyedCode);
        }
      }
    );
  }
);

app.get(
  "/sw.bundle.js",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    fs.readFile(
      path.join(__dirname, `../dist/sw.bundle.js`),
      "utf8",
      (err, data) => {
        if (err) {
          console.error("Error reading HTML file:", err);
          res.sendStatus(404);
          return;
        } else {
          const header = `
          script-src 'self';
          style-src 'self';
          img-src 'self' data:;
          font-src 'self';
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

          const codeToMinify: { [key: string]: string } = {};
          codeToMinify["sw.bundle.js"] = data;

          const minifyedCode = UglifyJS.minify(codeToMinify, {
            toplevel: true,
            mangle: {
              properties: true,
            },
          }).code;

          res.setHeader("Content-Type", "text/javascript; charset=utf-8");
          res.send(minifyedCode);
        }
      }
    );
  }
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
