function truncate(str, maxLength) {
  if (str.length > maxLength) {
    return str.substr(0, maxLength);
  }
  return str;
}

export default function tokenName(token) {
  if (typeof token === 'function') {
    if (token.name) {
      return token.name;
    }
    const src = token.toString();
    const text = src.replace(/\s*/, ' ').trim();
    return `unnamed:${truncate(text, 40)}`;
  }
  if (Array.isArray(token)) {
    return 'unnamed:[object Array]';
  }
  if (typeof token === 'object') {
    return `unnamed:${token.toString()}`;
  }
  return token.toString();
}
