const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('Hash admin123:', hashPassword('admin123'));
console.log('Hash pos123:', hashPassword('pos123'));

// Los hashes esperados:
console.log('\nEsperados en BD:');
console.log('admin123 esperado: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');
console.log('pos123 esperado: f3ad04a0c7be6e5e29fa4dc2b8a84ba2ce0df85e50b47fec89cc8a0c0ecafca8');
