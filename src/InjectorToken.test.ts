import { injectorToken } from './InjectorToken';
import { createToken } from './Token';

test('injectorToken', () => {
  injectorToken();
  injectorToken(createToken('test'));
});
