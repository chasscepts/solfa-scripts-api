export default class CustomError extends Error {
  constructor(message, status, error) {
    super(message);
    this.message = message;
    this.status = status;
    this.error = error;
  }
}
