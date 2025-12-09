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

export function prettyErrorResponse(validate, msg) {
    const jsonResponse = {
        message: msg,
        errors: []
    };
    for (let err of validate.error.details) {
        jsonResponse.errors.push({
            type: err.path[0],
            message: err.message
        });
    }
    return jsonResponse;
}

export default ApiError;