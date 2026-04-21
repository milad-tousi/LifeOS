export type EntityId = string;
export type ISODateString = string;
export type TimestampMs = number;

export interface TimestampedRecord {
  createdAt: TimestampMs;
}

export interface MutableTimestampedRecord extends TimestampedRecord {
  updatedAt: TimestampMs;
}
