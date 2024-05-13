import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
    themeColor: "#c6dadf",
};

export const metadata = {
    title: "Passkeys Directory",
    description: "Explore the crowd-sourced index of websites, apps, and services that offer signing in with passkeys.",
    backgroundColor: "#c6dadf",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    startUrl: "/",
    lang: "en",
    dir: "ltr",
    metadataBase: "https://passkeys-directory.dashlane.com/",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://passkeys-directory.dashlane.com/",
        title: "Passkeys Directory",
        description:
            "Explore the crowd-sourced index of websites, apps, and services that offer signing in with passkeys.",
        site_name: "Passkeys Directory",
        images: [
            {
                url: "https://passkeys-directory.dashlane.com/og-image.webp",
                width: 1600,
                height: 900,
                alt: "Passkeys Directory - Services that offer signing in with passkeys",
            },
            {
                url: "https://passkeys-directory.dashlane.com/og-image.png",
                width: 900,
                height: 506,
                alt: "Passkeys Directory - Services that offer signing in with passkeys",
            },
        ],
    },
    twitter: {
        card_type: "summary_large_image",
        site: "@dashlane",
        creator: "@dashlane",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
