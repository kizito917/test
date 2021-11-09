import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

export function integerValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value.match(/^[0-9]/)) {
      console.log('only digits');
      return null;
    } else {
      console.log('not digits');
      return {
        invalidInteger: true
      };
    }
  };
}

export function fixedLengthValidator(length: Number): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value.length !== length) {
      return { invalidLength: length };
    }
    return null;
  };
}

export function telephoneValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (
      control.value.match(
        /^((\(?0\d{4}\)?\s?\d{3}\s?\d{3})|(\(?0\d{3}\)?\s?\d{3}\s?\d{4})|(\(?0\d{2}\)?\s?\d{4}\s?\d{4}))(\s?\#(\d{4}|\d{3}))?$/
      )
    ) {

      console.log('valid Telephone');

      return null;
    } else {
      console.log('invalid Telephone');
      return {
        invalidTelephone: true
      };
    }
  };
}

export function postcodeValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (
      control.value.match(
        /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/
      )
    ) {
      return null;
    } else {
      return {
        invalidPostcode: true
      };
    }
  };
}

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl) => {

    if (control.value) {
      // RFC 2822 compliant regex
      if (
        control.value.match(
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
      ) {
        return null;
      } else {
        return {
          invalidEmailAddress: true
        };
      }
    }
    else {
      return null;
    }

    
  };
}

export function decimalValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value.match(/^\d+\.\d{2}$/)) {
      return null;
    } else {
      return {
        invalidDecimal: true
      };
    }
  };
}

export function onlyDigitsValidator(): ValidatorFn {
  return (control: AbstractControl) => {

    if (control.value) {
      if (control.value.match(/^\d+$/)) {
        return null;
      } else {
        return {
          invalidDigits: true
        };
      }
    }
    else {
      return null;
    }
    
  };
}

export function onlyDigitsOptValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value) {
      if (control.value.match(/^\d+$/)) {

        if (control.value.length < 6) {
          return { invalidMustLength: 6 };
        }
        return null;

      } else {
        return {
          invalidDigits: true
        };
      }
    }
    else {
      return null;
    }
    
  };
}

export function containsUppercaseCharacter(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value.match(/[A-Z]/)) {
      return null;
    } else {
      return {
        noUppercaseCharacter: true
      };
    }
  };
}

export function containsNumericCharacter(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value.match(/[0-9]/)) {
      return null;
    } else {
      return {
        noNumericCharacter: true
      };
    }
  };
}

export function containsLowercaseCharacter(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value.match(/[a-z]/)) {
      return null;
    } else {
      return {
        noLowercaseCharacter: true
      };
    }
  };
}

export function containsSpecialCharacter(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value.match(/[(!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)]/)) {
      return null;
    } else {
      return {
        noSpecialCharacter: true
      };
    }
  };
}

export function passwordValidator(): ValidatorFn {
  // {6,100}           - Assert password is between 6 and 100 characters
  // (?=.*[0-9])       - Assert a string has at least one number

  return (control: AbstractControl) => {
    if (control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
      return null;
    } else {
      return {
        invalidPassword: true
      };
    }
  };
}

export function matchPassword(g: FormGroup) {
  return g.get('password').value === g.get('passwordConfirm').value
    ? null
    : {
        passwordMismatch: true
      };
}

export function matchPasswords(password, passwordConfirm) {
  return password === passwordConfirm
    ? true
    : false;
}

export function is18yearOld(): ValidatorFn {

  return (control: AbstractControl) => {

    if (control.value) {
      let selectedDate = new Date(control.value);
      if (new Date(selectedDate.getFullYear() + 18, selectedDate.getMonth() - 1, selectedDate.getDate()) >= new Date()) {
        return {
          invalidAge: true
        };
      }
    }
    
    return null;
  };
}

export function passwordNewValidator(): ValidatorFn {
  // {6,100}           - Assert password is between 6 and 100 characters
  // (?=.*[0-9])       - Assert a string has at least one number

  return (control: AbstractControl) => {
    if (control.value) {
      if (control.value.length < 8) {
        return { invalidLength: 8 };
      }

      if (!control.value.match(/[0-9]/)) {
        return {
          noNumericCharacter: true
        };
      }

      if (!control.value.match(/[a-z]/)) {
        return {
          noLowercaseCharacter: true
        };
      }

      if (!control.value.match(/[A-Z]/)) {
        return {
          noUppercaseCharacter: true
        };
      }

      if (!control.value.match(/[(!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)]/)) {
        return {
          noSpecialCharacter: true
        };
      }
    }
    else {
      return null;
    }
    

  };
}

export function fieldIsRequired(name: String): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return { isRequired: name };
    }
    return null;
  };
}

export function selectIsRequired(name: String): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value || control.value === "0") {
      return { isRequired: name };
    }
    return null;
  };
}

export function onlyText(name: String): ValidatorFn {
  return (control: AbstractControl) => {
    if(control.value){
      if (!control.value.match(/^[a-zA-Z]+$/)) {
        return {
          onlyCharacter: name
        };
      }
      return null;
    }
  };
}

export function onlyTextWithApostrophe(name: String): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value) {
      if (!control.value.match(/^[a-zA-Z]+([ '.]?[a-zA-Z]+)?$/)) {
        return {
          onlyCharacter: name
        };
      }
      return null;
    }
  };
}

export function onlyTextAndSpace(name: String): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value) {
      if (!control.value.match(/^[a-zA-Z\ ]*$/)) {
        return {
          onlyCharacter: name
        };
      }
      return null;
    }
  };
}

export function compareDate(g: FormGroup) {

  if (g.get('final_submission_date').value && g.get('request_due_date').value) {

    let submission_date = new Date(g.get('final_submission_date').value);
    let due_date = new Date(g.get('request_due_date').value);

    //console.log('submission_date', submission_date);
    //console.log('due_date', due_date);

    let result= submission_date < due_date
      ? null
      : {
        dateMustBeGreater : true
      };
    //console.log(result);
    return result;
  }
}

export function budgetValidator(length: Number): ValidatorFn {
  return (control: AbstractControl) => {

    if (control.value) {
      if (control.value.match(/^\d+$/)) {
        if (control.value.length > length) {
          return {
            invalidBudgetLength: length
          };
        }
        return null;
      }
      else {
        if (control.value.match(/^\d+\.\d{2}$/)) {
          if (control.value.length > length) {
            return {
              invalidBudgetLength: length
            };
          }
          return null;
        }

        return {
          invalidBudget: true
        };
      }
    }
    else {
      return null;
    }

  };
}

export function validateFile(name: String) {

    let allowed_extensions = ['pdf'];
    var ext = name.substring(name.lastIndexOf('.') + 1);
    if (allowed_extensions.lastIndexOf(ext.toLowerCase()) !== -1)
    {
      return true;
    }
    else {
        return false;
    }
}

export function validateImageFile(name: String) {

    let allowed_extensions = ['jpg','jpeg','png'];
    var ext = name.substring(name.lastIndexOf('.') + 1);
    if (allowed_extensions.lastIndexOf(ext.toLowerCase()) !== -1)
    {
      return true;
    }
    else {
        return false;
    }
}

export function validateAudioFile(name: String) {

  let allowed_extensions = ['mp3', 'm4a', 'wav', 'opus', 'ogg'];
    var ext = name.substring(name.lastIndexOf('.') + 1);
    if (allowed_extensions.lastIndexOf(ext.toLowerCase()) !== -1)
    {
      return true;
    }
    else {
        return false;
    }
}

export function fileSizeValidator(file) {

  var size = Math.floor(file.size/1000);
    if(size <= 10240){
      return true;
    }
    else{
      return false;
    }
}

export function linkValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if(control.value)
    {
       if(control.value.startsWith('http:/') || control.value.startsWith('https:/')){
      // if (control.value.match(/^(http:\/\/|https:\/\/)?(www.)?([a-zA-Z0-9]+).[a-zA-Z0-9]*.[a-zA-Z0-9]*.[a-z]{3}.?([a-z]+)?$/)) {
        return null;
      } else {
        return {
          invalidLink: true
        };
      }
    }else{
      return null;
    }
  };
}

export function phoneNumberValidator(name: String): ValidatorFn {
  return (control: AbstractControl) => {

    if (!control.value) 
      return { isRequired: name };

    if (!control.value.match(/^\d+$/)) 
      return { invalidDigits: true };

    if(control.value.length < 8)
      return {minlength: 8};

    return null;
  };
}

export function trimValidator(name: String): ValidatorFn {
  return (control: AbstractControl) => {
if(control.value)
    {
  if (control.value.startsWith(' ')) {
    return {
        trimStartError:name
      //'trimError': { value: 'control has leading whitespace' }
    };
  }
  if (control.value.endsWith(' ')) {
    return {
      trimEndError:name
      //'trimError': { value: 'control has trailing whitespace' }
    };
  }
}
else{
  return null;
  }
  };
};


export function commaValidator(): ValidatorFn {
  return (control: AbstractControl) => {

    if (control.value) {
      // RFC 2822 compliant regex
      if (
        control.value.match(
          /^([\w+-.%]+@[\w-.]+\.[A-Za-z]{2,4},?)+$/
        )
      ) {
        return null;
      } else {
        return {
          invalidCommaEmail: true
        };
      }
    }
    else {
      return null;
    }

    
  };
}
