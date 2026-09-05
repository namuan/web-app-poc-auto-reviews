import { FormEvent, useEffect, useState } from 'react';
import { DeliveryAddress, getDeliveryAddress, saveDeliveryAddress } from './api';

const fields: Array<{ name: keyof DeliveryAddress; label: string; autoComplete: string }> = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'line1', label: 'Address line', autoComplete: 'street-address' },
  { name: 'city', label: 'Town or city', autoComplete: 'address-level2' },
  { name: 'postcode', label: 'Postcode', autoComplete: 'postal-code' }
];

const emptyAddress: DeliveryAddress = { fullName: '', line1: '', city: '', postcode: '' };

export function AddressBook() {
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress);
  const [savedAddress, setSavedAddress] = useState<DeliveryAddress | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getDeliveryAddress()
      .then((value) => {
        setAddress(value);
        setSavedAddress(value);
        setStatus('ready');
      })
      .catch((reason: Error) => {
        setError(reason.message);
        setStatus('error');
      });
  }, []);

  function update(name: keyof DeliveryAddress, value: string) {
    setAddress((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus('saving');
    try {
      const saved = await saveDeliveryAddress(address);
      setAddress(saved);
      setSavedAddress(saved);
      setStatus('ready');
    } catch (reason) {
      setAddress(savedAddress ?? emptyAddress);
      setError(reason instanceof Error ? reason.message : 'Could not save your address.');
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return <main className="shell">Loading your delivery details…</main>;
  }

  if (status === 'error' && !savedAddress) {
    return (
      <main className="shell">
        <p role="alert">{error}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="masthead">
        <p className="eyebrow">Account / delivery</p>
        <h1>Where should we send it?</h1>
        <p>Keep one reliable address on file for your next order.</p>
      </header>
      <form
        className="address-form"
        onSubmit={submit}
        aria-describedby={error ? 'save-error' : undefined}
      >
        {fields.map((field) => (
          <label key={field.name}>
            <span>{field.label}</span>
            <input
              name={field.name}
              value={address[field.name]}
              onChange={(event) => update(field.name, event.target.value)}
              autoComplete={field.autoComplete}
              required
            />
          </label>
        ))}
        {error && (
          <p id="save-error" role="alert">
            {error} Your previous address is still saved.
          </p>
        )}
        <button className="save" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving address…' : 'Save delivery address'}
        </button>
      </form>
    </main>
  );
}
