const https = require("https");

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set this in your environment
const REPO_OWNER = "Akshay9845"; // Replace with your GitHub username
const REPO_NAME = "3d-ai-companion"; // Replace with your repository name
const NEW_DESCRIPTION =
  "🚀 Advanced 3D AI Avatar System with Real-time Speech Sync, Emotion Detection & 200+ Features | 820+ Research Papers Integrated";

if (!GITHUB_TOKEN) {
  console.error("Please set GITHUB_TOKEN environment variable");
  console.log("You can get a token from: https://github.com/settings/tokens");
  process.exit(1);
}

const data = JSON.stringify({
  description: NEW_DESCRIPTION,
});

const options = {
  hostname: "api.github.com",
  port: 443,
  path: `/repos/${REPO_OWNER}/${REPO_NAME}`,
  method: "PATCH",
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    "User-Agent": "Node.js",
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    if (res.statusCode === 200) {
      const result = JSON.parse(responseData);
      console.log("✅ Successfully updated GitHub repository description!");
      console.log(`New description: "${result.description}"`);
    } else {
      console.error("❌ Failed to update description");
      console.error("Status:", res.statusCode);
      console.error("Response:", responseData);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Error:", error.message);
});

req.write(data);
req.end();
