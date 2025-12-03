class ApiError extends Error {
  constructor(
    type = "InternalServerError",
    msg = "Something went wrong",
    code = 500
  ) {
    super(msg);
    this.name = type;
    this.statusCode = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;