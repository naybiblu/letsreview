// .scripts/discloud-upload.js
const { discloud } = require("discloud.app");
const fs = require("fs");
const path = require("path");

async function uploadToDiscloud() {
  const appId = process.env.DISCLOUD_APPID;
  const apiToken = process.env.DISCLOUD_TOKEN;
  const zipFilePath = "app.zip"; // Default to app.zip in the current dir

  if (!appId) {
    console.error("Error: DISCLOUD_APP_ID environment variable is not set.");
    process.exit(1);
  }

  if (!apiToken) {
    console.error("Error: DISCLOUD_API_TOKEN environment variable is not set.");
    process.exit(1);
  }

  if (!fs.existsSync(zipFilePath)) {
    console.error(`Error: ZIP file not found at ${zipFilePath}`);
    process.exit(1);
  }

  // Initialize Discloud with your API token
  await discloud.login(apiToken);

  console.log(`Starting upload of ${zipFilePath} to Discloud app ID: ${appId}...`);

  try {
    const fileBuffer = fs.readFileSync(zipFilePath);
    const fileName = path.basename(zipFilePath);

    const result = await discloud.apps.update(appId, {
      file: {
        data: fileBuffer,
        name: fileName, // e.g., "app.zip"
      },
    });

    console.log("Discloud API Response:", JSON.stringify(result, null, 2));

    // Check for a successful response
    // Based on typical API responses and Discloud's messages, "ok" status is a good sign.
    // The message might also indicate compilation has started.
    if (result && result.status === "ok" && result.app && result.message) {
      console.log(`Successfully initiated update for app '${result.app.name}': ${result.message}`);
    } else if (result && result.status === "error") {
      console.error(`Error updating Discloud app: ${result.message || "Unknown error from API."}`);
      process.exit(1);
    } else {
      // Fallback for unexpected response structure
      console.warn("Upload initiated, but response structure was not fully recognized. Please check Discloud dashboard.");
    }

  } catch (error) {
    console.error("Failed to upload to Discloud due to an exception:");
    console.error(error);
    process.exit(1);
  }
}

uploadToDiscloud();