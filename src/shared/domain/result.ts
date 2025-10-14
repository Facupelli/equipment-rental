export class Result<T, E = string> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T | undefined,
    private readonly _error?: E | undefined
  ) {}

  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  public get value(): T {
    if (!this._isSuccess) {
      throw new Error("Cannot get value from a failed result");
    }
    return this._value as T;
  }

  public get error(): E {
    if (this._isSuccess) {
      throw new Error("Cannot get error from a successful result");
    }
    return this._error as E;
  }

  public static ok<T, E = string>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  public static fail<T = never, E = string>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }
    return Result.ok<U, E>(fn(this._value as T));
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }
    return fn(this._value as T);
  }
}
