export class Category {
  id: string;
  name: string;
  description: string | null;

  constructor(partial: Partial<Category>) {
    Object.assign(this, partial);
  }
}
