
/**
 * Root layout shared by all pages in the Next.js application.
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Default metadata for the Bible search application. */
export const metadata: Metadata = {
  title: 'Bible Passage Search',
  description: 'Search Bible passages using semantic search.',
};

/**
 * Wraps application pages in the required HTML document structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
