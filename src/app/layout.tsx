import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Kinetiq - AI Product Database',
    description: 'Discover and compare the best AI tools for productivity, coding, and creative work.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-WNLJMWSG9W" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-WNLJMWSG9W');`,
                    }}
                />
            </head>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
