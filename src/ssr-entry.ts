import compression from "compression";
import cors from "cors";
import crypto from "crypto";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
const UglifyJS = require("uglify-js");

const cacheVersion = crypto
  .createHmac("sha256", crypto.randomBytes(128).toString("base64"))
  .update("ProjectVersion")
  .digest("hex");

const cookieHash = crypto
  .createHmac("sha256", crypto.randomBytes(128).toString("base64"))
  .update("ProjectToken")
  .digest("hex");

console.log("Application auth: ", cookieHash);
console.log("Application version: ", cacheVersion);

const corsOptions = {
  origin: "http://localhost",
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  credentials: true,
};

const distPath = path.join(__dirname, "../dist");
const fileCache: { [key: string]: any } = {};

const jsFiles = [
  "index.bundle.js",
  "unauthorized.bundle.js",
  "cache-handle.bundle.js",
  "session-validator.bundle.js",
  "sw.bundle.js",
];

jsFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  const data = fs.readFileSync(filePath, "utf8");
  const minifiedCode = UglifyJS.minify(data, {
    toplevel: true,
    mangle: { properties: true },
  }).code;
  fileCache[file] = minifiedCode;
});

const app = express();
app.use(compression());
const port = process.env.PORT || 3000;

app.get("/", async (_: Request, res: Response) => {
  fs.readFile(path.join(__dirname, "/index.html"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading HTML file:", err);
      res.sendStatus(404);
    } else {
      let htmlString = data;

      const header = `
        script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net sha384-j1CDi7MgGQ12Z7Qab0qlWQ/Qqz24Gc6BM0thvEMVjHnfYGF0rmFCozFSxQBxwHKO;
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

      res.cookie("MyTokenAuth", cookieHash, {
        path: "/",
        httpOnly: true,
        maxAge: 2592000,
        sameSite: "none",
        secure: true,
      });

      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Content-Security-Policy", header);
      res.setHeader("x-content-type-options", "nosniff");
      res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
      res.setHeader(
        "cache-control",
        "public, max-age=31536000, s-maxage=31536000, must-revalidate"
      );

      res.send(htmlString);
    }
  });
});

app.get(
  "/dist/:fileName",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    let { fileName } = req.params;
    const cookie = req.headers?.cookie?.replace("MyTokenAuth=", "");

    if (
      fileName === "index.bundle.js" &&
      (!cookie || !cookie.includes(cookieHash))
    ) {
      fileName = "unauthorized.bundle.js";
    }

    const filePath = path.join(distPath, fileName);

    const header = `
      script-src 'self' 'unsafe-inline';
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
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    res.setHeader(
      "cache-control",
      "public, max-age=31536000, s-maxage=31536000, must-revalidate"
    );
    res.cookie("MyTokenAuth", cookieHash, {
      path: "/",
      httpOnly: true,
      maxAge: 2592000,
      sameSite: "none",
      secure: true,
    });

    if (fileCache[fileName]) {
      res.send(fileCache[fileName]);
      return;
    }

    const fileStream = fs.createReadStream(filePath);

    fileStream.on("error", (err) => {
      console.error("Error reading file:", err);
      res.sendStatus(404);
    });

    fileStream.on("open", () => {
      const fileExtension = fileName.split(".").pop();
      if (fileExtension === "js" || fileExtension === "mjs") {
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      } else if (fileExtension === "html") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }

      fileStream.pipe(res);
    });
  }
);

app.get(
  "/assets/:fileName",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    const fileName = req.params["fileName"];

    res.sendFile(path.join(__dirname, `../dist/assets/${fileName}`));
  }
);

app.get(
  "/sw.bundle.js",
  cors(corsOptions),
  async (_: Request, res: Response) => {
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
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");

    if (fileCache["sw.bundle.js"]) {      
      res.send(fileCache["sw.bundle.js"]);
      return;
    }

    res.sendFile(path.join(__dirname, `../dist/sw.bundle.js`));
  }
);

app.get("/session", cors(corsOptions), (req: Request, res: Response) => {
  const cookie = req.headers?.cookie?.replace("MyTokenAuth=", "");

  if (!cookie || !cookie.includes(cookieHash)) {
    res.sendStatus(401);
    return;
  }

  res.cookie("MyTokenAuth", cookieHash, {
    path: "/",
    httpOnly: true,
    maxAge: 2592000,
    sameSite: "none",
    secure: true,
  });

  res.status(200).send("Ok");
});

app.get("/cacheVersion", cors(corsOptions), (_: Request, res: Response) => {
  res.send(cacheVersion);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
