import type { Metadata, Viewport } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
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
  title: "VOID: Procedural WebGL Universe",
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
    title: "VOID: Zero-Asset Procedural WebGL Universe",
    description:
      "Nothing was modeled. Everything was generated. Five cosmological realms synthesized entirely through procedural geometry, GLSL shaders, and Web Audio.",
    type: "website",
    siteName: "VOID",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOID: Zero-Asset Procedural WebGL Universe",
    description:
      "Nothing was modeled. Everything was generated. Five cosmological realms synthesized entirely through procedural geometry, GLSL shaders, and Web Audio.",
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
      className={`${dmSans.variable} ${bricolage.variable} dark`}
    >
      <body className="bg-void-900 text-void-200 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
