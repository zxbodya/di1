export class Token<Service> {
  public name?: string;
  constructor(name?: string) {
    this.name = name;
  }

  // workaround for structural typing
  // to make sure tokens for different services can not be assigned to each other
  public __special?: Service;
}

/**
 * Create token for referencing service in Container
 * @param name descriptive name of the service for debug purposes
 */
export function createToken<Service>(name?: string): Token<Service> {
  return new Token<Service>(name);
}
