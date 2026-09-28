import './globals.css';
import { UserProvider } from '@/context/UserContext';

export const metadata = {
  title: 'P2P Chat — WebRTC + XOR + Differential Manchester',
  description: 'Peer-to-peer chat over WebRTC Data Channel with XOR encryption and signal visualization',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
