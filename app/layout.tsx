import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "nft-minting-dapp",
    description: "lsware",
    generator: "hyunsoo",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
