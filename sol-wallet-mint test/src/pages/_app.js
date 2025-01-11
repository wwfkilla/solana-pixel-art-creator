import '../styles/globals.css';
import { WalletContext } from '../utils/wallet';

function MyApp({ Component, pageProps }) {
  return (
    <WalletContext>
      <Component {...pageProps} />
    </WalletContext>
  );
}

export default MyApp;