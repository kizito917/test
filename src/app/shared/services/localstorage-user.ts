import { UserInterface } from '../interfaces';
import { LocalstorageKeyEnum } from '../enums';

export function getUserFromLocalStorage() {
  let user = localStorage.getItem(LocalstorageKeyEnum.USER);
  let user_details: UserInterface = JSON.parse(user);
    return user_details;
  }

export function setUserIntoLocalStorage(user: UserInterface) {
  localStorage.setItem(LocalstorageKeyEnum.USER, JSON.stringify(user));
  }
