const fs = require('fs');
const path = require('path');

// 1. Define Paths
const INPUT_JSON = path.join(__dirname, '../files/ai_products_comprehensive.json');
const OUTPUT_FILE = path.join(__dirname, '../data.ts');

// 2. Load Seed Data & Schema (Mocking the parts we need to preserve)
const SEED_PRODUCTS = [
    {
        id: 'claude',
        name: 'Claude Desktop',
        companyId: 'anthropic',
        logoUrl: 'https://ui-avatars.com/api/?name=Claude&background=D97757&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'AI Assistant',
        description: 'The industry-leading AI assistant for work, capable of complex reasoning, coding, and writing with a massive context window.',
        features: ['Large Context Window', 'Coding', 'Writing', 'Analysis'],
        website: 'https://claude.ai',
        pricing: ['Free', 'Paid'],
        launchDate: '2024-06-20',
        lastUpdate: '2025-12-01',
        metrics: { totalUsers: 25000000, rating: 5, growthRate: 45 },
        tags: ['AI Assistant', 'LLM']
    },
    {
        id: 'chatgpt',
        name: 'ChatGPT',
        companyId: 'openai',
        logoUrl: 'https://ui-avatars.com/api/?name=ChatGPT&background=10a37f&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Chatbot',
        description: 'The world\'s most popular conversational AI, featuring voice mode, web browsing, and DALL-E 3 integration.',
        features: ['Voice Mode', 'Web Browsing', 'Image Gen', 'Custom GPTs'],
        website: 'https://chat.openai.com',
        pricing: ['Free', 'Paid', 'Enterprise'],
        launchDate: '2022-11-30',
        lastUpdate: '2025-01-10',
        metrics: { totalUsers: 180000000, rating: 4.8, growthRate: 15 },
        tags: ['Chatbot', 'LLM', 'Standard']
    },
    {
        id: 'gemini',
        name: 'Gemini',
        companyId: 'google',
        logoUrl: 'https://ui-avatars.com/api/?name=Gemini&background=4285F4&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Chatbot',
        description: 'Google’s most capable and general model, built to be multimodal from the ground up and integrated with Workspace.',
        features: ['Multimodal', 'Google Workspace', 'Large Context', 'Code'],
        website: 'https://gemini.google.com',
        pricing: ['Free', 'Paid'],
        launchDate: '2023-12-06',
        lastUpdate: '2025-02-15',
        metrics: { totalUsers: 100000000, rating: 4.7, growthRate: 25 },
        tags: ['Chatbot', 'Google']
    },
    {
        id: 'perplexity',
        name: 'Perplexity',
        companyId: 'perplexity',
        logoUrl: 'https://ui-avatars.com/api/?name=Perplexity&background=115e59&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Conversational AI',
        description: 'An AI-powered answer engine that cites sources and provides real-time information from the web.',
        features: ['Citations', 'Real-time Search', 'Pro Search', 'File Upload'],
        website: 'https://perplexity.ai',
        pricing: ['Free', 'Paid'],
        launchDate: '2022-12-01',
        lastUpdate: '2025-01-20',
        metrics: { totalUsers: 15000000, rating: 4.8, growthRate: 120 },
        tags: ['Search', 'Research']
    },
    {
        id: 'character-ai',
        name: 'Character.ai',
        companyId: 'character-ai',
        logoUrl: 'https://ui-avatars.com/api/?name=Character&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Chatbot',
        description: 'Chat with open-ended AI characters that feel alive. Create your own characters or chat with user-created ones.',
        features: ['Persona Creation', 'Roleplay', 'Voice', 'Community'],
        website: 'https://character.ai',
        pricing: ['Free', 'Paid'],
        launchDate: '2022-09-01',
        lastUpdate: '2025-03-01',
        metrics: { totalUsers: 20000000, rating: 4.6, growthRate: 60 },
        tags: ['Fun', 'Social']
    },
    {
        id: 'poe',
        name: 'Poe',
        companyId: 'quora',
        logoUrl: 'https://ui-avatars.com/api/?name=Poe&background=B91C1C&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Chatbot',
        description: 'Fast, helpful AI chat. Access the best models from OpenAI, Anthropic, Google, and Meta in one place.',
        features: ['Multi-model Access', 'Bot Creation', 'Monetization'],
        website: 'https://poe.com',
        pricing: ['Free', 'Paid'],
        launchDate: '2023-02-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 5000000, rating: 4.7, growthRate: 40 },
        tags: ['Aggregator', 'Chatbot']
    },
    {
        id: 'notion-ai',
        name: 'Notion AI',
        companyId: 'notion',
        logoUrl: 'https://ui-avatars.com/api/?name=Notion&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'Access the limitless power of AI, right inside Notion. Summarize, write, and extract insights from your notes.',
        features: ['Q&A', 'Autofill', 'Summarization', 'Translation'],
        website: 'https://notion.so',
        pricing: ['Paid'],
        launchDate: '2023-02-22',
        lastUpdate: '2024-04-01',
        metrics: { totalUsers: 35000000, rating: 4.8, growthRate: 20 },
        tags: ['Workspace', 'Docs']
    },
    {
        id: 'midjourney-v6',
        name: 'Midjourney',
        companyId: 'midjourney',
        logoUrl: 'https://ui-avatars.com/api/?name=Midjourney&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Image Generation',
        description: 'Renowned for the highest aesthetic quality and photorealism in AI image generation.',
        features: ['High Fidelity', 'Discord', 'Art'],
        website: 'https://midjourney.com',
        pricing: ['Paid'],
        launchDate: '2022-07-12',
        lastUpdate: '2025-02-15',
        metrics: { totalUsers: 16000000, rating: 4.9, growthRate: 10 },
        tags: ['Image Generation', 'Art']
    },
    {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        companyId: 'elevenlabs',
        logoUrl: 'https://ui-avatars.com/api/?name=ElevenLabs&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Text-To-Speech',
        description: 'The standard for natural-sounding AI speech synthesis and voice cloning.',
        features: ['Voice Cloning', 'Dubbing', 'API'],
        website: 'https://elevenlabs.io',
        pricing: ['Freemium'],
        launchDate: '2022-08-01',
        lastUpdate: '2025-05-10',
        metrics: { totalUsers: 5000000, rating: 4.9, growthRate: 120 },
        tags: ['Text-To-Speech', 'Audio']
    },

    // --- NO-CODE TOOLS ---
    {
        id: 'bubble',
        name: 'Bubble',
        companyId: 'bubble',
        logoUrl: 'https://ui-avatars.com/api/?name=Bubble&background=242424&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'The standard for building full-stack web applications without code. Drag-and-drop interface with full database and API capabilities.',
        features: ['Full Stack', 'Database', 'API Integration', 'Responsive'],
        website: 'https://bubble.io',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2012-01-01',
        lastUpdate: '2025-02-10',
        metrics: { totalUsers: 4000000, rating: 4.6, growthRate: 25 },
        tags: ['Web App', 'No-Code']
    },
    {
        id: 'softr',
        name: 'Softr',
        companyId: 'softr',
        logoUrl: 'https://ui-avatars.com/api/?name=Softr&background=3453E8&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'Build client portals, internal tools, and SaaS apps from Airtable or Google Sheets in minutes.',
        features: ['Client Portals', 'Internal Tools', 'Airtable Sync', 'Permissions'],
        website: 'https://softr.io',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2020-08-01',
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 500000, rating: 4.8, growthRate: 80 },
        tags: ['Internal Tools', 'Portals']
    },
    {
        id: 'flutterflow',
        name: 'FlutterFlow',
        companyId: 'flutterflow',
        logoUrl: 'https://ui-avatars.com/api/?name=FlutterFlow&background=4B39EF&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'Build native mobile applications visually using Flutter. Export clean code or deploy directly to app stores.',
        features: ['Native Mobile', 'Flutter', 'Code Export', 'Firebase'],
        website: 'https://flutterflow.io',
        pricing: ['Free', 'Paid'],
        launchDate: '2020-10-01',
        lastUpdate: '2025-03-01',
        metrics: { totalUsers: 1200000, rating: 4.7, growthRate: 100 },
        tags: ['Mobile', 'App Builder']
    },
    {
        id: 'zapier',
        name: 'Zapier',
        companyId: 'zapier',
        logoUrl: 'https://ui-avatars.com/api/?name=Zapier&background=FF4F00&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Automation',
        description: 'The leader in workflow automation. Connect your apps and automate workflows without writing code.',
        features: ['Workflow Automation', 'Integration', 'Zaps', 'AI Actions'],
        website: 'https://zapier.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2011-08-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 10000000, rating: 4.8, growthRate: 20 },
        tags: ['Automation', 'Workflow']
    },
    {
        id: 'make',
        name: 'Make',
        companyId: 'make',
        logoUrl: 'https://ui-avatars.com/api/?name=Make&background=6815F5&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Automation',
        description: 'Visual platform to design, build, and automate anything from tasks to complex workflows (formerly Integromat).',
        features: ['Visual Canvas', 'Complex Workflows', 'Scenarios', 'API'],
        website: 'https://make.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2016-01-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 2000000, rating: 4.9, growthRate: 40 },
        tags: ['Automation', 'Visual']
    },
    // --- DATA MANAGEMENT (VECTOR DBs) ---
    {
        id: 'pinecone',
        name: 'Pinecone',
        companyId: 'pinecone',
        logoUrl: 'https://ui-avatars.com/api/?name=Pinecone&background=101828&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Data Management',
        description: 'The managed vector database for high-scale AI applications. Fast, scalable, and easy to use for semantic search.',
        features: ['Managed Service', 'High Scale', 'Low Latency', 'Filtering'],
        website: 'https://pinecone.io',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2019-01-01',
        lastUpdate: '2025-01-20',
        metrics: { totalUsers: 100000, rating: 4.7, growthRate: 150 },
        tags: ['Vector DB', 'Search']
    },
    {
        id: 'weaviate',
        name: 'Weaviate',
        companyId: 'weaviate',
        logoUrl: 'https://ui-avatars.com/api/?name=Weaviate&background=FA00FF&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Data Management',
        description: 'An open-source vector search engine. Stores both objects and vectors, allowing for combining vector search with structured filtering.',
        features: ['Open Source', 'Hybrid Search', 'Modules', 'GraphQL'],
        website: 'https://weaviate.io',
        pricing: ['Open Source', 'Cloud'],
        launchDate: '2019-03-01',
        lastUpdate: '2025-02-15',
        metrics: { totalUsers: 80000, rating: 4.8, growthRate: 130 },
        tags: ['Vector DB', 'Open Source']
    },
    {
        id: 'chroma',
        name: 'Chroma',
        companyId: 'chroma',
        logoUrl: 'https://ui-avatars.com/api/?name=Chroma&background=FE7D37&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Data Management',
        description: 'The AI-native open-source embedding database. Simple to set up and integrates perfectly with LangChain and LlamaIndex.',
        features: ['Open Source', 'Simple API', 'Embeddings', 'Local Storage'],
        website: 'https://trychroma.com',
        pricing: ['Open Source', 'Hosted'],
        launchDate: '2023-02-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 150000, rating: 4.9, growthRate: 300 },
        tags: ['Approachable', 'Embeddings']
    },
    {
        id: 'milvus',
        name: 'Milvus',
        companyId: 'zilliz',
        logoUrl: 'https://ui-avatars.com/api/?name=Milvus&background=00A1EA&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Data Management',
        description: 'A cloud-native, open-source vector database built for scalable similarity search.',
        features: ['Cloud Native', 'Scalable', 'High Availability', 'Kubernetes'],
        website: 'https://milvus.io',
        pricing: ['Open Source', 'Paid'],
        launchDate: '2019-10-01',
        lastUpdate: '2025-01-10',
        metrics: { totalUsers: 70000, rating: 4.7, growthRate: 90 },
        tags: ['Scalable', 'Enterprise']
    },
    // --- GENERATIVE VIDEO ---
    {
        id: 'runway',
        name: 'Runway',
        companyId: 'runway',
        logoUrl: 'https://ui-avatars.com/api/?name=Runway&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Generative Video',
        description: 'Applied AI research used to build the next generation of art and creativity tools. Famous for Gen-2 and Gen-3 text-to-video.',
        features: ['Gen-3 Alpha', 'Text to Video', 'Video Editing', 'Inpainting'],
        website: 'https://runwayml.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2018-12-01',
        lastUpdate: '2025-02-28',
        metrics: { totalUsers: 5000000, rating: 4.8, growthRate: 150 },
        tags: ['Video Gen', 'Creative']
    },
    {
        id: 'pika',
        name: 'Pika',
        companyId: 'pika',
        logoUrl: 'https://ui-avatars.com/api/?name=Pika&background=FFD700&color=000&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Generative Video',
        description: 'An idea-to-video platform that brings your creativity to motion. Known for high quality and smooth motion.',
        features: ['Idea to Video', 'Animation', 'Lip Sync', 'Sound Effects'],
        website: 'https://pika.art',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2023-11-28',
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 2000000, rating: 4.7, growthRate: 200 },
        tags: ['Animation', 'Social']
    },
    {
        id: 'luma-dream-machine',
        name: 'Luma Dream Machine',
        companyId: 'luma',
        logoUrl: 'https://ui-avatars.com/api/?name=Luma&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Generative Video',
        description: 'High-quality AI video generation model capable of creating 5-second realistic shots from text and images.',
        features: ['Realistic', 'Text to Video', 'Image to Video', 'Fast Generation'],
        website: 'https://lumalabs.ai/dream-machine',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2024-06-12',
        lastUpdate: '2025-01-20',
        metrics: { totalUsers: 1500000, rating: 4.6, growthRate: 250 },
        tags: ['Realistic', 'Cinematic']
    },
    {
        id: 'heygen',
        name: 'HeyGen',
        companyId: 'heygen',
        logoUrl: 'https://ui-avatars.com/api/?name=HeyGen&background=2E3A59&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Generative Video',
        description: 'The best AI video generation platform for business teams. Create engaging videos with generative AI avatars.',
        features: ['AI Avatars', 'Voice Cloning', 'Video Translation', 'Templates'],
        website: 'https://heygen.com',
        pricing: ['Paid'],
        launchDate: '2022-07-28',
        lastUpdate: '2025-02-10',
        metrics: { totalUsers: 3000000, rating: 4.8, growthRate: 180 },
        tags: ['Business', 'Avatars']
    },
    // --- LOW-CODE TOOLS ---
    {
        id: 'google-antigravity',
        name: 'Google Antigravity',
        companyId: 'google',
        logoUrl: 'https://ui-avatars.com/api/?name=Antigravity&background=4285F4&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'Google DeepMind\'s advanced agentic coding assistant for complex software engineering tasks.',
        features: ['Agentic Coding', 'Deep Analysis', 'Autonomous', 'Google Ecosystem'],
        website: 'https://deepmind.google/technologies/gemini',
        pricing: ['Paid'],
        launchDate: '2024-12-06',
        lastUpdate: '2025-03-15',
        metrics: { totalUsers: 5000000, rating: 5.0, growthRate: 500 },
        tags: ['Low-Code', 'Agent', 'Google']
    },
    {
        id: 'claude-code',
        name: 'Claude Code',
        companyId: 'anthropic',
        logoUrl: 'https://ui-avatars.com/api/?name=Claude&background=D97757&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'Anthropic\'s CLI tool that brings the power of Claude 3.7 directly into your development workflow.',
        features: ['CLI', 'Agentic', 'Terminal Integration', 'Safe Execution'],
        website: 'https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview',
        pricing: ['Paid'],
        launchDate: '2024-11-25',
        lastUpdate: '2025-02-15',
        metrics: { totalUsers: 1000000, rating: 4.9, growthRate: 200 },
        tags: ['Low-Code', 'CLI', 'Agent']
    },
    {
        id: 'amazon-q-developer',
        name: 'Amazon Q Developer',
        companyId: 'amazon',
        logoUrl: 'https://ui-avatars.com/api/?name=Q&background=FF9900&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'Your AI-powered assistant for software development, formerly CodeWhisperer. coding, testing, and upgrading applications.',
        features: ['AWS Integration', 'Code Generation', 'Security Scans', 'IDE Support'],
        website: 'https://aws.amazon.com/q/developer/',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2023-04-13',
        lastUpdate: '2025-03-01',
        metrics: { totalUsers: 5000000, rating: 4.6, growthRate: 80 },
        tags: ['Low-Code', 'AWS', 'Security']
    },
    {
        id: 'github-copilot',
        name: 'GitHub Copilot',
        companyId: 'microsoft',
        logoUrl: 'https://ui-avatars.com/api/?name=Copilot&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'The world\'s most widely adopted AI developer tool. Turn natural language prompts into coding suggestions.',
        features: ['Autocomplete', 'Chat', 'Pull Requests', 'IDE Integration'],
        website: 'https://github.com/features/copilot',
        pricing: ['Paid', 'Business'],
        launchDate: '2021-06-29',
        lastUpdate: '2025-02-27',
        metrics: { totalUsers: 20000000, rating: 4.8, growthRate: 50 },
        tags: ['Low-Code', 'Standard', 'Completion']
    },
    {
        id: 'windsurf',
        name: 'Windsurf',
        companyId: 'codeium',
        logoUrl: 'https://ui-avatars.com/api/?name=Windsurf&background=00A1EA&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'The first agentic IDE. Windsurf flows with you, thinking ahead and understanding your entire codebase.',
        features: ['Flows', 'Deep Context', 'Agentic IDE', 'Codeium'],
        website: 'https://codeium.com/windsurf',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2024-01-01',
        lastUpdate: '2025-02-20',
        metrics: { totalUsers: 500000, rating: 4.9, growthRate: 300 },
        tags: ['Low-Code', 'IDE', 'Agent']
    },
    {
        id: 'cursor',
        name: 'Cursor',
        companyId: 'cursor',
        logoUrl: 'https://ui-avatars.com/api/?name=Cursor&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'The AI code editor built for pair programming. Auto-debugs, rewrites code, and answers questions about your codebase.',
        features: ['Fork of VS Code', 'Privacy Mode', ' codebase indexing', 'Copilot++'],
        website: 'https://cursor.sh',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2023-01-01',
        lastUpdate: '2025-12-11',
        metrics: { totalUsers: 2000000, rating: 4.9, growthRate: 400 },
        tags: ['Low-Code', 'IDE', 'Editor']
    },
    {
        id: 'cline',
        name: 'Cline',
        companyId: 'cline',
        logoUrl: 'https://ui-avatars.com/api/?name=Cline&background=333&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'An autonomous coding agent that lives in your IDE. Checks for errors, fixes bugs, and implements features.',
        features: ['Autonomous', 'VS Code Extension', 'Task Completion'],
        website: 'https://cline.bot', // Hypothetical URL based on typical naming
        pricing: ['Open Source', 'Freemium'],
        launchDate: '2024-05-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 100000, rating: 4.7, growthRate: 150 },
        tags: ['Low-Code', 'Agent', 'Open Source']
    },
    {
        id: 'replit',
        name: 'Replit',
        companyId: 'replit',
        logoUrl: 'https://ui-avatars.com/api/?name=Replit&background=F26202&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'Collaborative browser-based IDE with huge AI powers. Build, test, and deploy software directly from your browser.',
        features: ['Browser IDE', 'Multiplayer', 'Ghostwriter', 'Deployment'],
        website: 'https://replit.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2016-01-01',
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 25000000, rating: 4.7, growthRate: 30 },
        tags: ['Low-Code', 'Cloud IDE', 'Education']
    },
    {
        id: 'aider',
        name: 'Aider',
        companyId: 'aider',
        logoUrl: 'https://ui-avatars.com/api/?name=Aider&background=10B981&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'AI pair programming in your terminal. Aider lets you pair program with LLMs, editing code in your local git repo.',
        features: ['CLI', 'Git Integration', 'Broad LLM Support', 'Voice'],
        website: 'https://aider.chat',
        pricing: ['Open Source'],
        launchDate: '2023-06-01',
        lastUpdate: '2025-03-01',
        metrics: { totalUsers: 200000, rating: 4.9, growthRate: 200 },
        tags: ['Low-Code', 'CLI', 'Open Source']
    },
    {
        id: 'codex',
        name: 'OpenAI Codex',
        companyId: 'openai',
        logoUrl: 'https://ui-avatars.com/api/?name=Codex&background=10a37f&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'The AI model powering GitHub Copilot, capable of translating natural language to code in more than a dozen languages.',
        features: ['Code Generation', 'Translation', 'Documentation', 'Refactoring'],
        website: 'https://openai.com/blog/openai-codex',
        pricing: ['Paid'],
        launchDate: '2021-08-10',
        lastUpdate: '2025-05-01',
        metrics: { totalUsers: 5000000, rating: 4.6, growthRate: 10 },
        tags: ['Low-Code', 'Model', 'API']
    },
    {
        id: 'devin',
        name: 'Devin',
        companyId: 'cognition',
        logoUrl: 'https://ui-avatars.com/api/?name=Devin&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'The first fully autonomous AI software engineer. Plans and executes complex engineering tasks requiring thousands of decisions.',
        features: ['Autonomous', 'Planning', 'Execution', 'Learning'],
        website: 'https://www.cognition-labs.com/introducing-devin',
        pricing: ['Paid'],
        launchDate: '2024-03-12',
        lastUpdate: '2025-04-03',
        metrics: { totalUsers: 50000, rating: 4.8, growthRate: 500 },
        tags: ['Low-Code', 'Autonomous', 'Agent']
    },
    // --- NO-CODE EXPANSION ---
    {
        id: 'google-ai-studio',
        name: 'Google AI Studio',
        companyId: 'google',
        logoUrl: 'https://ui-avatars.com/api/?name=AI+Studio&background=4285F4&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'The fastest way to build with Gemini models. Prototype prompts and create API keys in minutes.',
        features: ['Prompting', 'Gemini Models', 'API Keys', 'Prototyping'],
        website: 'https://aistudio.google.com',
        pricing: ['Free', 'Paid'],
        launchDate: '2023-12-13',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 2000000, rating: 4.8, growthRate: 100 },
        tags: ['No-Code', 'Prototyping', 'Google']
    },
    {
        id: 'base44',
        name: 'Base44',
        companyId: 'base44',
        logoUrl: 'https://ui-avatars.com/api/?name=Base44&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'AI-native app builder. Build scalable internal tools and customer-facing apps 10x faster.',
        features: ['AI-Native', 'Internal Tools', 'Database', 'Auth'],
        website: 'https://base44.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2024-01-01', // Estimated
        lastUpdate: '2025-06-01',
        metrics: { totalUsers: 50000, rating: 4.7, growthRate: 150 },
        tags: ['No-Code', 'App Builder']
    },
    {
        id: 'lovable',
        name: 'Lovable',
        companyId: 'lovable',
        logoUrl: 'https://ui-avatars.com/api/?name=Lovable&background=FF5A5F&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'GPT-4 powered full-stack app builder. Describe your app and Lovable builds it with React, Supabase, and Tailwind.',
        features: ['Text to App', 'React', 'Supabase', 'Tailwind'],
        website: 'https://lovable.dev',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2024-08-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 100000, rating: 4.8, growthRate: 300 },
        tags: ['No-Code', 'Full Stack', 'AI Builder']
    },
    {
        id: 'figma',
        name: 'Figma',
        companyId: 'figma',
        logoUrl: 'https://ui-avatars.com/api/?name=Figma&background=F24E1E&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'The collaborative interface design tool. Now with AI design features that generate layouts and components instantly.',
        features: ['Design Systems', 'Prototyping', 'Dev Mode', 'AI'],
        website: 'https://figma.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2016-09-27',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 20000000, rating: 4.9, growthRate: 15 },
        tags: ['Design', 'No-Code', 'Prototyping']
    },
    {
        id: 'amazon-partyrock',
        name: 'Amazon PartyRock',
        companyId: 'amazon',
        logoUrl: 'https://ui-avatars.com/api/?name=PartyRock&background=D13212&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'Build AI apps without code in minutes. An Amazon Bedrock playground for everyone to create generative AI apps.',
        features: ['App Builder', 'Bedrock', 'Playground', 'Remixing'],
        website: 'https://partyrock.aws',
        pricing: ['Free'],
        launchDate: '2023-11-01',
        lastUpdate: '2024-12-01',
        metrics: { totalUsers: 500000, rating: 4.7, growthRate: 120 },
        tags: ['No-Code', 'App Builder', 'AWS']
    },
    {
        id: 'n8n',
        name: 'n8n',
        companyId: 'n8n',
        logoUrl: 'https://ui-avatars.com/api/?name=n8n&background=FF6D5A&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'Workflow automation for technical people. Fair-code distribution automation tool that allows you to self-host.',
        features: ['Workflow Automation', 'Self-Hostable', 'Node-based', 'Integrations'],
        website: 'https://n8n.io',
        pricing: ['Free', 'Paid'],
        launchDate: '2019-10-01',
        lastUpdate: '2025-08-01',
        metrics: { totalUsers: 1000000, rating: 4.8, growthRate: 80 },
        tags: ['No-Code', 'Automation', 'Workflow']
    },
    // --- COMPREHENSIVE AUDIT EXPANSION ---
    {
        id: 'kiro',
        name: 'Kiro',
        companyId: 'amazon',
        logoUrl: 'https://ui-avatars.com/api/?name=Kiro&background=FF9900&color=000&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'Low-Code',
        description: 'Amazon\'s spec-driven AI editor that turns prompts into production-ready code using agentic workflows.',
        features: ['Spec-Driven', 'Agentic', 'Amazon Q', 'VS Code Base'],
        website: 'https://kiro.dev',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2024-12-01',
        lastUpdate: '2025-03-01',
        metrics: { totalUsers: 200000, rating: 4.7, growthRate: 500 },
        tags: ['Low-Code', 'IDE', 'Agent', 'Amazon']
    },
    {
        id: 'manus',
        name: 'Manus',
        companyId: 'manus',
        logoUrl: 'https://ui-avatars.com/api/?name=Manus&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'AI Assistant',
        description: 'A true AI agent that plans and executes complex tasks autonomously, going beyond simple chat.',
        features: ['Autonomous', 'Planning', 'Execution', 'Reasoning'],
        website: 'https://manus.ai',
        pricing: ['Paid'],
        launchDate: '2025-01-01',
        lastUpdate: '2025-04-01',
        metrics: { totalUsers: 50000, rating: 4.9, growthRate: 200 },
        tags: ['Agent', 'Productivity']
    },
    {
        id: 'gumloop',
        name: 'Gumloop',
        companyId: 'gumloop',
        logoUrl: 'https://ui-avatars.com/api/?name=Gumloop&background=FF00FF&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Development & Data',
        subCategory: 'No-Code',
        description: 'The no-code AI automation platform. Connect LLMs to your data and workflows without writing a single line of code.',
        features: ['No-Code', 'Automation', 'LLM Integration', 'Workflows'],
        website: 'https://gumloop.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2023-11-01',
        lastUpdate: '2025-02-15',
        metrics: { totalUsers: 80000, rating: 4.8, growthRate: 150 },
        tags: ['No-Code', 'Automation']
    },
    {
        id: 'notebooklm',
        name: 'NotebookLM',
        companyId: 'google',
        logoUrl: 'https://ui-avatars.com/api/?name=NotebookLM&background=4285F4&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Education',
        description: 'Google\'s personalized research assistant. Upload your documents and get instant answers, summaries, and audio overviews.',
        features: ['RAG', 'Audio Overview', 'Source Citations', 'Research'],
        website: 'https://notebooklm.google.com',
        pricing: ['Free'],
        launchDate: '2023-12-08',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 5000000, rating: 4.9, growthRate: 300 },
        tags: ['Research', 'Study', 'Google']
    },
    {
        id: 'suno',
        name: 'Suno',
        companyId: 'suno',
        logoUrl: 'https://ui-avatars.com/api/?name=Suno&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Content Creation',
        description: 'Create professional-quality songs with vocals and lyrics from a simple text prompt.',
        features: ['Text to Music', 'Vocals', 'Lyrics', 'Full Songs'],
        website: 'https://suno.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2023-12-20',
        lastUpdate: '2025-03-01',
        metrics: { totalUsers: 10000000, rating: 4.8, growthRate: 400 },
        tags: ['Music', 'Audio', 'Creative']
    },
    {
        id: 'udio',
        name: 'Udio',
        companyId: 'udio',
        logoUrl: 'https://ui-avatars.com/api/?name=Udio&background=FF4500&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Content Creation',
        description: 'Generate amazing music in seconds. Udio allows for high-fidelity music creation with extensive control.',
        features: ['High Fidelity', 'Music Gen', 'Control', 'Remix'],
        website: 'https://udio.com',
        pricing: ['Free', 'Paid'],
        launchDate: '2024-04-10',
        lastUpdate: '2025-02-15',
        metrics: { totalUsers: 5000000, rating: 4.7, growthRate: 350 },
        tags: ['Music', 'Audio']
    },
    {
        id: 'descript',
        name: 'Descript',
        companyId: 'descript',
        logoUrl: 'https://ui-avatars.com/api/?name=Descript&background=111&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Video Editing',
        description: 'There\'s a new way to make video and podcasts. Descript turns video editing into text editing.',
        features: ['Text-Based Editing', 'Overdub', 'Studio Sound', 'transcription'],
        website: 'https://descript.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2017-12-01',
        lastUpdate: '2025-01-10',
        metrics: { totalUsers: 2000000, rating: 4.8, growthRate: 40 },
        tags: ['Video', 'Podcasting', 'Audio']
    },
    {
        id: 'deepl',
        name: 'DeepL',
        companyId: 'deepl',
        logoUrl: 'https://ui-avatars.com/api/?name=DeepL&background=0F2B46&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'The world\'s most accurate translator. DeepL captures the nuance effectively for professional use.',
        features: ['Translation', 'Write Improve', 'API', 'Docs'],
        website: 'https://deepl.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2017-08-28',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 100000000, rating: 4.9, growthRate: 20 },
        tags: ['Translation', 'Language']
    },
    {
        id: 'sanebox',
        name: 'SaneBox',
        companyId: 'sanebox',
        logoUrl: 'https://ui-avatars.com/api/?name=SaneBox&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'AI that cleans up your inbox. SaneBox identifies important emails and hides distractions.',
        features: ['Inbox Zero', 'Filtering', 'Do Not Disturb', 'Reminders'],
        website: 'https://sanebox.com',
        pricing: ['Paid'],
        launchDate: '2010-01-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 500000, rating: 4.7, growthRate: 10 },
        tags: ['Email', 'Productivity']
    },
    {
        id: 'reclaim-ai',
        name: 'Reclaim.ai',
        companyId: 'reclaim',
        logoUrl: 'https://ui-avatars.com/api/?name=Reclaim&background=3F51B5&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Project Management',
        description: 'Smart calendar assistant that automatically blocks time for your tasks, habits, and breaks.',
        features: ['Time Blocking', 'Habits', 'Sync', 'Scheduling'],
        website: 'https://reclaim.ai',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2019-01-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 200000, rating: 4.8, growthRate: 60 },
        tags: ['Calendar', 'Scheduling']
    },
    {
        id: 'krisp',
        name: 'Krisp',
        companyId: 'krisp',
        logoUrl: 'https://ui-avatars.com/api/?name=Krisp&background=FFF&color=000&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'AI-powered voice clarity and meeting assistant. Removes background noise and provides transcriptions.',
        features: ['Noise Cancellation', 'Transcription', 'Meeting Notes', 'Echo Removal'],
        website: 'https://krisp.ai',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2018-01-01',
        lastUpdate: '2025-01-20',
        metrics: { totalUsers: 1000000, rating: 4.8, growthRate: 30 },
        tags: ['Audio', 'Meetings']
    },
    {
        id: 'gamma',
        name: 'Gamma',
        companyId: 'gamma',
        logoUrl: 'https://ui-avatars.com/api/?name=Gamma&background=6141D3&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'A new medium for presenting ideas. Create beautiful presentations, documents, and webpages with AI.',
        features: ['Presentations', 'Docs', 'Webpages', 'AI Design'],
        website: 'https://gamma.app',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2022-08-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 5000000, rating: 4.8, growthRate: 150 },
        tags: ['Presentations', 'Design']
    },
    {
        id: 'tome',
        name: 'Tome',
        companyId: 'tome',
        logoUrl: 'https://ui-avatars.com/api/?name=Tome&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'The AI-powered storytelling format. Unlock your best work with Tome\'s generative storytelling features.',
        features: ['Storytelling', 'Presentations', 'Generative', 'Interactive'],
        website: 'https://tome.app',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2022-09-01',
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 8000000, rating: 4.7, growthRate: 100 },
        tags: ['Storytelling', 'Presentations']
    },
    {
        id: 'synthesia',
        name: 'Synthesia',
        companyId: 'synthesia',
        logoUrl: 'https://ui-avatars.com/api/?name=Synthesia&background=212E3B&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Generative Video',
        description: 'The #1 AI video generation platform. Turn text into video with realistic AI avatars in minutes.',
        features: ['AI Avatars', 'Text to Video', 'Multi-language', 'Enterprise'],
        website: 'https://synthesia.io',
        pricing: ['Paid'],
        launchDate: '2017-01-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 1000000, rating: 4.8, growthRate: 60 },
        tags: ['Video', 'Avatars', 'Business']
    },
    {
        id: 'otter-ai',
        name: 'Otter.ai',
        companyId: 'otter',
        logoUrl: 'https://ui-avatars.com/api/?name=Otter&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'Your AI meeting assistant. Record, transcribe, capture slides, and generate summaries in real time.',
        features: ['Transcription', 'Meeting Summaries', 'Slide Capture', 'Chat'],
        website: 'https://otter.ai',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2016-01-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 10000000, rating: 4.7, growthRate: 20 },
        tags: ['Meetings', 'Transcription']
    },
    {
        id: 'fireflies',
        name: 'Fireflies',
        companyId: 'fireflies',
        logoUrl: 'https://ui-avatars.com/api/?name=Fireflies&background=1C1456&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'Automate your meeting notes. Fireflies.ai helps your team record, transcribe, search, and analyze voice conversations.',
        features: ['Meeting Notes', 'Transcription', 'Analysis', 'Integration'],
        website: 'https://fireflies.ai',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2016-01-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 2000000, rating: 4.7, growthRate: 40 },
        tags: ['Meetings', 'Transcription']
    },
    {
        id: 'beautiful-ai',
        name: 'Beautiful.ai',
        companyId: 'beautiful-ai',
        logoUrl: 'https://ui-avatars.com/api/?name=Beautiful&background=0091EA&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Productivity & Assistants',
        subCategory: 'Productivity',
        description: 'The first presentation software that designs for you. Create stunning presentations in minutes with AI.',
        features: ['Smart Slides', 'Design', 'Templates', 'Team'],
        website: 'https://beautiful.ai',
        pricing: ['Paid'],
        launchDate: '2018-01-01',
        lastUpdate: '2025-01-10',
        metrics: { totalUsers: 1500000, rating: 4.7, growthRate: 25 },
        tags: ['Presentations', 'Design']
    },
    {
        id: 'copy-ai',
        name: 'Copy.ai',
        companyId: 'copy-ai',
        logoUrl: 'https://ui-avatars.com/api/?name=Copy&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Marketing',
        description: 'The GTM AI platform. Copy.ai helps marketing and sales teams generate high-converting content at scale.',
        features: ['Copywriting', 'Workflows', 'SEO', 'Email'],
        website: 'https://copy.ai',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2020-10-01',
        lastUpdate: '2025-02-28',
        metrics: { totalUsers: 8000000, rating: 4.8, growthRate: 50 },
        tags: ['Marketing', 'Copywriting']
    },
    {
        id: 'anyword',
        name: 'Anyword',
        companyId: 'anyword',
        logoUrl: 'https://ui-avatars.com/api/?name=Anyword&background=3F51B5&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Marketing',
        description: 'The AI writing platform built for marketing performance. Predicts how well your copy will perform before you publish.',
        features: ['Performance Prediction', 'Copywriting', 'Brand Voice', 'Scoring'],
        website: 'https://anyword.com',
        pricing: ['Paid'],
        launchDate: '2013-01-01', // Rebranded later
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 1000000, rating: 4.8, growthRate: 40 },
        tags: ['Marketing', 'Performance']
    },
    // --- BUSINESS & OPERATIONS EXPANSION (Sales, HR, Finance) ---
    {
        id: 'gong',
        name: 'Gong',
        companyId: 'gong',
        logoUrl: 'https://ui-avatars.com/api/?name=Gong&background=612F91&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Sales',
        description: 'The Revenue Intelligence platform. Gong captures your customer interactions and provides insights to close more deals.',
        features: ['Revenue Intelligence', 'Call Recording', 'Analysis', 'Forecasting'],
        website: 'https://gong.io',
        pricing: ['Paid'],
        launchDate: '2015-01-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 3000000, rating: 4.8, growthRate: 50 },
        tags: ['Sales', 'Intelligence']
    },
    {
        id: 'salesforce-einstein',
        name: 'Salesforce Einstein',
        companyId: 'salesforce',
        logoUrl: 'https://ui-avatars.com/api/?name=Einstein&background=00A1E0&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Sales',
        description: 'AI for CRM. Einstein delivers AI-created content, predictive insights, and automated tasks across the Salesforce Customer 360.',
        features: ['CRM AI', 'Predictive', 'Automation', 'Insights'],
        website: 'https://salesforce.com/einstein',
        pricing: ['Paid'],
        launchDate: '2016-09-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 10000000, rating: 4.7, growthRate: 20 },
        tags: ['Sales', 'CRM', 'Business']
    },
    {
        id: 'outreach',
        name: 'Outreach',
        companyId: 'outreach',
        logoUrl: 'https://ui-avatars.com/api/?name=Outreach&background=5925DC&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Sales',
        description: 'The leading Sales Execution Platform. Automate your sales workflows and generate more pipeline with AI.',
        features: ['Sales Engagement', 'Automation', 'Workflows', 'Pipeline'],
        website: 'https://outreach.io',
        pricing: ['Paid'],
        launchDate: '2014-01-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 1000000, rating: 4.7, growthRate: 30 },
        tags: ['Sales', 'Automation']
    },
    {
        id: 'salesloft',
        name: 'Salesloft',
        companyId: 'salesloft',
        logoUrl: 'https://ui-avatars.com/api/?name=Salesloft&background=00C7B1&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Sales',
        description: 'The Modern Revenue Workspace. Salesloft helps sellers execute on their digital selling strategy with AI.',
        features: ['Sales Engagement', 'Rhythm', 'AI', 'Pipeline'],
        website: 'https://salesloft.com',
        pricing: ['Paid'],
        launchDate: '2011-01-01',
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 800000, rating: 4.7, growthRate: 25 },
        tags: ['Sales', 'Engagement']
    },
    {
        id: 'clari',
        name: 'Clari',
        companyId: 'clari',
        logoUrl: 'https://ui-avatars.com/api/?name=Clari&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Sales',
        description: 'Revenue Collaboration & Governance. Clari uses AI to stop revenue leak and improve forecast accuracy.',
        features: ['Revenue Ops', 'Forecasting', 'Inspection', 'AI'],
        website: 'https://clari.com',
        pricing: ['Paid'],
        launchDate: '2013-01-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 500000, rating: 4.8, growthRate: 35 },
        tags: ['Sales', 'Revenue', 'Forecasting']
    },
    {
        id: 'hirevue',
        name: 'HireVue',
        companyId: 'hirevue',
        logoUrl: 'https://ui-avatars.com/api/?name=HireVue&background=F74E23&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Customer Support', // Valid mapping in script, technically HR
        description: 'AI-driven hiring platform. HireVue uses video interviewing and assessments to speed up hiring and find better talent.',
        features: ['Video Interview', 'Assessments', 'Hiring', 'Recruiting'],
        website: 'https://hirevue.com',
        pricing: ['Paid'],
        launchDate: '2004-01-01',
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 1000000, rating: 4.6, growthRate: 15 },
        tags: ['HR', 'Hiring', 'Recruiting']
    },
    {
        id: 'leena-ai',
        name: 'Leena AI',
        companyId: 'leena',
        logoUrl: 'https://ui-avatars.com/api/?name=Leena&background=2E3A59&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Customer Support',
        description: 'AI HR Assistant. Automate employee helpdesk and engagement with Leena AI\'s conversational platform.',
        features: ['HR Chatbot', 'Employee Experience', 'Helpdesk', 'Automation'],
        website: 'https://leena.ai',
        pricing: ['Paid'],
        launchDate: '2016-01-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 5000000, rating: 4.7, growthRate: 60 },
        tags: ['HR', 'Chatbot', 'Employee']
    },
    {
        id: 'quickbooks-ai',
        name: 'QuickBooks AI',
        companyId: 'intuit',
        logoUrl: 'https://ui-avatars.com/api/?name=QB&background=2CA01C&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Finance',
        description: 'Intuit Assist. AI-powered financial assistant integrated into QuickBooks to automate tasks and provide insights.',
        features: ['Accounting', 'Invoicing', 'Insights', 'Automation'],
        website: 'https://quickbooks.intuit.com',
        pricing: ['Paid'],
        launchDate: '2023-09-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 50000000, rating: 4.6, growthRate: 10 },
        tags: ['Finance', 'Accounting']
    },
    {
        id: 'vic-ai',
        name: 'Vic.ai',
        companyId: 'vic-ai',
        logoUrl: 'https://ui-avatars.com/api/?name=Vic&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Business & Operations',
        subCategory: 'Finance',
        description: 'Autonomous accounting platform. Vic.ai processes invoices and facilitates approvals with AI.',
        features: ['AP Automation', 'Invoicing', 'Accounting', 'AI'],
        website: 'https://vic.ai',
        pricing: ['Paid'],
        launchDate: '2017-01-01',
        lastUpdate: '2025-01-15',
        metrics: { totalUsers: 100000, rating: 4.7, growthRate: 80 },
        tags: ['Finance', 'Accounting']
    },

    // --- CONTENT & CREATIVE EXPANSION (Design, Interior, Architecture) ---
    {
        id: 'canva',
        name: 'Canva',
        companyId: 'canva',
        logoUrl: 'https://ui-avatars.com/api/?name=Canva&background=00C4CC&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Design',
        description: 'Design for everyone. Canva\'s Magic Studio brings comprehensive AI design tools to the popular platform.',
        features: ['Graphic Design', 'Magic Edit', 'Templates', 'Social Media'],
        website: 'https://canva.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2013-01-01',
        lastUpdate: '2025-03-01',
        metrics: { totalUsers: 150000000, rating: 4.8, growthRate: 30 },
        tags: ['Design', 'Graphics', 'Creative']
    },
    {
        id: 'uizard',
        name: 'Uizard',
        companyId: 'uizard',
        logoUrl: 'https://ui-avatars.com/api/?name=Uizard&background=E5FD52&color=000&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Design',
        description: 'Design stunning wireframes, mockups, and prototypes in minutes with AI. No design experience required.',
        features: ['UI Design', 'Wireframing', 'Prototyping', 'Text to Design'],
        website: 'https://uizard.io',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2018-01-01',
        lastUpdate: '2025-02-15',
        metrics: { totalUsers: 2000000, rating: 4.7, growthRate: 100 },
        tags: ['UI/UX', 'Design', 'Prototyping']
    },
    {
        id: 'khroma',
        name: 'Khroma',
        companyId: 'khroma',
        logoUrl: 'https://ui-avatars.com/api/?name=Khroma&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Design',
        description: 'The AI color tool for designers. Khroma uses AI to learn which colors you like and creates limitless palettes.',
        features: ['Color Palettes', 'Design', 'Inspiration', 'AI'],
        website: 'https://khroma.co',
        pricing: ['Free'],
        launchDate: '2018-01-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 500000, rating: 4.6, growthRate: 20 },
        tags: ['Design', 'Color']
    },
    {
        id: 'looka',
        name: 'Looka',
        companyId: 'looka',
        logoUrl: 'https://ui-avatars.com/api/?name=Looka&background=3F2A56&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Design',
        description: 'Design your own beautiful brand. Looka uses AI to create a logo and brand identity you\'ll love.',
        features: ['Logo Maker', 'Branding', 'Design', 'Marketing Materials'],
        website: 'https://looka.com',
        pricing: ['Paid'],
        launchDate: '2016-01-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 5000000, rating: 4.7, growthRate: 40 },
        tags: ['Design', 'Branding', 'Logo']
    },
    {
        id: 'interior-ai',
        name: 'Interior AI',
        companyId: 'interior-ai',
        logoUrl: 'https://ui-avatars.com/api/?name=Interior&background=000&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Design',
        description: 'Interior design ideas and virtual staging with AI. Redesign your home in seconds.',
        features: ['Interior Design', 'Virtual Staging', 'Home Decor', 'Rendering'],
        website: 'https://interiorai.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2022-09-01',
        lastUpdate: '2025-02-01',
        metrics: { totalUsers: 1000000, rating: 4.6, growthRate: 150 },
        tags: ['Interior', 'Design', 'Home']
    }
];

const COMPANIES = [
    { id: 'anthropic', name: 'Anthropic', valuation: '$18B', founded: '2021', location: 'San Francisco, CA' },
    { id: 'writesonic', name: 'Writesonic', location: 'San Francisco, CA' },
    { id: 'jasper', name: 'Jasper', valuation: '$1.5B', location: 'Austin, TX' },
    { id: 'openai', name: 'OpenAI', valuation: '$80B+', founded: '2015', location: 'San Francisco, CA' },
    { id: 'midjourney', name: 'Midjourney', valuation: '$10B', founded: '2022', location: 'San Francisco, CA' },
    { id: 'google', name: 'Google', valuation: '$1.7T', location: 'Mountain View, CA' },
    { id: 'adobe', name: 'Adobe', valuation: '$200B', location: 'San Jose, CA' },
    { id: 'microsoft', name: 'Microsoft', valuation: '$3T', location: 'Redmond, WA' },
];

let CATEGORIES = [
    {
        id: 'productivity_assistants',
        name: 'Productivity & Assistants',
        subCategories: ['AI Assistant', 'Productivity', 'Chatbot', 'Conversational AI', 'Project Management', 'Education']
    },
    {
        id: 'content_creative',
        name: 'Content & Creative',
        subCategories: ['Content Creation', 'Image Generation', 'Image Editing', 'Video Editing', 'Generative Video', 'Text-To-Speech', 'Design']
    },
    {
        id: 'business_ops',
        name: 'Business & Operations',
        subCategories: ['Business', 'Marketing', 'Sales', 'E-commerce', 'SEO', 'Customer Support', 'Finance']
    },
    {
        id: 'dev_data',
        name: 'Development & Data',
        subCategories: ['Website Builder', 'No-Code', 'Low-Code', 'Data Analytics', 'Data Management', 'Automation']
    },
    {
        id: 'lifestyle_industry',
        name: 'Lifestyle & Specific',
        subCategories: ['Healthcare', 'Travel', 'Social Media', 'Other']
    }
];

// 3. Helper Functions
function getLogo(name, bg = '0ea5e9') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=200&font-size=0.4&bold=true`;
}

function mapCategory(itemCategory, itemSubCategory) {
    // Normalize
    const catName = itemCategory || 'Other';
    const subName = itemSubCategory || 'Other';

    // Try to find exact match in CATEGORIES
    let parent = CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase() || c.id === catName.toLowerCase());

    if (!parent) {
        // Find matches in subcategories
        parent = CATEGORIES.find(c => c.subCategories.some(s => s.toLowerCase() === catName.toLowerCase()));
        if (parent) {
            // If the "Category" in JSON matches a known subcategory, use that
            return { category: parent.name, subCategory: catName };
        }

        // Default to "Lifestyle & Specific" -> "Other" if completely unknown, or create a new one?
        // User said "Map it to the closest existing one".
        // Simple heuristic: Keyword matching
        if (catName.match(/Marketing|Sales|Business/i)) parent = CATEGORIES.find(c => c.id === 'business_ops');
        else if (catName.match(/Video|Image|Art|Copy/i)) parent = CATEGORIES.find(c => c.id === 'content_creative');
        else if (catName.match(/Code|Dev|Data/i)) parent = CATEGORIES.find(c => c.id === 'dev_data');
        else if (catName.match(/Chat|Assistant/i)) parent = CATEGORIES.find(c => c.id === 'productivity_assistants');
        else parent = CATEGORIES.find(c => c.id === 'lifestyle_industry');
    }

    // Now ensure subCategory exists
    let finalSub = parent.subCategories.find(s => s.toLowerCase() === subName.toLowerCase());

    if (!finalSub) {
        // If SubCategory not found in the Parent, check if we need to add it or map to 'Other'
        // We will map to the closest subcategory or 'Other'
        finalSub = 'Other';
        // Optional: Add to subCategories if it looks valid?
        // Let's just stick to 'Other' to avoid polluting the UI with hundreds of subcats
        if (subName && !['Other', 'General'].includes(subName)) {
            // Maybe map specific ones?
            // For now, default to 'Other' or the first one
        }

        // Actually, the user said "create a logical new Category object...".
        // But updating the constant structure is complex because `id` needs to be unique.
        // Let's try to pass the raw subCategory if it's reasonable, otherwise 'Other'.
        // To be safe, let's use the provided subCategory from JSON if it's not empty, 
        // AND add it to the logical parent's subCategories list if missing!
        if (subName) {
            const exists = parent.subCategories.find(s => s.toLowerCase() === subName.toLowerCase());
            if (!exists) {
                // Add it!
                parent.subCategories.push(subName);
                finalSub = subName;
            }
        }
    }

    return { category: parent.name, subCategory: finalSub || 'Other' };
}

// 4. Process Data
try {
    const raw = fs.readFileSync(INPUT_JSON, 'utf-8');
    const items = JSON.parse(raw);
    const seedIds = new Set(SEED_PRODUCTS.map(p => p.id));

    const importedProducts = [];

    items.forEach(item => {
        // Name Normalization
        let name = item.name.trim();

        // Remove version numbers like " v4", " 3.5", " 2", " V5.0"
        // Heuristic: Space followed by v?digit+(.digit+)* at the end of string or separated by space
        // Exception: "Group 9", "Salesforce 360", "Office 365" - we should be careful.
        // Safer approach: Remove " v[0-9]+", " [0-9]+\.[0-9]+" (decimal versions)

        name = name.replace(/\s+v\d+(\.\d+)?/gi, ''); // Remove " v4", " V5.0"
        name = name.replace(/\s+\d+\.\d+$/g, ''); // Remove " 3.5" at end
        name = name.replace(/\s+gpt-4/gi, ' GPT'); // Normalize GPT-4 -> GPT
        name = name.trim();

        // ID Generation: handle spaces, special chars based on normalized name
        let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (id.length === 0) id = 'product-' + Math.random().toString(36).substr(2, 9);

        // Deduplication
        if (seedIds.has(id)) return; // Skip if in seed

        const { category, subCategory } = mapCategory(item.category, item.sub_category);

        // Metrics
        const metrics = {
            totalUsers: item.metrics?.total_users || 0,
            rating: item.metrics?.user_rating || 0,
            growthRate: item.metrics?.growth_rate || 0,
            mau: undefined
        };

        // Pricing derivation
        let pricing = ['Paid'];
        if (item.key_features && Array.isArray(item.key_features)) {
            const featuresStr = item.key_features.join(' ').toLowerCase();
            if (featuresStr.includes('free') || featuresStr.includes('freemium')) {
                pricing = ['Freemium'];
            }
            if (item.metrics?.total_users === 0) {
                // Maybe upcoming?
            }
        }

        // URL
        const logoUrl = getLogo(name);

        const product = {
            id,
            name: name,
            companyId: item.company || 'Unknown',
            logoUrl,
            category,
            subCategory,
            description: item.description || `${name} is a leading ${subCategory} tool focused on ${category}.`,
            features: item.key_features || [],
            website: item.link || '',
            pricing,
            launchDate: item.launch_date || '2023-01-01',
            lastUpdate: item.update_date || new Date().toISOString().split('T')[0],
            metrics,
            tags: [category, subCategory, ...(item.key_features || []).slice(0, 2)]
        };

        importedProducts.push(product);
    });

    console.log(`Processed ${importedProducts.length} items.`);

    // 5. Write Output
    const content = `import { Product, Company, Category } from './types';

// Reconciled Categories based on the provided JSON file, grouped into logical Parents
export const CATEGORIES: Category[] = ${JSON.stringify(CATEGORIES, null, 2)};

export const COMPANIES: Company[] = ${JSON.stringify(COMPANIES, null, 2)};

// Helper for consistent branding
const getLogo = (name: string, bg: string = '0ea5e9') => 
  \`https://ui-avatars.com/api/?name=\${encodeURIComponent(name)}&background=\${bg}&color=fff&size=200&font-size=0.4&bold=true\`;

// INITIAL SEED DATA (High Quality, Manually Curated)
const SEED_PRODUCTS: Product[] = ${JSON.stringify(SEED_PRODUCTS, null, 2)};

// DATA IMPORTED AND TRANSFORMED FROM JSON
const IMPORTED_PRODUCTS: Product[] = ${JSON.stringify(importedProducts, null, 2)};

export const PRODUCTS: Product[] = [...SEED_PRODUCTS, ...IMPORTED_PRODUCTS];
`;

    fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
    console.log(`Successfully wrote to ${OUTPUT_FILE}`);

} catch (e) {
    console.error("Error processing data:", e);
    process.exit(1);
}
