export class Token<Service> {
  public name?: string;
  constructor(name?: string) {
    this.name = name;
  }

  // workaround for structural typing
  // to make sure tokens for different services can not be assigned to each other
  public __special?: Service;
}

export function createToken<Service>(name?: string): Token<Service> {
  return new Token<Service>(name);
}
