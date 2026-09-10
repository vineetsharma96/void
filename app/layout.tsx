import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020306",
};

export const metadata: Metadata = {
  title: "VOID — «Nothing was modeled. Everything was generated.»",
  description:
    "A zero-asset procedural WebGL universe where every environment, structure, animation, sound, and interaction is synthesized entirely from code and mathematics.",
  keywords: [
    "threejs",
    "webgl",
    "react-three-fiber",
    "glsl",
    "procedural-generation",
    "creative-coding",
    "generative-art",
    "nextjs",
    "typescript",
    "web-audio",
    "zero-asset",
    "shader",
    "gpu",
  ],
  authors: [{ name: "VOID Cosmology Engine" }],
  openGraph: {
    title: "VOID — Zero-Asset Procedural WebGL Universe",
    description:
      "Nothing was modeled. Everything was generated. 5 cosmological realms synthesized entirely through procedural geometry, GLSL shaders, and Web Audio.",
    type: "website",
    siteName: "VOID",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOID — Zero-Asset Procedural WebGL Universe",
    description:
      "Nothing was modeled. Everything was generated. 5 cosmological realms synthesized entirely through procedural geometry, GLSL shaders, and Web Audio.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${outfit.variable} dark`}
    >
      <body className="bg-void-900 text-void-200 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
