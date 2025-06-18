import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "엘에스웨어 신현수",
    description: "엘에스웨어 신현수",
    generator: "엘에스웨어 신현수",
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
