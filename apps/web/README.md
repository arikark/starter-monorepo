# Web App

This is the web application for the chat interface.

## Installation

To install the required dependencies, run:

```bash
npm install @tanstack/react-query
```

## Environment Variables

You can set up your environment variables in two ways:

### Option 1: Using the setup script

Run the setup script to create a `.env` file:

```bash
npm run setup
```

This will guide you through the process of setting up your environment variables.

### Option 2: Manual setup

Create a `.env` file in the root of the web app with the following variables:

```
# Clerk Authentication
VITE_APP_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# API URL
VITE_API_URL=http://localhost:3001
```

You can get a Clerk publishable key by signing up at [Clerk](https://clerk.dev/).

## Development

To start the development server, run:

```bash
npm run dev
```

## Features

- Chat interface with React Router 7 loaders
- TanStack Query for data fetching and state management
- Real-time chat with a backend API
- Authentication with Clerk