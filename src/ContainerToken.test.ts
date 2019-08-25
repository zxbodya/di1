import { containerToken } from './ContainerToken';
import { createToken } from './Token';

test('containerToken', () => {
  containerToken();
  containerToken(createToken('test'));
});
