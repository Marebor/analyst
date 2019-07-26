export interface Changes<T> {
  new: T[],
  deleted: T[],
}

export class ChangesHandler {
  static handle<T>(changes: Changes<T>, collection: T[], equalityComparer: (a: T, b: T) => boolean) {
    changes.deleted.forEach(d => {
      const index = collection.findIndex(x => equalityComparer(x, d));

      if (index >= 0) {
        collection.splice(index, 1);
      }
    });

    changes.new.forEach(n => {
      if (!collection.find(x => equalityComparer(x, n))) {
        collection.push(n);
      }
    });
  }
} 