## di1 Dependency Injection Container 

[![Build Status](https://travis-ci.org/zxbodya/di1.svg)](https://travis-ci.org/zxbodya/di1)
[![codecov.io](https://codecov.io/github/zxbodya/di1/coverage.svg?branch=master)](https://codecov.io/github/zxbodya/di1?branch=master)

Key features are:

* simplicity
* no string identifiers required
* possibility to create separate Container instance for specific context (user session for example)
* possibility to inject Container instance - useful when dealing with circular dependencies
* TypeScript support 

## Installation 

`npm install di1`

## Usage example

```typescript
// declare service without dependencies
import {
  declareService,
  declareServiceRaw,
  Container,
  createToken,
  containerToken,
} from 'di1';

const svc1 = declareServiceRaw(() => 1);

// declare service with dependency
const svc2 = declareServiceRaw(one => 1 + one, svc1);

// declaring a service specifying dependencies as object
const svc3 = declareService(
  // dependencies to inject
  { one: svc1, two: svc2 },
  ({ one, two }) => {
    return one + two;
  }
);

// create container instance
const rootContainer = new Container();

// get instance of specific service using declaration as token
// service would be automatically registered at root container
rootContainer.get(svc3); // will return 3

// creating token for service to be registered later
// token name is optional, but might be helpful for debug purposes
const token1 = createToken<number>('one');

// get instance of specific service using declaration as token
rootContainer.register(token1, svc1); // will return 3
rootContainer.get(token1); // will return 1 by creating new service instance using declaration svc1

// creating child container
const childContainer = rootContainer.createChild();

childContainer.get(svc3); // will return 3 by reusing service instance from parent container

// overriding existing implementation
childContainer.register(svc2, declareServiceRaw(() => 0));
// now when requesting service with overridden dependency, new instance would be created
// for svc1 dependency instance from parent container would be used
// for svc2 new instance would be created in child container using new declaration
childContainer.get(svc3); // will return 1
rootContainer.get(svc3); // will still use originally created instance (will return 3)

// dealing with circular dependencies
const t1 = createToken('t1');
const t2 = createToken('t2');
const s1 = declareServiceRaw(s2 => {
  return { s2 };
}, t2);

const s2 = declareServiceRaw(container => {
  return () => {
    const s1 = container.get(t1);
  };
}, containerToken(t1));

rootContainer.register(t1, s1);
rootContainer.register(t2, s2);

const s1instance = rootContainer.get(t1);
```

## Example use case for child container

Ability to create child container is intended for for providing context specific implementations
while reusing not specific when possible.

For example, imagine simple shopping app, having following services registered in root container: 

- `products` - provides access to products db 
- `user` (depends on: `session`)
- `cart` (depends on: `user`, `products`)

And request specific `session` implementation registered in child container, following will happen:

1. `products` service would be created once and will be reused across all requests
2. but `cart` and `user` services will be created for each session separately
