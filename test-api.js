const testEgreso = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/egresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        createdBy: 'test-user-123',
        category: 'Compra de Inventario',
        items: [
          {
            description: 'Producto de Prueba',
            quantity: 2,
            unit_price: 100,
            purchase_price: 50,
            subtotal: 100
          }
        ],
        subtotal: 100,
        shippingCost: 0,
        total: 100,
        paymentStatus: 'paid'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
};

testEgreso();
