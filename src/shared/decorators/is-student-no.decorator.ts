import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStudentNo(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isLongerThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: number, args: ValidationArguments) {
          const str = value?.toString();
          return (
            typeof value === 'number' &&
            str.length === 4 &&
            /[1-3]/.test(str.at(0)) &&
            /[1-4]/.test(str.at(1)) &&
            /(([0-1]|2(?=[0-1]))[0-9])/.test(str.substring(2))
          );
        },
      },
    });
  };
}
