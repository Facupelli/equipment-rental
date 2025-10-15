export class Allocation {
  constructor(
    readonly id: string,
    readonly equipmentUnitId: string,
    readonly startDate: Date,
    readonly endDate: Date
  ) {
    if (endDate <= startDate) {
      throw new Error("End date must be after start date.");
    }
  }

  overlaps(other: Allocation): boolean {
    return this.startDate < other.endDate && this.endDate > other.startDate;
  }

  get durationInDays(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
