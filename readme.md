## di1 Dependency Injection Container 

[![Build Status](https://travis-ci.org/zxbodya/di1.svg)](https://travis-ci.org/zxbodya/di1)
[![codecov.io](https://codecov.io/github/zxbodya/di1/coverage.svg?branch=master)](https://codecov.io/github/zxbodya/di1?branch=master)

Dependency Injection Container for JavaScript, with following goals:

* minimalistic, and relatively simple to use
* possibility to create separate Container instance for specific context (user session for example)
* possibility to inject Container instance - useful when dealing with circular dependencies
* good TypeScript support, allowing inferring for most of the things 

## Installation 

`npm install di1`

## API

### Service tokens

Services inside DI container, can be referenced using tokens.

Token for registering service or specifying dependency, can be created using `createToken` function:  
```typescript
function createToken<ServiceType>(name?: string): Token;
```

`name` argument here, is to be used for debug messages in cases like when having error about cyclic dependency.

There is also a special kind of which allows accessing DI container itself from a service.
Such a token can be created using `injectorToken` function:
```typescript
function injectorToken(...deps: Injectable[]): Token
```

Which as an argument optionally has a list of dependencies which should be available for the container,
this affects in which specific container in the hierarchy service using it is to be created.

This is useful for more dynamic cases when requesting dependencies known only at runtime time.  

Also, this makes it possible to have cyclic dependencies, in limited cases(which btw, better to be avoided whenever possible). 

### Service declaration

Typically service should be defined using `declareService` funtion:

```typescript
function declareService(depsObject, factory): ServiceDeclaration;
```

which creates a service declaration using object specifying dependencies(list of service tokens or other declarations),
 and a factory function to be called with object of dependency instances(having same shape as `depsObject`)

There is also a bit more low level version of this:

```typescript
function declareServiceRaw(factory, ...deps): ServiceDeclaration
```

the only difference is that dependencies would be injected as separate function arguments into factory function.
It is slightly closer to how things work internally, but most of the difference is in how it looks.

Supposedly `declareService` should be more convenient in most of the cases, and suggested as preferred option.  

### DI Container

`class Injector` - Dependency injection container. Represents a registry of service declarations, and cache of already created instances. 

#### Registering a service

To register declaration for given token, or to replace/override previously declared service `register` method can be used:

```typescript
injector.register(tokenOrDeclaration, declaration)
```

Because it is allowed to have service declaration as a dependency - it might be useful to register it to be created on specific layer in the container hierarchy.
(by default it would be created in upper possible layer having all the dependencies) 

For this case it is possible to register the declaration in the specific container (effectively limiting it to be created in it or its decedents) 
```typescript
injector.register(declaration)
```

To create a service instance or to use previously created one - `get` method is to be used:  
```typescript
injector.get(tokenOrDeclaration)
```

There are cases when there is a need for separate context for services to be created,
while allowing to reuse some service instances from existing context, this can be done `createChild` method:

```typescript
injector.createChild()
```

## Usage example

```typescript
import {
  declareService,
  declareServiceRaw,
  Injector,
  createToken,
  injectorToken,
} from 'di1';

// declare service without dependencies
const svc1 = declareServiceRaw(() => 1);

// declare service with dependency on other declaration
const svc2 = declareServiceRaw(one => 1 + one, svc1);

// declaring a service specifying dependencies as object
const svc3 = declareService(
  // dependencies to be inject
  { 
    one: svc1,
    two: svc2
  },
  ({ one, two }) => {
    return one + two;
  }
);
// by default declaration are unnamed
// but for debug purposes name can be assigned to it
svc3.name = 'svc3';
// or specified as name of factory function
const svc4 = declareServiceRaw(function svc4(){ return 1 });

// create container instance
const rootInjector = new Injector();

// get instance of specific service
// if not previously registered - declaration would be automatically registered at root container
rootInjector.get(svc3); // will return 3

// creating token for service to be registered later
// token name is optional, but might be helpful for debug purposes
const token1 = createToken('one');

// get instance of specific service using declaration as token
rootInjector.register(token1, svc1); // will return 3
rootInjector.get(token1); // will return 1 by creating new service instance using declaration svc1

// creating child container
const childInjector = rootInjector.createChild();
childInjector.get(svc3); // will return 3 by reusing service instance created previously in parent container

// overriding existing implementation
childInjector.register(svc2, declareServiceRaw(() => 0));

// now when requesting service with overridden dependency, new instance would be created in child container
// for svc1 dependency instance from parent container would be used
// for svc2 new instance would be created in child container using new declaration
childInjector.get(svc3); // will return 1
rootInjector.get(svc3);  // will still use originally created instance (will return 3)

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

rootInjector.register(t1, s1);
rootInjector.register(t2, s2);

const s1instance = rootInjector.get(t1);
```

## Example use case for child container

This is cases when there is a need to create a child container providing context specific implementations
while reusing not specific whenever possible.

For example, imagine simple shopping app, having following services registered in root container: 

- `products` - provides access to products db 
- `user` (depends on: `session`)
- `cart` (depends on: `user`, `products`)

But `session` in request specific, and so implementation is to be registered in a child container(created per request),

the following will happen:

1. `products` service would be created just once and will be reused across all requests
2. `cart` and `user` services will be created for each session separately
