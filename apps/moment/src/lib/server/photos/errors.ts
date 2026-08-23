export type PhotoDomainErrorCode =
  | "OWNER_NOT_CONFIGURED"
  | "OWNER_NOT_FOUND"
  | "R2_OBJECT_NOT_FOUND";

export class PhotoDomainError extends Error {
  constructor(
    readonly code: PhotoDomainErrorCode,
    message: string,
    readonly httpStatus: 400 | 404 | 503,
  ) {
    super(message);
    this.name = "PhotoDomainError";
  }
}
