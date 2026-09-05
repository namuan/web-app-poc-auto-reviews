import { createRoot } from 'react-dom/client';
import { AddressBook } from './features/profile/AddressBook';
import './styles.css';

createRoot(document.getElementById('root')!).render(<AddressBook />);
