<div align="center">
    <img src="./public/logo.webp" alt="Logo" width="200" height="200" style="border-radius: 100%" />
</div>

# *Rep0Mind* - AI-Agent Repository Chat Interface


## 🌟 Overview

Rep0Mind is a sophisticated Intelligent Agentic AI-powered chat interface for GitHub repositories, built with [Next.js](https://nextjs.org/) and [Mastra AI](https://mastra.ai) framework. It enables intelligent conversations about repositories, providing deep insights and code understanding through advanced AI capabilities. Using tools to gather information from the repository and the internet to answer the user's query. With the help of [Mem0](https://mem0.ai), the conversation is persistent and the context is maintained.

## ✨ Features

### Core Capabilities
- 🤖 **AI-Powered Chat Interface** - Engage in meaningful conversations about repositories using advanced LLM models
- 🔄 **Real-time Streaming** - Experience fluid conversations with streaming responses and real-time updates
- 🛠️ **Intelligent Tool Integration** - Automatic tool execution for repository analysis and information retrieval
- 📊 **Rich Markdown Support** - Beautiful rendering of code blocks, tables, and other markdown elements

### Technical Features
- 🌐 **Server-Side Streaming** - Efficient handling of data streams using Next.js server components
- 💾 **Mem0 Memory Layer** - Persistent context management for improved conversation quality
- 🔍 **Semantic Search** - Advanced repository search capabilities using vector embeddings
- 🔄 **Real-time Updates** - Live updates and progress indicators during AI processing
- 🔗 **Tool calling** - Using the tools to gather information from the repository and the internet to answer the user's query

### Data Flow

<img src="./public/workflow.png" alt="Architecture" width="800" height="400" />

## 🚀 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- npm/pnpm/yarn
- A [GitHub](https://github.com/) account
- [Mem0 API key](https://docs.mem0.ai/overview)
- [Google Generative AI API key](https://ai.google.dev/gemini-api/docs/api-key) (optional, for Google LLMs) You can use any LLM of your choice

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yashskaini-coder/Rep0Mind.git
cd Rep0Mind
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your credentials:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_ai_api_key
MEM0_API_KEY=your_mem0_api_key
GITHUB_ACCESS_TOKEN=your_github_token
```

4. Start the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

## 🏗️ Architecture

The application is built using:
- **[Next.js 14](https://nextjs.org/)** - React framework for production
- **[Mastra AI](https://mastra.ai)** - TypeScript agent framework for AI features
- **[Mem0](https://mem0.ai)** - Memory layer for improved conversation quality
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Markdown](https://github.com/remarkjs/react-markdown)** - Markdown rendering with syntax highlighting

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **[Fork](https://github.com/yashksaini-coder/Rep0Mind/fork)** the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with [Mastra AI](https://mastra.ai)
- Memory Layer powered by [Mem0](https://mem0.ai)
- [Next.js](https://nextjs.org/) for the framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

<div align="center">
    Made with 🍵 using <a href="https://mastra.ai">Mastra AI</a> and <a href="https://mem0.ai">Mem0</a>
</div>