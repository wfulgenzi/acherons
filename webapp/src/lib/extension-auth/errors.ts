export class ExtensionAuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = "ExtensionAuthError";
  }
}
