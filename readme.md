## di1 Dependency Injection Container

DI Container, inspired by [Angular2 DI](https://github.com/angular/di.js) but a lot simplified.

Key features are:

* simplicity
* no string identifiers required - anything can be used as identifier(typically factory function used as identifier)
* ability to create separate Injector instance for specific context (user session for example)
* ability to inject Injector instance - useful when dealing with circular dependencies 

## Documetation

Create service definition in default services map:

`provide(token, factory, ...deps)`

where:

- `token` - service identifier
- `factory` - factory function used to create service
- `deps` - list of tokens required for a factory

it will return token.

There is also short cut for case when you want to use factory as a token:

`annotate(factory, ...deps)`

Injector constructor:

`let rootInjector = new Injector(injector = null, providers = new Map(), cache = new Map())`

- `injector` - injector to be used when service is not found
- `providers` - map with service providers
- `cache` - map with service instances


Create a service via injector:

`let svc = injector.get(svcToken)`

Replace service provider(should be called before service creation):

`injector.provide(svcToken, newFactory)`

Create injector for specific context, reusing existing services from existing injector 

`let childInjector = injector.createChild()`

## More about child injector

Ability to create child injector is intended for for providing context specific implementations while reusing not secific where it is possible.

For example, imagine simple shopping app, and following services server side:

- products - provides access to products db 
- session - session storage for current user
- user profile (depends on: session)
- cart (depends on: user, products)

So if we will create child injector for user request and will provide user specific session service implementation, than:

1. `products` service would be created once and will be reused across all requests
2. but `cart` and `user profile` services will be created for each user individually
 
For deeper understanding - see [di.test.js](https://github.com/zxbodya/di1/blob/master/src/di.test.js)


