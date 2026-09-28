import './globals.css';
import { UserProvider } from '@/context/UserContext';

export const metadata = {
  title: 'P2P Chat — WebRTC + XOR + Differential Manchester',
  description: 'Chat peer-to-peer lewat WebRTC Data Channel dengan enkripsi XOR dan visualisasi sinyal Differential Manchester',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4D9F5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
