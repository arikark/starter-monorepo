#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envPath = path.join(__dirname, ".env");

// Check if .env file already exists
if (fs.existsSync(envPath)) {
  console.log(
    "⚠️  .env file already exists. This script will not overwrite it.",
  );
  console.log(
    "If you want to update your environment variables, please edit the .env file manually.",
  );
  rl.close();
  process.exit(0);
}

console.log("🔧 Setting up environment variables for the web app");
console.log(
  "This script will create a .env file with the necessary environment variables.",
);
console.log(
  "You can get a Clerk publishable key by signing up at https://clerk.dev/",
);
console.log("");

rl.question(
  "Enter your Clerk publishable key (or press Enter to use a placeholder): ",
  (clerkKey) => {
    rl.question(
      "Enter your API URL (or press Enter to use http://localhost:3001): ",
      (apiUrl) => {
        const envContent = `# Clerk Authentication
VITE_APP_CLERK_PUBLISHABLE_KEY=${clerkKey || "pk_test_your-clerk-publishable-key"}

# API URL
VITE_API_URL=${apiUrl || "http://localhost:3001"}
`;

        fs.writeFileSync(envPath, envContent);
        console.log("");
        console.log("✅ .env file created successfully!");
        console.log(
          "You can now start the development server with: npm run dev",
        );
        rl.close();
      },
    );
  },
);
