let address = {
  fullName: 'Amina Okafor',
  line1: '48 Orchard Lane',
  city: 'Bristol',
  postcode: 'BS1 4QR'
};

function profileApiMiddleware(request, response, next) {
  response.setHeader('Content-Type', 'application/json');
  if (request.method === 'GET') {
    response.end(JSON.stringify(address));
    return;
  }
  if (request.method !== 'PUT') {
    next();
    return;
  }
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    try {
      address = JSON.parse(body);
      response.end(JSON.stringify(address));
    } catch {
      response.statusCode = 400;
      response.end(JSON.stringify({ message: 'Invalid address payload.' }));
    }
  });
}

module.exports = {
  name: 'local-profile-api',
  path: '/api/profile/delivery-address',
  middleware: profileApiMiddleware
};
