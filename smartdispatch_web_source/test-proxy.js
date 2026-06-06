fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ email: 'admin@smartdispatch.com', password: 'password' })
})
.then(async res => {
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Length:', res.headers.get('content-length'));
  const text = await res.text();
  console.log('Raw text body:', text);
  try {
    const json = JSON.parse(text);
    console.log('Parsed JSON:', json);
  } catch(e) {
    console.error('JSON parse failed!', e.message);
  }
})
.catch(err => console.error('Fetch failed:', err));
