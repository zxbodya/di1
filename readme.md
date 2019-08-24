## di1 Dependency Injection Container 

[![Build Status](https://travis-ci.org/zxbodya/di1.svg)](https://travis-ci.org/zxbodya/di1)
[![codecov.io](https://codecov.io/github/zxbodya/di1/coverage.svg?branch=master)](https://codecov.io/github/zxbodya/di1?branch=master)

Key features are:

* simplicity
* no string identifiers required
* possibility to create separate Injector instance for specific context (user session for example)
* possibility to inject Injector instance - useful when dealing with circular dependencies 

## Installation 

`npm install di1`

## Usage example

```js
// declare service without dependencies
const svc1 = declareServiceRaw(()=>1);

// declare service with dependency
const svc2 = declareServiceRaw((one)=>1+one, svc1);

// declaring a service specifying dependencies as object 
const svc3 = declareService(
  // dependencies declaration
  { one: svc1, two: svc2 },
  ({ one, two })=>{
    return one + two;
  }
)

// create injector instance
const rootInjector = new Injector();

// get instance of specific service using declaration as token
// service would be automatically registered at root injector
rootInjector.get(svc3); // will return 3

// creating token for service to be registered later
// token name is optional, but might be helpful for debug purposes
const token1 = createToken<number>('one');

// get instance of specific service using declaration as token
rootInjector.register(token1, svc1); // will return 3
rootInjector.get(token1); // will return 1 by creating new service instance using declaration svc1

// creating child injector
const childInjector = rootInjector.createChild();

childInjector.get(svc3); // will return 3 by reusing service instance from parent injector

// overriding existing implementation
childInjector.register(svc2, declareServiceRaw(()=>0));
// now when requesting service with overridden dependency, new instance would be created
// for svc1 dependency instance from parent injector would be used
// for svc2 new instance would be created in child injector using new declaration
childInjector.get(svc3); // will return 1 
rootInjector.get(svc3); // will still use originally created instance (will return 3)

// Pass injector instance to factory:
declareServiceRaw(
  (injector)=>{
    // will inject injector from which service was requested
  }, 
  InjectorToken
);
```

## Example use case for child injector

Ability to create child injector is intended for for providing context specific implementations
while reusing not specific when possible.

For example, imagine simple shopping app, having following services registered in root injector: 

- `products` - provides access to products db 
- `user` (depends on: `session`)
- `cart` (depends on: `user`, `products`)

And request specific `session` implementation registered in child injector, following will happen:

1. `products` service would be created once and will be reused across all requests
2. but `cart` and `user` services will be created for each session separately
