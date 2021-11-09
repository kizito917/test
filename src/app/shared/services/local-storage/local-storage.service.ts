import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LocalStorageService {
  private prefix = "billion";

  addItem(key, value) {
    try {
      localStorage.setItem(`${this.prefix}.${key}`, JSON.stringify(value));
    } catch (err) {
      console.error(err);
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(`${this.prefix}.${key}`);
    } catch (err) {
      console.error(err);
    }
  }

  getItem(key, defaultVal = null) {
    try {
      const item = localStorage.getItem(`${this.prefix}.${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch (err) {
      console.error(err);
    }
  }

  clear() {
    try {
      localStorage.clear();
    } catch (err) {
      console.error(err);
    }
  }
}
