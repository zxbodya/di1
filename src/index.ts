import { Injector as InjectorReal } from './Injector';

class Token<Service> {
  private __special?: Service;
}

function createToken<Service>(name?: string): Token<Service> {
  return new Token<Service>();
}

type FactoryArray<S> = (...args: any[]) => S;
type DependenciesArray = Array<Injectable<any>>;

class Declaration<Service> {
  private factory: FactoryArray<Service>;
  private deps: DependenciesArray;

  constructor(factory: FactoryArray<Service>, deps: DependenciesArray) {
    this.factory = factory;
    this.deps = deps;
  }
}

type Injectable<T> = Token<T> | Declaration<T>;

interface Dependencies {
  [k: string]: Injectable<any>;
}

type Unwrap<D extends Dependencies> = {
  [k in keyof D]: D[k] extends Injectable<infer R> ? R : never;
};
type Factory<D extends Dependencies, S = any> = (d: Unwrap<D>) => S;

function createService<S, D extends Dependencies>(
  d: D,
  f: Factory<D, S>
): Declaration<S> {
  const keys = Object.keys(d);
  const values = keys.map(k => d[k]);
  const argsFactory = (...args: any[]) => {
    const depsObj: any = {};
    for (let i = 0, l = keys.length; i < l; i += 1) {
      depsObj[keys[i]] = args[i];
    }
    return f(depsObj);
  };
  return new Declaration<S>(argsFactory, values);
}

const n = createToken<number>();
const s = createToken<string>();
const o = createService({}, () => ({ a: 1 }));

createService({ n, s, o }, d => {
  d.n.toExponential();
  d.o.a = 1;
  return 1;
});

interface Injector {
  register<T>(service: Declaration<T>): void;
  register<T>(token: Injectable<T>, service: Declaration<T>): void;
  get<T>(service: Injectable<T>): T;
}

class Injector implements Injector {
  private injector: InjectorReal;

  constructor(realInjector?: InjectorReal) {
    this.injector = realInjector || new InjectorReal();
  }

  createChild() {
    return new Injector(this.injector.createChild());
  }

  get<T>(service: Token<T> | Declaration<T>): T {
    return ({} as any) as T;
  }

  register<T>(service: Declaration<T>): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T>(token: Injectable<T>, service: Declaration<T>): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T>(token: Injectable<T>, service?: Declaration<T>): void {
    if (service) {
      // register service by token
    } else {
      // register service by itself as token
    }
  }
}
