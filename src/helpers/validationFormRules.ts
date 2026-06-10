import {
  getCurrentTime,
  getTodayDate,
  isDateAfterToday,
  isDateTimeAfterNow,
} from "~/helpers/dateTimeHelpers"

export const validationRules = {
  required: (value: string | number | boolean) =>
      value !== null &&
      value !== undefined &&
      value !== '' ||
      "Este campo es requerido",

  textOnly: (value: string) =>
      /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]*$/.test(value) ||
      "Solo se permiten letras",

  email: (value: string) =>
      /^\S+@\S+\.\S+$/.test(value) ||
      "Correo inválido",

  number: (value: string | number) =>
      !isNaN(Number(value)) ||
      "Debe ser un número válido",

  decimal: (value: string | number) =>
      /^-?\d+(\.\d+)?$/.test(String(value)) ||
      "Debe ser un número decimal válido",

  positiveNumber: (value: string | number) =>
      Number(value) >= 0 ||
      "Debe ser mayor o igual a 0",

  money: (value: string | number) =>
      /^\d+(\.\d{1,2})?$/.test(String(value)) ||
      "Máximo 2 decimales",

  maxLength:
      (max: number) =>
          (value: string) =>
              !value ||
              value.length <= max ||
              `Máximo ${max} caracteres`,

  minLength:
      (min: number) =>
          (value: string) =>
              value?.length >= min ||
              `Debe tener al menos ${min} caracteres`,

  matchPassword:
      (password: string) =>
          (value: string) =>
              value === password ||
              "Las contraseñas no coinciden",

  ruc: (v: string) =>
      !v ||
      /^(10|15|16|17|20)\d{9}$/.test(v) ||
      'RUC inválido',

  phone: (v: string) =>
      !v ||
      /^\d{9}$/.test(v) ||
      'Teléfono inválido (9 dígitos)',

  onlyNumbers: (v: string) =>
      !v ||
      /^\d+$/.test(v) ||
      'Solo números',

  maxDateToday: (value: string) =>
      !value ||
      !isDateAfterToday(value) ||
      "La fecha no puede ser posterior a hoy",

  maxTimeForDate: (date: string) => (time: string) => {
    if (!time || !date) return true
    if (date !== getTodayDate()) return true
    return time <= getCurrentTime() || "La hora no puede ser posterior a la actual"
  },

  maxDateTimeNow: (date: string, time: string) => () =>
      !date ||
      !time ||
      !isDateTimeAfterNow(date, time) ||
      "La fecha y hora no pueden ser posteriores al momento actual",
}