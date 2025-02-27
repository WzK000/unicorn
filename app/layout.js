import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false
});

export const metadata = {
  title: "10X Redação",
  description: "Plataforma de avaliação de redações para o ENEM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={geist.className}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
