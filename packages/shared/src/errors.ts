export class Unauthorized extends Error {
  readonly statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "Unauthorized";
  }
}

export class Forbidden extends Error {
  readonly statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "Forbidden";
  }
}

export class NotFound extends Error {
  readonly statusCode = 404;
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFound";
  }
}
