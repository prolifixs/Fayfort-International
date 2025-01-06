export const checkPasswordStrength = (password: string) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  strength = Object.values(checks).filter(Boolean).length;

  return {
    score: strength,
    checks,
    text: strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong',
    color: strength <= 2 ? 'red' : strength <= 4 ? 'yellow' : 'green'
  };
}; 