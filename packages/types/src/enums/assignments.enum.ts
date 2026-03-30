export enum AssignmentType {
  ORDER = "ORDER",
  BLACKOUT = "BLACKOUT",
  MAINTENANCE = "MAINTENANCE",
}

export enum OrderAssignmentStage {
  HOLD = "HOLD",
  COMMITTED = "COMMITTED",
}

export enum AssignmentSource {
  OWNED = "OWNED",
  EXTERNAL = "EXTERNAL",
}
