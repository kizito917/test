import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
    const config = {
      required: 'Required',
      isRequired: `${validatorValue} is required`,
      invalidCreditCard: 'Is invalid credit card number',
      invalidDecimal: 'Enter a valid decimal number',
      emailExists: 'An account exists with this email address',
      invalidEmailAddress: 'Invalid email address',
      invalidPassword:'Invalid password. Password must be at least 6 characters long, and contain a number.',
      minlength: `Too Short. Minimum Length ${validatorValue.requiredLength}`,
      maxlength: `Too Long. Maximum ${validatorValue.requiredLength}`,
      pattern: 'Invalid Number',
      invalidLength: `Length needs to be ${validatorValue}`,
      invalidMustLength: `Minimum Length ${validatorValue}`,
      noNumericCharacter: 'A numeric character is required',
      noUppercaseCharacter: 'An uppercase character is required',
      noLowercaseCharacter: 'A lowercase character is required',
      passwordMismatch: 'The passwords do not match',
      emailNotExists: 'An account not exists with this email address',
      invalidTelephone: 'Invalid Telephone',
      invalidDigits: 'Only digit allowed',
      invalidCheckbox: 'Required',
      invalidAge: 'You are under 18',
      noSpecialCharacter: 'Special character is required',
      onlyCharacter: `${validatorValue} must be text`,
      invalidBudgetLength: `Maximum length can be ${validatorValue}`,
      invalidBudget: `Invalid decimal number`,
      invalidPostCode: `Invalid Postcode`,
      invalidLink: `Enter valid link`,
      trimStartError: `${validatorValue} has leading whitespace`,
      trimEndError: `${validatorValue} has trailing  whitespace`,
      invalidCommaEmail:`Enter mutiple email is not valid`,
    };

    return config[validatorName];
  }
}
