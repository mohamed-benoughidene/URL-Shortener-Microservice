require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const validUrl = require("valid-url");
const shortid = require("shortid");
const urlDatabase = {};

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

function validateUrl(req, res, next) {
  const { url } = req.body;
  if (!validUrl.isWebUri(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  next();
}

app.post("/api/shorturl", validateUrl, (req, res) => {
  const { url } = req.body;

  // Generate a short code using shortid
  const shortCode = shortid.generate();

  // Store the URL mapping in the database
  urlDatabase[shortCode] = url;

  // Respond with the short code
  res.json({ original_url: url, short_url: shortCode });
});

app.get("/api/shorturl/:shortCode", (req, res) => {
  const { shortCode } = req.params;

  // Check if the short code exists in the database
  if (urlDatabase.hasOwnProperty(shortCode)) {
    // Redirect to the original URL
    res.redirect(urlDatabase[shortCode]);
  } else {
    res.status(404).json({ error: "Short URL not found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
