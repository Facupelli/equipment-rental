export class EquipmentType {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  bufferDays: number;

  constructor(partial: Partial<EquipmentType>) {
    Object.assign(this, partial);
  }

  hasBuffer(): boolean {
    return this.bufferDays > 0;
  }

  getBufferHours(): number {
    return this.bufferDays * 24;
  }

  setBufferDays(days: number): void {
    if (days < 0) {
      throw new Error("Buffer days cannot be negative");
    }
    this.bufferDays = days;
  }

  requiresMaintenanceTime(): boolean {
    return this.bufferDays > 0;
  }

  calculateAvailableStartDate(previousEndDate: Date): Date {
    const availableDate = new Date(previousEndDate);
    availableDate.setDate(availableDate.getDate() + this.bufferDays);
    return availableDate;
  }
}
