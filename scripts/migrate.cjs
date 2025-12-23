const fs = require('fs');
const path = require('path');

// 1. Define Paths
const INPUT_JSON = path.join(__dirname, '../files/ai_products_comprehensive.json');
const OUTPUT_FILE = path.join(__dirname, '../data.ts');

// 2. Load Seed Data & Schema (Mocking the parts we need to preserve)
const SEED_PRODUCTS = [
    {
        id: 'claude',
        name: 'Claude 3.5',
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
    {
        id: 'canva',
        name: 'Canva Magic',
        companyId: 'canva',
        logoUrl: 'https://ui-avatars.com/api/?name=Canva&background=00C4CC&color=fff&size=200&font-size=0.4&bold=true',
        category: 'Content & Creative',
        subCategory: 'Image Editing',
        description: 'A suite of AI tools within Canva. Magic Edit, Magic Eraser, and Magic Design make design accessible to everyone.',
        features: ['Magic Edit', 'Magic Eraser', 'Text to Image', 'Design Gen'],
        website: 'https://canva.com',
        pricing: ['Freemium', 'Paid'],
        launchDate: '2013-01-01',
        lastUpdate: '2025-01-01',
        metrics: { totalUsers: 150000000, rating: 4.8, growthRate: 10 },
        tags: ['Design', 'Mass Market']
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
        subCategories: ['Content Creation', 'Image Generation', 'Image Editing', 'Video Editing', 'Generative Video', 'Text-To-Speech']
    },
    {
        id: 'business_ops',
        name: 'Business & Operations',
        subCategories: ['Business', 'Marketing', 'Sales', 'E-commerce', 'SEO', 'Customer Support', 'Finance']
    },
    {
        id: 'dev_data',
        name: 'Development & Data',
        subCategories: ['Website Builder', 'No-Code', 'Data Analytics', 'Data Management', 'Automation']
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
        // ID Generation: handle spaces, special chars
        let id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
        const logoUrl = getLogo(item.name);

        const product = {
            id,
            name: item.name,
            companyId: item.company || 'Unknown',
            logoUrl,
            category,
            subCategory,
            description: item.description || `${item.name} is a leading ${subCategory} tool focused on ${category}.`,
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
