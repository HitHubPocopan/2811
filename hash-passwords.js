const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('Hashes SHA256 para las nuevas contraseñas:\n');
console.log('anabel (pocopan1711):', hashPassword('pocopan1711'));
console.log('sofia (pocopan2722):', hashPassword('pocopan2722'));
console.log('jano (pocopan3733):', hashPassword('pocopan3733'));
