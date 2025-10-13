export class Result<T, E = string> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
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

  public static ok<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  public static fail<E = string>(error: E): Result<never, E> {
    return new Result<never, E>(false, undefined, error);
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail(this._error as E);
    }
    return Result.ok(fn(this._value as T));
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail(this._error as E);
    }
    return fn(this._value as T);
  }
}
