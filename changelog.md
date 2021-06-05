# Changelog

## 0.5.0 (2020-01-27)
**Breaking changes**

- redesign API once again - `Container` is overused and so renaming it back to `Injector`

## 0.4.3 (2020-07-16)
- additional type exports
- readme updates

## 0.4.2 (2020-07-12)
- type improvements, additional exports
- move tslib to be dependency instead of peerDependency

## 0.4.1 (2019-08-25)
- improve readme
- fix bug
 
## 0.4.0 (2019-08-25)
**Breaking changes**

- complete api redesign, focusing on making it smaller and more expressive
- better error message when having cyclic dependencies
- additional check to prevent using container from factory function(preventing infinite recursion from happening)
- better TypeScript support

## 0.3.0 (2019-08-24)
- migrate to typescript
- drop old nodejs versions support (below 8)

## 0.2.0 (2019-08-24)
- migrate to babel 7

## 0.1.5 (2016-02-01)
- migrate to babel 6

## 0.1.4 (2016-01-12)
- allow services to be defined only in child injector

## 0.1.3 (2015-12-15)
- improve debuggability by showing service names in error logs
- additional examples in readme
- ci configuration
- code coverage report
- stop using karma, instead use jasmine directly

## 0.1.2 (2015-12-06)
- better readme

## 0.1.1 (2015-12-04)
- fixed npm ignore 

## 0.1.0 (2015-12-04)
- First version published to npm.
