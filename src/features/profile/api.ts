export type DeliveryAddress = {
  fullName: string;
  line1: string;
  city: string;
  postcode: string;
};

const endpoint = '/api/profile/delivery-address';

export async function getDeliveryAddress(): Promise<DeliveryAddress> {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error('Could not load your saved address.');
  return response.json() as Promise<DeliveryAddress>;
}

export async function saveDeliveryAddress(address: DeliveryAddress): Promise<DeliveryAddress> {
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(address)
  });
  if (!response.ok) throw new Error('Could not save your address.');
  return response.json() as Promise<DeliveryAddress>;
}
