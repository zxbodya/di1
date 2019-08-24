export class Token<Service> {
  public name?: string;
  constructor(name?: string) {
    this.name = name;
  }

  // workaround for structural typing
  private __special?: Service;
}

export function createToken<Service>(name?: string): Token<Service> {
  return new Token<Service>(name);
}
