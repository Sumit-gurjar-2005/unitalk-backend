const emailRegex =
  /^[a-z]+\.[0-9]{2}[a-z]+[0-9]{3}@rtu\.ac\.in$/;

const validateEmail = (email) => {
  return emailRegex.test(email.toLowerCase());
};

module.exports = validateEmail;
 